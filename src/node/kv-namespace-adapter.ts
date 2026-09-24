/**
 * KvNamespaceAdapter — wraps KvStore with the Workers KVNamespace interface.
 *
 * This lets the existing id/token-store.ts, id/oauth-state.ts, and
 * id/token-service.ts (which all take `kv: KVNamespace`) work unchanged
 * when running on Node, by passing an adapter instance instead.
 *
 * Only the subset of KVNamespace used by those files is implemented:
 *   get(key), put(key, value, {expirationTtl}), delete(key)
 */
import type { KvStore } from '../store/kv-store.js';

type KvGetOptions = { type: 'text' } | { type: 'json' };
type KvPutOptions = { expirationTtl?: number };

/**
 * Minimal KVNamespace-shaped adapter backed by KvStore.
 *
 * Cast to `KVNamespace` at call sites (safe — only the used subset is needed).
 */
export class KvNamespaceAdapter {
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
}
