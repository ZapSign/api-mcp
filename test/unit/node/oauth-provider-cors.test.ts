/**
 * Regression test: NodeOAuthProvider dropped the CORS contract that
 * @cloudflare/workers-oauth-provider applied automatically (OPTIONS
 * preflight + Access-Control-* headers on metadata/token/registration/api
 * responses). A browser-based OAuth client's DCR fetch() to /register sends
 * a preflight OPTIONS first; without these headers the browser blocks the
 * request before the real POST is ever sent, surfacing to Claude as
 * "could not register with the login service" — even though a direct
 * (non-browser) POST to /register works fine.
 */
import { describe, it, expect } from 'vitest';
import { NodeOAuthProvider } from '../../../src/node/oauth/provider.js';
import type { KvStore } from '../../../src/store/kv-store.js';
import type { NodeOAuthConfig } from '../../../src/node/oauth/types.js';
import type { NodeEnv } from '../../../src/node/env.js';

interface KvEntry {
  value: string;
  expiresAt?: number;
}

class InMemoryKvStore implements KvStore {
  private readonly data = new Map<string, KvEntry>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key)?.value ?? null;
  }

  async put(key: string, value: string, options?: { ttlSeconds?: number }): Promise<void> {
    const expiresAt = options?.ttlSeconds !== undefined
      ? Math.floor(Date.now() / 1_000) + options.ttlSeconds
      : undefined;
    this.data.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async getJson(key: string): Promise<unknown | null> {
    const raw = await this.get(key);
    return raw === null ? null : JSON.parse(raw) as unknown;
  }

  async putJson(key: string, value: unknown, options?: { ttlSeconds?: number }): Promise<void> {
    await this.put(key, JSON.stringify(value), options);
  }
}

const CONFIG: NodeOAuthConfig = {
  apiRoute: '/mcp',
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
  clientIdMetadataDocumentEnabled: true,
  allowPlainPKCE: false,
  scopesSupported: ['documents:read'],
  refreshTokenTTL: 2_592_000,
  resourceMetadata: {
    resource: 'https://mcp.zapsign.com.br/mcp',
    authorization_servers: ['https://mcp.zapsign.com.br'],
    scopes_supported: ['documents:read'],
  },
  issuer: 'https://mcp.zapsign.com.br',
};

function buildProvider(): NodeOAuthProvider {
  return new NodeOAuthProvider({
    config: CONFIG,
    kv: new InMemoryKvStore(),
    authHandler: async () => new Response('auth-handler', { status: 200 }),
    apiHandler: async () => new Response('api-handler', { status: 200 }),
  });
}

describe('NodeOAuthProvider CORS', () => {
  it('answers an OPTIONS preflight to /register with 204 and CORS headers', async () => {
    const provider = buildProvider();
    const request = new Request('https://mcp.zapsign.com.br/register', {
      method: 'OPTIONS',
      headers: { Origin: 'https://claude.ai' },
    });

    const response = await provider.handle(request, {} as NodeEnv);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://claude.ai');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, *');
  });

  it('adds CORS headers to a real POST /register response when Origin is present', async () => {
    const provider = buildProvider();
    const request = new Request('https://mcp.zapsign.com.br/register', {
      method: 'POST',
      headers: { Origin: 'https://claude.ai', 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect_uris: ['https://claude.ai/api/mcp/auth_callback'] }),
    });

    const response = await provider.handle(request, {} as NodeEnv);

    expect(response.status).toBe(201);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://claude.ai');
  });

  it('answers an OPTIONS preflight to /token with 204 and CORS headers', async () => {
    const provider = buildProvider();
    const request = new Request('https://mcp.zapsign.com.br/token', {
      method: 'OPTIONS',
      headers: { Origin: 'https://claude.ai' },
    });

    const response = await provider.handle(request, {} as NodeEnv);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://claude.ai');
  });

  it('does not add CORS headers when the request has no Origin header', async () => {
    const provider = buildProvider();
    const request = new Request('https://mcp.zapsign.com.br/.well-known/oauth-authorization-server');

    const response = await provider.handle(request, {} as NodeEnv);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('reflects Origin on metadata GET responses', async () => {
    const provider = buildProvider();
    const request = new Request('https://mcp.zapsign.com.br/.well-known/oauth-protected-resource', {
      headers: { Origin: 'https://claude.ai' },
    });

    const response = await provider.handle(request, {} as NodeEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://claude.ai');
  });
});
