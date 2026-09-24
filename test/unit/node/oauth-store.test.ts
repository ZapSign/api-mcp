/**
 * Tests: Node OAuth store adapter — get, put, delete, expiry, JSON round-trip.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthStore, generateOpaqueToken } from '../../../src/node/oauth/store.js';
import type { StoredClient, StoredToken, StoredGrant } from '../../../src/node/oauth/types.js';

// ── In-memory KvStore for tests ─────────────────────────────────────────────

interface KvEntry {
  value: string;
  expiresAt?: number; // epoch seconds
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

// ── Client tests ─────────────────────────────────────────────────────────────

describe('OAuthStore — clients', () => {
  let kv: InMemoryKvStore;
  let store: OAuthStore;

  beforeEach(() => {
    kv = new InMemoryKvStore();
    store = new OAuthStore(kv);
  });

  it('should put and get a client', async () => {
    const client: StoredClient = {
      clientId: 'test-client-id',
      redirectUris: ['https://example.com/callback'],
      tokenEndpointAuthMethod: 'none',
      grantTypes: ['authorization_code'],
      responseTypes: ['code'],
      registrationDate: Date.now(),
    };
    await store.putClient(client);
    const fetched = await store.getClient('test-client-id');
    expect(fetched).not.toBeNull();
    expect(fetched?.clientId).toBe('test-client-id');
    expect(fetched?.redirectUris).toEqual(['https://example.com/callback']);
  });

  it('should return null for unknown client', async () => {
    const fetched = await store.getClient('unknown-client');
    expect(fetched).toBeNull();
  });

  it('should expire a client after TTL', async () => {
    const now = Math.floor(Date.now() / 1_000);
    kv.setNow(() => now);

    const client: StoredClient = {
      clientId: 'expiring-client',
      redirectUris: [],
      tokenEndpointAuthMethod: 'none',
      grantTypes: ['authorization_code'],
      responseTypes: ['code'],
      registrationDate: Date.now(),
    };
    await store.putClient(client, 10);

    // Before expiry
    kv.setNow(() => now + 9);
    expect(await store.getClient('expiring-client')).not.toBeNull();

    // After expiry
    kv.setNow(() => now + 11);
    expect(await store.getClient('expiring-client')).toBeNull();
  });
});

// ── Grant / auth code tests ───────────────────────────────────────────────────

describe('OAuthStore — grants', () => {
  let kv: InMemoryKvStore;
  let store: OAuthStore;

  beforeEach(() => {
    kv = new InMemoryKvStore();
    store = new OAuthStore(kv);
  });

  it('should put and consume a grant exactly once', async () => {
    const code = 'test-auth-code';
    const grant: StoredGrant = {
      clientId: 'client-1',
      userId: 'user-1',
      redirectUri: 'https://example.com/callback',
      scope: ['documents:read'],
      codeChallenge: 'abc123',
      codeChallengeMethod: 'S256',
      props: { userId: 'u1', zapSignApiToken: 'tok' },
      metadata: {},
      createdAt: Date.now(),
    };
    await store.putGrant(code, grant);

    const fetched = await store.consumeGrant(code);
    expect(fetched).not.toBeNull();
    expect(fetched?.clientId).toBe('client-1');

    // Second consume returns null (consumed)
    const second = await store.consumeGrant(code);
    expect(second).toBeNull();
  });

  it('should return null for unknown grant', async () => {
    expect(await store.consumeGrant('nonexistent')).toBeNull();
  });
});

// ── Token tests ───────────────────────────────────────────────────────────────

describe('OAuthStore — tokens', () => {
  let kv: InMemoryKvStore;
  let store: OAuthStore;

  const now = Math.floor(Date.now() / 1_000);

  beforeEach(() => {
    kv = new InMemoryKvStore();
    kv.setNow(() => now);
    store = new OAuthStore(kv);
  });

  it('should put and get a valid token', async () => {
    const token = generateOpaqueToken();
    const data: StoredToken = {
      clientId: 'c1',
      userId: 'u1',
      scope: ['documents:read'],
      props: { userId: 'u1', zapSignApiToken: 'tok' },
      createdAt: now,
      expiresAt: now + 3600,
    };
    await store.putToken(token, data);

    const fetched = await store.getToken(token);
    expect(fetched).not.toBeNull();
    expect(fetched?.clientId).toBe('c1');
    expect(fetched?.userId).toBe('u1');
  });

  it('should return null for expired token (app-level check)', async () => {
    const token = generateOpaqueToken();
    const data: StoredToken = {
      clientId: 'c1',
      userId: 'u1',
      scope: [],
      props: {},
      createdAt: now - 7200,
      expiresAt: now - 1, // already expired
    };
    await store.putToken(token, data);

    // Even if KV has the row, app-level expiry check returns null
    const fetched = await store.getToken(token);
    expect(fetched).toBeNull();
  });

  it('should delete a token', async () => {
    const token = generateOpaqueToken();
    const data: StoredToken = {
      clientId: 'c1',
      userId: 'u1',
      scope: [],
      props: {},
      createdAt: now,
      expiresAt: now + 3600,
    };
    await store.putToken(token, data);
    await store.deleteToken(token);
    expect(await store.getToken(token)).toBeNull();
  });

  it('generateOpaqueToken should produce token: prefix', () => {
    const token = generateOpaqueToken();
    expect(token).toMatch(/^token:/);
  });
});
