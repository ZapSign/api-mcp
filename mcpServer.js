#!/usr/bin/env node

import dotenv from 'dotenv';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { discoverTools } from './lib/tools.js';
import { getConfig, getServerConfig } from './lib/config.js';
import logger from './lib/logger.js';
import authService from './lib/services/auth.js';
import zapsignApiClient from './lib/services/zapsignApi.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Get server configuration
const serverConfig = getServerConfig();
const config = getConfig();

function transformTools (tools) {
  return tools
    .map((tool) => {
      const definitionFunction = tool.definition?.function;
      if (!definitionFunction) {return;}
      return {
        name: definitionFunction.name,
        description: definitionFunction.description,
        inputSchema: definitionFunction.parameters,
      };
    })
    .filter(Boolean);
}

function setupServerHandlers (server, tools) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => {
    logger.info('Listing available tools', { count: tools.length });
    return {
      tools: transformTools(tools),
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments;

    logger.info('Tool execution request', { toolName, args });

    // Find the requested tool
    const tool = tools.find((t) => t.definition.function.name === toolName);
    if (!tool) {
      logger.error('Unknown tool requested', { toolName });
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }

    // Validate required parameters
    const requiredParameters = tool.definition?.function?.parameters?.required || [];
    const missingParameters = requiredParameters.filter(param => !(param in args));

    if (missingParameters.length > 0) {
      logger.error('Missing required parameters', { toolName, missingParameters });
      throw new McpError(
        ErrorCode.InvalidParams,
        `Missing required parameters: ${missingParameters.join(', ')}`,
      );
    }

    try {
      // Execute the tool
      const startTime = Date.now();
      const result = await tool.function(args);
      const executionTime = Date.now() - startTime;

      logger.info('Tool execution completed', {
        toolName,
        executionTime,
        resultSize: JSON.stringify(result).length,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Tool execution failed', {
        toolName,
        error: error.message,
        stack: error.stack,
      });

      // Convert different error types to MCP errors
      if (error instanceof McpError) {
        throw error;
      }

      // Handle ZapSign API specific errors
      if (error.context && error.context.method) {
        throw new McpError(
          ErrorCode.InternalError,
          `ZapSign API error: ${error.message}`,
        );
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution error: ${error.message}`,
      );
    }
  });
}

async function initializeServer () {
  try {
    // Validate configuration
    logger.info('Initializing MCP server', { config: serverConfig });

    // Check authentication
    const authStatus = await authService.getAuthenticationStatus();
    logger.info('Authentication status', authStatus);

    if (!authStatus.isValid) {
      logger.warn('No valid API key found. Some tools may not work correctly.');
    }

    // Check ZapSign API health
    const apiHealth = await zapsignApiClient.healthCheck();
    if (!apiHealth) {
      logger.warn('ZapSign API health check failed. Server will continue but API calls may fail.');
    }

    // Discover available tools
    const tools = await discoverTools();
    logger.info('Tools discovered', { count: tools.length });

    return tools;
  } catch (error) {
    logger.error('Server initialization failed', { error: error.message });
    throw error;
  }
}

async function run () {
  try {
    const args = process.argv.slice(2);
    const isSSE = args.includes('--sse');

    logger.info('Starting MCP server', {
      mode: isSSE ? 'SSE' : 'STDIO',
      version: serverConfig.version,
    });

    // Initialize server and discover tools
    const tools = await initializeServer();

    if (isSSE) {
      await runSSEServer(tools);
    } else {
      await runStdioServer(tools);
    }
  } catch (error) {
    logger.error('Failed to start MCP server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

function runSSEServer (tools) {
  const app = express();
  const transports = {};
  const servers = {};

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const authStatus = await authService.getAuthenticationStatus();
      const apiHealth = await zapsignApiClient.healthCheck();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: serverConfig,
        authentication: authStatus,
        api: { healthy: apiHealth },
        tools: { count: tools.length },
      });
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // SSE endpoint for MCP connections
  app.get('/sse', async (req, res) => {
    logger.info('New SSE connection established');

    // Create a new Server instance for each session
    const server = new Server(
      {
        name: serverConfig.name,
        version: serverConfig.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    server.onerror = (error) => {
      logger.error('MCP server error', { error: error.message });
    };

    await setupServerHandlers(server, tools);

    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    servers[transport.sessionId] = server;

    res.on('close', async () => {
      logger.info('SSE connection closed', { sessionId: transport.sessionId });
      delete transports[transport.sessionId];
      await server.close();
      delete servers[transport.sessionId];
    });

    await server.connect(transport);
    logger.info('SSE connection ready', { sessionId: transport.sessionId });
  });

  // Message handling endpoint
  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    const server = servers[sessionId];

    if (transport && server) {
      try {
        await transport.handlePostMessage(req, res);
      } catch (error) {
        logger.error('Message handling error', {
          sessionId,
          error: error.message,
        });
        res.status(500).json({ error: 'Message handling failed' });
      }
    } else {
      logger.warn('No transport/server found for session', { sessionId });
      res.status(400).send('No transport/server found for sessionId');
    }
  });

  // Start HTTP server
  const port = config.port;
  const host = config.host;

  app.listen(port, host, () => {
    logger.info('SSE Server running', { host, port });
    logger.info(`Health check available at http://${host}:${port}/health`);
    logger.info(`SSE endpoint available at http://${host}:${port}/sse`);
  });
}

async function runStdioServer (tools) {
  logger.info('Starting STDIO server');

  // Create single server instance for stdio mode
  const server = new Server(
    {
      name: serverConfig.name,
      version: serverConfig.version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.onerror = (error) => {
    logger.error('MCP server error', { error: error.message });
  };

  await setupServerHandlers(server, tools);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    await server.close();
    process.exit(0);
  });

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('STDIO server ready');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
run().catch((error) => {
  logger.error('Server startup failed', { error: error.message, stack: error.stack });
  process.exit(1);
});
