/**
 * Per-request MCP handler using the SDK's Fetch-native
 * WebStandardStreamableHTTPServerTransport.
 *
 * Creates a fresh McpServer per request (CVE GHSA-345p-7cg4-v4c7 parity with
 * the Workers implementation in src/server.ts). Operates directly on Fetch
 * Request/Response — no Node IncomingMessage/ServerResponse involved, so
 * there's no req/res bridge whose body-forwarding can go wrong.
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createServer } from '../server.js';
import { logError } from '../utils/logger.js';

function internalErrorResponse(): Response {
  return new Response(JSON.stringify({ error: 'internal_server_error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handles a single MCP request for the ZapSign signing server.
 *
 * @param request - Fetch API Request for the MCP endpoint
 */
export async function handleMcpWebRequest(request: Request): Promise<Response> {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    logError('mcp_request_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'unknown',
    });
    return internalErrorResponse();
  }
}

/**
 * Handles a single MCP request via the ID server.
 */
export async function handleIdMcpWebRequest(
  request: Request,
  createServerFn: () => McpServer,
): Promise<Response> {
  const server = createServerFn();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    logError('id_mcp_request_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'unknown',
    });
    return internalErrorResponse();
  }
}
