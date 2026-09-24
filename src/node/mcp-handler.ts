/**
 * Per-request MCP handler using @modelcontextprotocol/sdk StreamableHTTPServerTransport.
 *
 * Creates a fresh McpServer per request (CVE GHSA-345p-7cg4-v4c7 parity with
 * the Workers implementation in src/server.ts) and wires it to a stateless
 * StreamableHTTPServerTransport.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../server.js';
import { logError } from '../utils/logger.js';

/**
 * Handles a single MCP POST or GET request.
 *
 * @param req  - Node.js IncomingMessage
 * @param res  - Node.js ServerResponse
 * @param authProps - Auth props injected into the per-request server context
 */
export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  authProps: Record<string, unknown>,
): Promise<void> {
  // Fresh server per request — no shared state across requests
  const server = createServer();

  // Stateless transport (no session ID) — each request is independent
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  // Inject auth props so tools can read them via getMcpAuthContext()
  // The SDK's WebStandardStreamableHTTPServerTransport exposes auth via
  // the requestContext; we adapt by patching the transport's authContext.
  // For the Node path, tools use getAuthProps() / configureStdioAuth() pattern.
  // We store authProps in a request-scoped AsyncLocalStorage set by the caller.
  void authProps; // authProps are set via setCurrentAuthProps in main.ts

  try {
    await server.connect(transport);

    await transport.handleRequest(req, res);

    await transport.close();
  } catch (error) {
    logError('mcp_request_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'unknown',
    });
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal_server_error' }));
    }
  }
}

/**
 * Handles a single MCP request via the ID server.
 */
export async function handleIdMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  createServerFn: () => import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
): Promise<void> {
  const server = createServerFn();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
    await transport.close();
  } catch (error) {
    logError('id_mcp_request_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'unknown',
    });
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal_server_error' }));
    }
  }
}
