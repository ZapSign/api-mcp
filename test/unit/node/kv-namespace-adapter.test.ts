/**
 * Regression test: KvNamespaceAdapter is cast `as unknown as KvStore` for
 * NodeEnv.OAUTH_KV (src/node/main.ts), and handleSigningMcpRequest /
 * handleIdMcpApiRequest build `new OAuthStore(env.OAUTH_KV)` from it to look
 * up the bearer token's props on every MCP request. OAuthStore.getToken()
 * calls kv.getJson(), which the adapter never implemented — so every live
 * MCP request after a successful OAuth token exchange threw
 * "this.kv.getJson is not a function" and surfaced to Claude as a connector
 * connection error.
 */
import { describe, it, expect } from 'vitest';
import { KvNamespaceAdapter } from '../../../src/node/kv-namespace-adapter.js';
import type { KvStore } from '../../../src/store/kv-store.js';
import { OAuthStore, generateOpaqueToken } from '../../../src/node/oauth/store.js';
import type { StoredToken } from '../../../src/node/oauth/types.js';

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

describe('KvNamespaceAdapter as a KvStore backing OAuthStore', () => {
  it('lets OAuthStore.getToken() read a token stored through the adapter', async () => {
    const backing = new InMemoryKvStore();
    const adapter = new KvNamespaceAdapter(backing);
    const store = new OAuthStore(adapter);

    const token = generateOpaqueToken();
    const now = Math.floor(Date.now() / 1_000);
    const data: StoredToken = {
      clientId: 'c1',
      userId: 'u1',
      scope: ['documents:read'],
      props: { userId: 'u1', zapSignApiToken: 'tok' },
      createdAt: now,
      expiresAt: now + 3_600,
    };

    await store.putToken(token, data);

    const fetched = await store.getToken(token);
    expect(fetched).not.toBeNull();
    expect(fetched?.userId).toBe('u1');
  });

  it('still serves the Workers KVNamespace-shaped get/put/delete calls used by oauth-handler.ts', async () => {
    const backing = new InMemoryKvStore();
    const adapter = new KvNamespaceAdapter(backing);

    await adapter.put('csrf:abc', 'signed-value', { expirationTtl: 300 });
    expect(await adapter.get('csrf:abc')).toBe('signed-value');
    await adapter.delete('csrf:abc');
    expect(await adapter.get('csrf:abc')).toBeNull();
  });
});
