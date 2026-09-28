/**
 * KvNamespaceAdapter — wraps KvStore with the Workers KVNamespace interface,
 * while still implementing KvStore itself so it can back an OAuthStore.
 *
 * Two call shapes hit the same underlying store through this class:
 *   - id/token-store.ts, id/oauth-state.ts, id/token-service.ts, and
 *     auth/oauth-handler.ts (CSRF tokens) all take `kv: KVNamespace` and use
 *     get(key, {type:'json'}) / put(key, value, {expirationTtl}) / delete(key).
 *   - src/node/main.ts builds `new OAuthStore(env.OAUTH_KV)` per MCP request
 *     to look up the bearer token's props, and OAuthStore needs the plain
 *     KvStore shape: getJson(key) / putJson(key, value, {ttlSeconds}).
 * Without getJson/putJson here, that second path throws at runtime the
 * moment a real MCP request comes in after OAuth completes.
 */
import type { KvStore, KvPutOptions as KvStorePutOptions } from '../store/kv-store.js';

type KvGetOptions = { type: 'text' } | { type: 'json' };
type KvPutOptions = { expirationTtl?: number };

export class KvNamespaceAdapter implements KvStore {
  constructor(private readonly store: KvStore) {}

  async get(key: string): Promise<string | null>;
  async get(key: string, options: { type: 'text' }): Promise<string | null>;
  async get(key: string, options: { type: 'json' }): Promise<unknown>;
  async get(key: string, options?: KvGetOptions): Promise<unknown> {
    if (options && 'type' in options && options.type === 'json') {
      return this.store.getJson(key);
    }
    return this.store.get(key);
  }

  async put(key: string, value: string, options?: KvPutOptions): Promise<void> {
    await this.store.put(key, value, { ttlSeconds: options?.expirationTtl });
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async getJson(key: string): Promise<unknown | null> {
    return this.store.getJson(key);
  }

  async putJson(key: string, value: unknown, options?: KvStorePutOptions): Promise<void> {
    await this.store.putJson(key, value, options);
  }
}
