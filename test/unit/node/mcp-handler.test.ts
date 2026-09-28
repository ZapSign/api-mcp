/**
 * Regression test: the Node MCP route used to bridge a Fetch Request into a
 * fake IncomingMessage/ServerResponse pair (src/node/main.ts's old
 * requestToNodeBridge) so it could hand it to the SDK's Node-flavored
 * StreamableHTTPServerTransport. That transport converts req/res back into a
 * Web Standard Request internally (via getRequestListener) to read the body
 * — but the fake req only "fired" its buffered body's data/end callbacks
 * *after* the handler's promise had already resolved, so any request that
 * needed its body (every real MCP call, starting with `initialize`) failed.
 * This never surfaced in earlier testing because a prior bug (the
 * KvNamespaceAdapter one) crashed before ever reaching this code path.
 *
 * The fix replaces that bridge with the SDK's Fetch-native
 * WebStandardStreamableHTTPServerTransport, used directly on the Request we
 * already have. This test sends a real `initialize` call through
 * handleMcpWebRequest and asserts it completes successfully end-to-end.
 */
import { describe, it, expect } from 'vitest';
import { handleMcpWebRequest } from '../../../src/node/mcp-handler.js';

function initializeRequest(): Request {
  return new Request('https://mcp.zapsign.com.br/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    }),
  });
}

interface InitializeResult {
  jsonrpc: string;
  id: number;
  result?: { serverInfo?: { name?: string } };
}

function parseSseJsonRpcPayload(sseText: string): InitializeResult {
  const dataLine = sseText.split('\n').find((line) => line.startsWith('data: '));
  if (!dataLine) {
    throw new Error(`No SSE data line found in response: ${sseText}`);
  }
  return JSON.parse(dataLine.slice('data: '.length)) as InitializeResult;
}

describe('handleMcpWebRequest', () => {
  it('handles a real initialize request end-to-end without the Node req/res bridge', async () => {
    const response = await handleMcpWebRequest(initializeRequest());

    expect(response.status).toBe(200);
    const body = parseSseJsonRpcPayload(await response.text());
    expect(body.jsonrpc).toBe('2.0');
    expect(body.id).toBe(1);
    expect(body.result?.serverInfo?.name).toBe('mcp-server-zapsign');
  });
});
