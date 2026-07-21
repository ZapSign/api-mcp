import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  oauthProviderFetch: vi.fn(),
  createMcpHandler: vi.fn(),
}));

vi.mock('@cloudflare/workers-oauth-provider', () => ({
  OAuthProvider: class {
    fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
      return testState.oauthProviderFetch(request, env, ctx);
    }
  },
}));

vi.mock('agents/mcp', () => ({
  createMcpHandler: testState.createMcpHandler,
}));

type WorkerHandler = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response>;
};

describe('browser GET /mcp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    testState.oauthProviderFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401 }),
    );
    testState.createMcpHandler.mockReturnValue(async () => new Response(null));
  });

  it(
    'returns an HTML connect page for browser navigations without a bearer token',
    async () => {
      const worker = (await import('../../src/index.js')).default as WorkerHandler;

      const response = await worker.fetch(
        new Request('https://mcp.zapsign.com.br/mcp', {
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'Sec-Fetch-Dest': 'document',
          },
        }),
        { OAUTH_KV: { get: vi.fn() } },
        {},
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
      const html = await response.text();
      expect(html).toContain('mcp.zapsign.com.br/mcp');
      expect(html).toContain('Conectar');
      expect(testState.oauthProviderFetch).not.toHaveBeenCalled();
    },
    15_000,
  );

  it(
    'does not intercept MCP protocol requests that accept event-stream',
    async () => {
      const worker = (await import('../../src/index.js')).default as WorkerHandler;

      await worker.fetch(
        new Request('https://mcp.zapsign.com.br/mcp', {
          headers: {
            Accept: 'application/json, text/event-stream',
          },
        }),
        { OAUTH_KV: { get: vi.fn() } },
        {},
      );

      expect(testState.oauthProviderFetch).toHaveBeenCalledOnce();
    },
    15_000,
  );
});
