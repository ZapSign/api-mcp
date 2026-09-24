/**
 * Tests: metadata endpoints + audience (rejectRootAudience) behavior.
 */
import { describe, it, expect } from 'vitest';
import {
  handleProtectedResourceMetadata,
  handleAuthorizationServerMetadata,
} from '../../../src/node/oauth/metadata.js';
import type { NodeOAuthConfig } from '../../../src/node/oauth/types.js';
import { CANONICAL_MCP_RESOURCE, DEFAULT_OAUTH_SCOPES, CANONICAL_OAUTH_ORIGIN, SUPPORTED_OAUTH_ORIGINS } from '../../../src/auth/types.js';
import { OAuthStore, generateOpaqueToken } from '../../../src/node/oauth/store.js';
import type { StoredToken } from '../../../src/node/oauth/types.js';

// ── Shared config ─────────────────────────────────────────────────────────────

const BASE_CONFIG: NodeOAuthConfig = {
  apiRoute: '/mcp',
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
  clientIdMetadataDocumentEnabled: true,
  allowPlainPKCE: false,
  scopesSupported: [...DEFAULT_OAUTH_SCOPES],
  refreshTokenTTL: 2_592_000,
  resourceMetadata: {
    resource: CANONICAL_MCP_RESOURCE,
    authorization_servers: [...SUPPORTED_OAUTH_ORIGINS],
    scopes_supported: [...DEFAULT_OAUTH_SCOPES],
  },
  issuer: CANONICAL_OAUTH_ORIGIN,
};

// ── In-memory KvStore ─────────────────────────────────────────────────────────

interface KvEntry {
  value: string;
  expiresAt?: number;
}

class InMemoryKvStore {
  private readonly data = new Map<string, KvEntry>();
  private _now: () => number = () => Math.floor(Date.now() / 1_000);

  setNow(fn: () => number): void {
    this._now = fn;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== undefined && entry.expiresAt <= this._now()) {
      return null;
    }
    return entry.value;
  }

  async put(key: string, value: string, options?: { ttlSeconds?: number }): Promise<void> {
    const expiresAt = options?.ttlSeconds !== undefined
      ? this._now() + options.ttlSeconds
      : undefined;
    this.data.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async getJson(key: string): Promise<unknown | null> {
    const raw = await this.get(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  async putJson(key: string, value: unknown, options?: { ttlSeconds?: number }): Promise<void> {
    await this.put(key, JSON.stringify(value), options);
  }
}

// ── Protected resource metadata ───────────────────────────────────────────────

describe('handleProtectedResourceMetadata', () => {
  it('should return correct resource field', async () => {
    const res = handleProtectedResourceMetadata(BASE_CONFIG);
    expect(res.status).toBe(200);

    const body = await res.json() as Record<string, unknown>;
    expect(body['resource']).toBe(CANONICAL_MCP_RESOURCE);
    expect(body['authorization_servers']).toContain(CANONICAL_OAUTH_ORIGIN);
    expect(Array.isArray(body['scopes_supported'])).toBe(true);
    expect(body['bearer_methods_supported']).toContain('header');
  });

  it('should set CORS headers', async () => {
    const res = handleProtectedResourceMetadata(BASE_CONFIG);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});

// ── Authorization server metadata ─────────────────────────────────────────────

describe('handleAuthorizationServerMetadata', () => {
  it('should return correct issuer and endpoints', async () => {
    const origin = 'https://mcp.zapsign.com.br';
    const res = handleAuthorizationServerMetadata(BASE_CONFIG, origin);
    expect(res.status).toBe(200);

    const body = await res.json() as Record<string, unknown>;
    expect(body['issuer']).toBe(CANONICAL_OAUTH_ORIGIN);
    expect(body['authorization_endpoint']).toBe(`${origin}/authorize`);
    expect(body['token_endpoint']).toBe(`${origin}/token`);
    expect(body['registration_endpoint']).toBe(`${origin}/register`);
    expect(body['code_challenge_methods_supported']).toContain('S256');
    expect(body['require_pkce']).toBe(true);
  });

  it('should list supported grant types', async () => {
    const res = handleAuthorizationServerMetadata(BASE_CONFIG, 'https://mcp.zapsign.com.br');
    const body = await res.json() as Record<string, unknown>;
    const grants = body['grant_types_supported'] as string[];
    expect(grants).toContain('authorization_code');
    expect(grants).toContain('refresh_token');
  });
});

// ── Root-audience token rejection ─────────────────────────────────────────────

describe('root-audience token rejection', () => {
  const now = Math.floor(Date.now() / 1_000);

  function makeStore(): { kv: InMemoryKvStore; store: OAuthStore } {
    const kv = new InMemoryKvStore();
    kv.setNow(() => now);
    const store = new OAuthStore(kv);
    return { kv, store };
  }

  async function storeTokenWithAudience(
    audience: string | string[] | undefined,
  ): Promise<{ token: string; store: OAuthStore }> {
    const { store } = makeStore();
    const token = generateOpaqueToken();
    const data: StoredToken = {
      clientId: 'c1',
      userId: 'u1',
      scope: ['documents:read'],
      props: { userId: 'u1', zapSignApiToken: 'tok' },
      audience,
      createdAt: now,
      expiresAt: now + 3600,
    };
    await store.putToken(token, data);
    return { token, store };
  }

  it('should find a non-root-audience token (MCP resource path)', async () => {
    // Audience = /mcp — NOT root, so it should NOT be rejected
    const { token, store } = await storeTokenWithAudience('https://mcp.zapsign.com.br/mcp');
    const stored = await store.getToken(token);
    expect(stored).not.toBeNull();

    const audiences = Array.isArray(stored?.audience)
      ? stored?.audience
      : stored?.audience ? [stored.audience] : [];
    const isRoot = (value: string) => {
      try {
        const u = new URL(value);
        return (u.pathname === '' || u.pathname === '/');
      } catch { return false; }
    };
    // The MCP resource audience is NOT a root audience
    expect(audiences.some(isRoot)).toBe(false);
  });

  it('should detect root-audience token (origin only)', async () => {
    // Audience = https://mcp.zapsign.com.br — root pathname, should be rejected
    const { token, store } = await storeTokenWithAudience('https://mcp.zapsign.com.br');
    const stored = await store.getToken(token);
    expect(stored).not.toBeNull();

    const audiences = Array.isArray(stored?.audience)
      ? stored?.audience
      : stored?.audience ? [stored.audience] : [];
    const isRoot = (value: string) => {
      try {
        const u = new URL(value);
        return (u.pathname === '' || u.pathname === '/');
      } catch { return false; }
    };
    // The root audience IS a root audience
    expect(audiences.some(isRoot)).toBe(true);
  });

  it('should handle missing audience gracefully', async () => {
    const { token, store } = await storeTokenWithAudience(undefined);
    const stored = await store.getToken(token);
    expect(stored).not.toBeNull();

    const audiences = Array.isArray(stored?.audience)
      ? stored?.audience
      : stored?.audience ? [stored.audience] : [];
    // No audience → no root audience rejection
    expect(audiences.length).toBe(0);
  });
});
