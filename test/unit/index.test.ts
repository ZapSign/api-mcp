import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  apiHandler: undefined,
  createMcpHandler: vi.fn(),
  oauthProviderOptions: undefined,
  oauthProviderFetch: vi.fn(),
}));

vi.mock('@cloudflare/workers-oauth-provider', () => ({
  OAuthProvider: class {
    constructor(options: { apiHandler: unknown }) {
      testState.apiHandler = options.apiHandler;
      testState.oauthProviderOptions = options;
    }

    fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
      return testState.oauthProviderFetch(request, env, ctx);
    }
  },
}));

vi.mock('agents/mcp', () => ({
  createMcpHandler: testState.createMcpHandler,
}));

type ApiHandler = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response>;
};

type OAuthProviderOptions = {
  apiRoute?: string | string[];
  authorizeEndpoint?: string;
  tokenEndpoint?: string;
  clientRegistrationEndpoint?: string;
  allowPlainPKCE?: boolean;
  scopesSupported?: string[];
  resourceMetadata?: {
    resource?: string;
    authorization_servers?: string[];
  };
};

type WorkerHandler = ApiHandler;

type McpHandlerOptions = {
  corsOptions?: {
    exposeHeaders?: string;
  };
};

function isApiHandler(value: unknown): value is ApiHandler {
  if (typeof value !== 'object' || value === null || !('fetch' in value)) {
    return false;
  }

  return typeof value.fetch === 'function';
}

function createMockMcpHandler(
  _server: unknown,
  options?: McpHandlerOptions,
): ApiHandler['fetch'] {
  const exposedHeaders = options?.corsOptions?.exposeHeaders ?? 'mcp-session-id';
  return async () =>
    new Response(null, {
      headers: { 'Access-Control-Expose-Headers': exposedHeaders },
    });
}

describe('MCP CORS configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    testState.apiHandler = undefined;
    testState.oauthProviderOptions = undefined;
    testState.createMcpHandler.mockImplementation(createMockMcpHandler);
    testState.oauthProviderFetch.mockResolvedValue(new Response('ok'));
  });

  it(
    'does not advertise session headers from the stateless handler',
    async () => {
      await import('../../src/index.js');

      if (!isApiHandler(testState.apiHandler)) {
        throw new Error('Expected the OAuth provider to receive the MCP handler');
      }

      const response = await testState.apiHandler.fetch(
        new Request('https://mcp.example.com/mcp'),
        {},
        {},
      );
      const exposedHeaders = response.headers.get('Access-Control-Expose-Headers');

      expect(testState.createMcpHandler).toHaveBeenCalledWith(expect.anything());
      expect(exposedHeaders).toBeNull();
    },
    15_000,
  );

  it(
    'configures canonical OAuth metadata and S256-only PKCE',
    async () => {
      await import('../../src/index.js');

      const options = testState.oauthProviderOptions as OAuthProviderOptions;

      expect(options.apiRoute).toBe('https://mcp.zapsign.com.br/mcp');
      expect(options.authorizeEndpoint).toBe('https://mcp.zapsign.com.br/authorize');
      expect(options.tokenEndpoint).toBe('https://mcp.zapsign.com.br/token');
      expect(options.clientRegistrationEndpoint).toBe('https://mcp.zapsign.com.br/register');
      expect(options.allowPlainPKCE).toBe(false);
      expect(options.scopesSupported).toEqual([
        'documents:read',
        'documents:write',
        'signers:read',
        'signers:write',
        'templates:read',
        'templates:write',
        'webhooks:read',
        'webhooks:write',
        'partner:write',
      ]);
      expect(options.resourceMetadata).toEqual({
        resource: 'https://mcp.zapsign.com.br/mcp',
        authorization_servers: ['https://mcp.zapsign.com.br'],
        scopes_supported: options.scopesSupported,
      });
    },
    15_000,
  );

  it('rejects a root audience for the canonical MCP resource', async () => {
    const token = 'user:grant:secret';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenId = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const env = {
      OAUTH_KV: {
        get: vi.fn(async (key: string) => (key === `token:user:grant:${tokenId}`
          ? { audience: 'https://mcp.zapsign.com.br' }
          : null)),
      },
    };
    const worker = (await import('../../src/index.js')).default as WorkerHandler;

    const response = await worker.fetch(
      new Request('https://mcp.zapsign.com.br/mcp', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env,
      {},
    );

    expect(response.status).toBe(401);
    expect(testState.oauthProviderFetch).not.toHaveBeenCalled();
  });

  it('allows the canonical MCP audience to reach the MCP handler', async () => {
    const token = 'user:grant:secret';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenId = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const env = {
      OAUTH_KV: {
        get: vi.fn(async (key: string) => (key === `token:user:grant:${tokenId}`
          ? { audience: 'https://mcp.zapsign.com.br/mcp' }
          : null)),
      },
    };
    const worker = (await import('../../src/index.js')).default as WorkerHandler;

    const response = await worker.fetch(
      new Request('https://mcp.zapsign.com.br/mcp', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env,
      {},
    );

    expect(response.status).toBe(200);
    expect(testState.oauthProviderFetch).toHaveBeenCalledOnce();
  });
});
