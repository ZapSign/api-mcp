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
        {
          OAUTH_KV: { get: vi.fn() },
          GA4_MEASUREMENT_ID: '',
          CLARITY_PROJECT_ID: '',
        },
        {},
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
      expect(response.headers.get('Content-Language')).toBe('en');
      expect(response.headers.get('Content-Security-Policy')).toContain('googletagmanager.com');
      expect(response.headers.get('Content-Security-Policy')).not.toContain("script-src 'none'");
      const html = await response.text();
      expect(html).toContain('mcp.zapsign.com.br/mcp');
      expect(html).toContain('Connect to ZapSign');
      expect(html).toContain('How to connect in ChatGPT');
      expect(html).toContain('Open ChatGPT tutorial');
      expect(html).toContain('https://agents.zapsign.com.br/tutoriais/chatgpt.html');
      expect(html).toContain('Connector documentation');
      expect(html).toContain('ChatGPT (or another MCP client, such as Claude)');
      expect(html).toContain('Apps &amp; Connectors');
      expect(html).toContain('lang="en"');
      expect(html).toContain('politica-de-privacidade');
      expect(html).not.toContain('tutoriais/claude.html');
      expect(html).not.toContain('<script');
      expect(testState.oauthProviderFetch).not.toHaveBeenCalled();
    },
    15_000,
  );

  it(
    'injects consent analytics on the landing page when measurement IDs are set',
    async () => {
      const worker = (await import('../../src/index.js')).default as WorkerHandler;

      const response = await worker.fetch(
        new Request('https://mcp.zapsign.com.br/mcp', {
          headers: {
            Accept: 'text/html',
            'Sec-Fetch-Dest': 'document',
          },
        }),
        {
          OAUTH_KV: { get: vi.fn() },
          GA4_MEASUREMENT_ID: 'G-LANDING1',
          CLARITY_PROJECT_ID: 'landingclarity',
        },
        {},
      );

      const html = await response.text();
      expect(html).toContain('zs-consent');
      expect(html).toContain('G-LANDING1');
      expect(html).toContain('landingclarity');
    },
    15_000,
  );

  it(
    'localizes the connect page from Accept-Language pt-BR',
    async () => {
      const worker = (await import('../../src/index.js')).default as WorkerHandler;

      const response = await worker.fetch(
        new Request('https://mcp.zapsign.com.br/mcp', {
          headers: {
            Accept: 'text/html',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Sec-Fetch-Dest': 'document',
          },
        }),
        { OAUTH_KV: { get: vi.fn() } },
        {},
      );

      expect(response.headers.get('Content-Language')).toBe('pt-BR');
      const html = await response.text();
      expect(html).toContain('Conectar ao ZapSign');
      expect(html).toContain('lang="pt-BR"');
    },
    15_000,
  );

  it(
    'honors ?lang=es over Accept-Language',
    async () => {
      const worker = (await import('../../src/index.js')).default as WorkerHandler;

      const response = await worker.fetch(
        new Request('https://mcp.zapsign.com.br/mcp?lang=es', {
          headers: {
            Accept: 'text/html',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Dest': 'document',
          },
        }),
        { OAUTH_KV: { get: vi.fn() } },
        {},
      );

      expect(response.headers.get('Content-Language')).toBe('es');
      const html = await response.text();
      expect(html).toContain('Conectar a ZapSign');
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
