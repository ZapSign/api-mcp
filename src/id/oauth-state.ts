import type { AuthRequest } from '@cloudflare/workers-oauth-provider';

import { IdKvPrefix, IdOAuthTtl } from './constants.js';

export interface StoredOAuthState {
  verifier: string;
  oauthReqInfo: AuthRequest;
  createdAt: number;
}

function buildStateKey(state: string): string {
  return `${IdKvPrefix.OAuthState}${state}`;
}

function isStoredOAuthState(value: unknown): value is StoredOAuthState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('verifier' in value) || typeof value.verifier !== 'string') {
    return false;
  }
  if (!('oauthReqInfo' in value) || typeof value.oauthReqInfo !== 'object' || value.oauthReqInfo === null) {
    return false;
  }
  if (!('createdAt' in value) || typeof value.createdAt !== 'number') {
    return false;
  }
  return true;
}

/**
 * Persists OAuth state and PKCE verifier for a single authorization attempt.
 *
 * @param kv - OAuth KV namespace
 * @param state - OAuth state parameter
 * @param data - Stored verifier and MCP auth request
 */
export async function storeOAuthState(
  kv: KVNamespace,
  state: string,
  data: StoredOAuthState,
): Promise<void> {
  await kv.put(buildStateKey(state), JSON.stringify(data), {
    expirationTtl: IdOAuthTtl.OAuthStateSeconds,
  });
}

/**
 * Loads and deletes OAuth state in one step so it cannot be reused.
 *
 * @param kv - OAuth KV namespace
 * @param state - OAuth state parameter
 * @returns Stored state or null when missing
 */
export async function consumeOAuthState(
  kv: KVNamespace,
  state: string,
): Promise<StoredOAuthState | null> {
  const key = buildStateKey(state);
  const raw = await kv.get(key);
  if (!raw) {
    return null;
  }

  await kv.delete(key);
  const parsed: unknown = JSON.parse(raw);
  if (!isStoredOAuthState(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Generates a cryptographically random OAuth state value.
 *
 * @returns URL-safe state string
 */
export function generateOAuthState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
