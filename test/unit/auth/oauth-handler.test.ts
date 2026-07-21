import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthHandler } from '../../../src/auth/oauth-handler.js';
import { MOCK_API_TOKEN } from '../../mocks/zapsign-responses.js';

// ---------------------------------------------------------------------------
// KV mock
// ---------------------------------------------------------------------------

interface MockKv {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  _store: Map<string, string>;
}

function createMockKv(): MockKv {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    _store: store,
  };
}

async function signOAuthRequest(secret: string, oauthReqInfoB64: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(oauthReqInfoB64));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function bindCsrfToken(
  kv: MockKv,
  csrfToken: string,
  oauthReqInfoB64: string,
  secret: string,
): Promise<void> {
  const binding = await signOAuthRequest(secret, oauthReqInfoB64);
  kv._store.set(`csrf:${csrfToken}`, binding);
}

// ---------------------------------------------------------------------------
// OAuth provider mock
// ---------------------------------------------------------------------------

function createMockOAuthProvider(oauthReqInfo?: Record<string, unknown>) {
  const defaultRequest = {
    responseType: 'code',
    clientId: 'test-client',
    redirectUri: 'https://client.example.test/callback',
    scope: ['documents:read'],
    state: 'test-state',
    codeChallenge: 'test-code-challenge',
    codeChallengeMethod: 'S256',
  };
  return {
    parseAuthRequest: vi.fn(async () => ({ ...defaultRequest, ...oauthReqInfo })),
    lookupClient: vi.fn(async () => ({
      clientId: 'test-client',
      clientName: 'Test Client',
      redirectUris: ['https://client.example.test/callback'],
    })),
    completeAuthorization: vi.fn(async () => ({ redirectTo: 'https://example.com/callback?code=abc' })),
  };
}

// ---------------------------------------------------------------------------
// Env factory
// ---------------------------------------------------------------------------

function createMockEnv(overrides?: { oauthProvider?: ReturnType<typeof createMockOAuthProvider>; kv?: ReturnType<typeof createMockKv> }) {
  const kv = overrides?.kv ?? createMockKv();
  const oauthProvider = overrides?.oauthProvider ?? createMockOAuthProvider();
  return {
    OAUTH_KV: kv,
    OAUTH_PROVIDER: oauthProvider,
    COOKIE_ENCRYPTION_KEY: 'test-secret-key-for-hmac-signing',
    ZAPSIGN_API_URL: 'https://sandbox.api.zapsign.com.br',
    ENVIRONMENT: 'sandbox',
  };
}

type MockEnv = ReturnType<typeof createMockEnv>;

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function makeRequest(method: string, path: string, options?: { headers?: Record<string, string>; body?: string }): Request {
  const url = `https://mcp.example.com${path}`;
  const init: RequestInit = { method, headers: options?.headers ?? {} };
  if (options?.body) {
    init.body = options.body;
  }
  return new Request(url, init);
}

async function callHandler(request: Request, env: MockEnv): Promise<Response> {
  return AuthHandler.fetch!(request, env as never, {} as never);
}

let fetchMock: ReturnType<typeof vi.fn>;
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  originalFetch = globalThis.fetch;
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/health');

    const response = await callHandler(request, env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('2.0.0');
    expect(typeof body.timestamp).toBe('string');
  });

  it('should include security headers', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/health');

    const response = await callHandler(request, env);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'none'");
  });
});

// ---------------------------------------------------------------------------
// Unknown routes → 404
// ---------------------------------------------------------------------------

describe('Unknown routes', () => {
  it('should return 404 for unregistered path', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/unknown');

    const response = await callHandler(request, env);

    expect(response.status).toBe(404);
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('should return 404 for wrong method on known path', async () => {
    const env = createMockEnv();
    const request = makeRequest('DELETE', '/health');

    const response = await callHandler(request, env);

    expect(response.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /authorize
// ---------------------------------------------------------------------------

describe('GET /authorize', () => {
  it('should render token page with CSRF token', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/authorize', {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(html).toContain('ZapSign');
    expect(html).toContain('csrfToken');
    expect(html).toContain('hmacSignature');
    expect(html).toContain('apiToken');
  });

  it('should return 400 when client is unknown', async () => {
    const provider = createMockOAuthProvider();
    provider.lookupClient.mockResolvedValueOnce(null);
    const env = createMockEnv({ oauthProvider: provider });
    const request = makeRequest('GET', '/authorize');

    const response = await callHandler(request, env);

    expect(response.status).toBe(400);
  });

  it('should return an OAuth error instead of 500 when parsing fails', async () => {
    const provider = createMockOAuthProvider();
    provider.parseAuthRequest.mockRejectedValueOnce(new Error('Malformed authorization request'));
    const env = createMockEnv({ oauthProvider: provider });

    const response = await callHandler(makeRequest('GET', '/authorize'), env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.error).toBe('invalid_request');
  });

  it('should reject incomplete authorization requests with 400', async () => {
    const provider = createMockOAuthProvider();
    provider.parseAuthRequest.mockResolvedValueOnce({ clientId: 'test-client' } as never);
    const env = createMockEnv({ oauthProvider: provider });

    const response = await callHandler(makeRequest('GET', '/authorize'), env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.error).toBe('invalid_request');
  });

  it('should reject unknown OAuth scopes with invalid_scope', async () => {
    const provider = createMockOAuthProvider({ scope: ['documents:read', 'unknown:scope'] });
    const env = createMockEnv({ oauthProvider: provider });

    const response = await callHandler(makeRequest('GET', '/authorize'), env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.error).toBe('invalid_scope');
    expect(body.error_description).toContain('unknown:scope');
  });

  it('should require S256 PKCE authorization requests', async () => {
    const provider = createMockOAuthProvider({ codeChallengeMethod: 'plain' });
    const env = createMockEnv({ oauthProvider: provider });

    const response = await callHandler(makeRequest('GET', '/authorize'), env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.error).toBe('invalid_request');
  });

  it('should store CSRF token in KV', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ kv });
    const request = makeRequest('GET', '/authorize');

    await callHandler(request, env);

    expect(kv.put).toHaveBeenCalledTimes(1);
    const putCall = (kv.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(putCall[0]).toMatch(/^csrf:/);
    expect(typeof putCall[1]).toBe('string');
    expect(putCall[1]).not.toBe('1');
    expect(putCall[2]).toEqual({ expirationTtl: 300 });
  });

  it('should render in Portuguese for pt-BR Accept-Language', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/authorize', {
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(html).toContain('Conectar ao ZapSign');
    expect(html).toContain('lang="pt-BR"');
  });

  it('should render in Spanish for es Accept-Language', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/authorize', {
      headers: { 'Accept-Language': 'es-ES,es;q=0.9' },
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(html).toContain('Conectar a ZapSign');
    expect(html).toContain('lang="es"');
  });

  it('should render in English for en Accept-Language', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/authorize', {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(html).toContain('Connect to ZapSign');
    expect(html).toContain('lang="en"');
  });

  it('should default to English when Accept-Language is missing', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/authorize');

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(response.headers.get('Content-Language')).toBe('en');
    expect(response.headers.get('Vary')).toBe('Accept-Language');
    expect(html).toContain('Connect to ZapSign');
    expect(html).toContain('lang="en"');
  });

  it('should include guided steps and dashboard link', async () => {
    const env = createMockEnv();
    const request = makeRequest('GET', '/authorize', {
      headers: { 'Accept-Language': 'en' },
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(html).toContain('step-number');
    expect(html).toContain('sandbox.app.zapsign.com.br');
    expect(html).toContain('Sign up for free');
  });

  it('should show the escaped client, redirect host, and requested scopes before token entry', async () => {
    const clientName = 'Client <script>alert(1)</script>';
    const provider = createMockOAuthProvider({
      clientId: 'client-id',
      redirectUri: 'https://redirect.example.test/callback',
      scope: ['documents:read', 'signers:write'],
    });
    provider.lookupClient.mockResolvedValueOnce({
      clientId: 'client-id',
      clientName,
      redirectUris: ['https://redirect.example.test/callback'],
    });
    const env = createMockEnv({ oauthProvider: provider });
    const request = makeRequest('GET', '/authorize', {
      headers: { 'Accept-Language': 'en' },
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(html).toContain('Client &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain(clientName);
    expect(html).toContain('redirect.example.test');
    expect(html).toContain('documents:read');
    expect(html).toContain('signers:write');
    expect(html.indexOf('signers:write')).toBeLessThan(html.indexOf('name="apiToken"'));
  });

  it('should show deletion permission in every supported language before token entry', async () => {
    const deletionPermissions = {
      'pt-BR': 'Excluir documentos e remover signatários',
      en: 'Delete documents and remove signers',
      es: 'Eliminar documentos y quitar firmantes',
    } as const;

    for (const [language, permission] of Object.entries(deletionPermissions)) {
      const env = createMockEnv();
      const request = makeRequest('GET', '/authorize', {
        headers: { 'Accept-Language': language },
      });

      const response = await callHandler(request, env);
      const html = await response.text();

      expect(html).toContain(permission);
      expect(html.indexOf(permission)).toBeLessThan(html.indexOf('name="apiToken"'));
    }
  });
});

// ---------------------------------------------------------------------------
// POST /authorize/login — security validations
// ---------------------------------------------------------------------------

describe('POST /authorize/login — security', () => {
  function buildTokenBody(csrfToken: string, hmacSignature: string): string {
    const params = new URLSearchParams({
      apiToken: MOCK_API_TOKEN,
      oauthReqInfo: btoa(JSON.stringify({ clientId: 'test-client', scope: ['documents:read'] })),
      csrfToken,
      hmacSignature,
      lang: 'en',
    });
    return params.toString();
  }

  it('should reject request with invalid CSRF token', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ kv });

    const body = buildTokenBody('invalid-csrf-token', 'some-hmac');
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(response.status).toBe(403);
    expect(html).toContain('Session expired');
  });

  it('should reject a non-canonical Origin before processing credentials', async () => {
    const env = createMockEnv();
    const request = makeRequest('POST', '/authorize/login', {
      headers: {
        Origin: 'https://evil.example.test',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'apiToken=unexpected',
    });

    const response = await callHandler(request, env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(403);
    expect(body.error).toBe('invalid_request');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should reject request with invalid HMAC signature', async () => {
    const kv = createMockKv();
    const csrfToken = crypto.randomUUID();
    const env = createMockEnv({ kv });

    const oauthReqInfoB64 = btoa(JSON.stringify({ clientId: 'test-client', scope: ['documents:read'] }));
    await bindCsrfToken(kv, csrfToken, oauthReqInfoB64, env.COOKIE_ENCRYPTION_KEY);
    const params = new URLSearchParams({
      apiToken: MOCK_API_TOKEN,
      oauthReqInfo: oauthReqInfoB64,
      csrfToken,
      hmacSignature: btoa('tampered-hmac-signature-bytes-here'),
      lang: 'en',
    });
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain('Invalid request');
  });

  it('should not re-sign or reflect a tampered OAuth request', async () => {
    const kv = createMockKv();
    const csrfToken = crypto.randomUUID();
    const env = createMockEnv({ kv });
    const payload = `\"><img src=x onerror='alert(1)'>`;
    await bindCsrfToken(kv, csrfToken, payload, env.COOKIE_ENCRYPTION_KEY);
    const body = new URLSearchParams({
      apiToken: MOCK_API_TOKEN,
      oauthReqInfo: payload,
      csrfToken,
      hmacSignature: btoa('tampered-hmac-signature-bytes-here'),
      lang: 'en',
    }).toString();
    const request = makeRequest('POST', '/authorize/login', {
      headers: {
        Origin: 'https://mcp.zapsign.com.br',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).not.toContain(payload);
    expect(html).not.toContain('name="oauthReqInfo"');
    expect(html).not.toContain('name="hmacSignature"');
    expect(kv.put).not.toHaveBeenCalled();
  });

  it('should consume CSRF token on verification (one-time use)', async () => {
    const kv = createMockKv();
    const csrfToken = crypto.randomUUID();
    const env = createMockEnv({ kv });
    const oauthReqInfoB64 = btoa(JSON.stringify({ clientId: 'test-client', scope: ['documents:read'] }));
    await bindCsrfToken(kv, csrfToken, oauthReqInfoB64, env.COOKIE_ENCRYPTION_KEY);

    const body = new URLSearchParams({
      apiToken: MOCK_API_TOKEN,
      oauthReqInfo: oauthReqInfoB64,
      csrfToken,
      hmacSignature: btoa('wrong-hmac-value-for-test'),
      lang: 'en',
    }).toString();
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    await callHandler(request, env);

    expect(kv.delete).toHaveBeenCalledWith(`csrf:${csrfToken}`);
  });

  it('should reject a valid nonce reused with a different OAuth request', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ kv });
    const csrfToken = crypto.randomUUID();
    const originalRequest = btoa(JSON.stringify({
      clientId: 'client-one',
      redirectUri: 'https://client-one.example.test/callback',
      scope: ['documents:read'],
    }));
    const replacementRequest = btoa(JSON.stringify({
      clientId: 'client-two',
      redirectUri: 'https://client-two.example.test/callback',
      scope: ['documents:write'],
    }));
    await bindCsrfToken(
      kv,
      csrfToken,
      originalRequest,
      env.COOKIE_ENCRYPTION_KEY,
    );
    const hmacSignature = await signOAuthRequest(
      env.COOKIE_ENCRYPTION_KEY,
      replacementRequest,
    );
    const body = new URLSearchParams({
      apiToken: MOCK_API_TOKEN,
      oauthReqInfo: replacementRequest,
      csrfToken,
      hmacSignature,
      lang: 'en',
    }).toString();
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const response = await callHandler(request, env);

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /authorize/login — token validation flow
// ---------------------------------------------------------------------------

describe('POST /authorize/login — token validation', () => {
  async function buildValidTokenBody(
    env: MockEnv,
    oauthRequest: Record<string, unknown> = {
      clientId: 'test-client',
      redirectUri: 'https://client.example.test/callback',
      scope: ['documents:read'],
    },
  ): Promise<string> {
    const oauthReqInfoB64 = btoa(JSON.stringify(oauthRequest));

    const kv = env.OAUTH_KV;
    const csrfToken = crypto.randomUUID();
    const hmacSignature = await signOAuthRequest(
      env.COOKIE_ENCRYPTION_KEY,
      oauthReqInfoB64,
    );
    await bindCsrfToken(
      kv,
      csrfToken,
      oauthReqInfoB64,
      env.COOKIE_ENCRYPTION_KEY,
    );

    return new URLSearchParams({
      apiToken: MOCK_API_TOKEN,
      oauthReqInfo: oauthReqInfoB64,
      csrfToken,
      hmacSignature,
      lang: 'en',
    }).toString();
  }

  it('should redirect on valid API token', async () => {
    const env = createMockEnv();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }));

    const body = await buildValidTokenBody(env);
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const response = await callHandler(request, env);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://example.com/callback?code=abc');
  });

  it('should validate API token against ZapSign API', async () => {
    const env = createMockEnv();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }));

    const body = await buildValidTokenBody(env);
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    await callHandler(request, env);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/docs/');
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${MOCK_API_TOKEN}`);
  });

  it('should call completeAuthorization with AuthProps', async () => {
    const env = createMockEnv();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }));

    const body = await buildValidTokenBody(env);
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    await callHandler(request, env);

    const completeCalls = env.OAUTH_PROVIDER.completeAuthorization.mock.calls;
    expect(completeCalls).toHaveLength(1);
    const authArg = completeCalls[0][0] as Record<string, unknown>;
    expect(authArg.scope).toEqual(['documents:read']);
    const props = authArg.props as Record<string, unknown>;
    expect(props.zapSignApiToken).toBe(MOCK_API_TOKEN);
    expect(props.grantedScope).toBe('documents:read');
    expect(typeof props.userId).toBe('string');
  });

  it('should grant all supported scopes when the OAuth request omits scope', async () => {
    const env = createMockEnv();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }));

    const body = await buildValidTokenBody(env, {
      clientId: 'test-client',
      redirectUri: 'https://client.example.test/callback',
    });
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const response = await callHandler(request, env);

    expect(response.status).toBe(302);
    const authArg = env.OAUTH_PROVIDER.completeAuthorization.mock.calls[0][0] as Record<string, unknown>;
    const props = authArg.props as Record<string, unknown>;
    const expectedScopes = [
      'documents:read',
      'documents:write',
      'signers:read',
      'signers:write',
      'templates:read',
      'templates:write',
      'webhooks:read',
      'webhooks:write',
      'partner:write',
    ];

    expect(authArg.scope).toEqual(expectedScopes);
    expect(props.grantedScope).toBe(expectedScopes.join(' '));
  });

  it('should show error page on invalid API token (401)', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const env = createMockEnv();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Unauthorized' }), { status: 401 }));

    const body = await buildValidTokenBody(env);
    const request = makeRequest('POST', '/authorize/login', {
      headers: {
        'CF-Connecting-IP': '203.0.113.7',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Invalid API token');

    const outputs = logSpy.mock.calls.map(([message]) => JSON.parse(message as string));
    const authorizeFailure = outputs.find(
      (output) => output.event === 'authorize_failed',
    ) as Record<string, unknown> | undefined;

    expect(authorizeFailure).toMatchObject({
      event: 'authorize_failed',
      level: 'error',
      reason: 'api_token_invalid',
      cf_connecting_ip: '203.0.113.7',
    });
    expect(authorizeFailure?.error_id).toEqual(expect.any(String));
    expect(JSON.stringify(authorizeFailure)).not.toContain(MOCK_API_TOKEN);
  });

  it('should show error page when fetch throws', async () => {
    const env = createMockEnv();
    fetchMock.mockRejectedValueOnce(new Error('Network failure'));

    const body = await buildValidTokenBody(env);
    const request = makeRequest('POST', '/authorize/login', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const response = await callHandler(request, env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Invalid API token');
  });
});
