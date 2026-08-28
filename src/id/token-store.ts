import { decryptSecret, encryptSecret } from './crypto.js';
import { IdKvPrefix } from './constants.js';

export interface StoredIdTokens {
  accessToken: string;
  refreshToken: string;
  scope: string;
  expiresAt: number;
}

function buildTokenKey(userId: string): string {
  return `${IdKvPrefix.Tokens}${userId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredIdTokens(value: unknown): value is StoredIdTokens {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.accessToken === 'string'
    && typeof value.refreshToken === 'string'
    && typeof value.scope === 'string'
    && typeof value.expiresAt === 'number';
}

/**
 * Encrypts and stores ZapSign ID tokens for a user.
 *
 * @param kv - OAuth KV namespace
 * @param encryptionKey - AES key secret
 * @param userId - ZapSign ID subject
 * @param tokens - Token bundle to persist
 */
export async function storeIdTokens(
  kv: KVNamespace,
  encryptionKey: string,
  userId: string,
  tokens: StoredIdTokens,
): Promise<void> {
  const encrypted = await encryptSecret(JSON.stringify(tokens), encryptionKey);
  await kv.put(buildTokenKey(userId), encrypted);
}

/**
 * Loads and decrypts stored ZapSign ID tokens for a user.
 *
 * @param kv - OAuth KV namespace
 * @param encryptionKey - AES key secret
 * @param userId - ZapSign ID subject
 * @returns Stored tokens or null when absent
 */
export async function loadIdTokens(
  kv: KVNamespace,
  encryptionKey: string,
  userId: string,
): Promise<StoredIdTokens | null> {
  const encrypted = await kv.get(buildTokenKey(userId));
  if (!encrypted) {
    return null;
  }

  const plaintext = await decryptSecret(encrypted, encryptionKey);
  const parsed: unknown = JSON.parse(plaintext);
  if (!isStoredIdTokens(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Deletes stored ZapSign ID tokens for a user.
 *
 * @param kv - OAuth KV namespace
 * @param userId - ZapSign ID subject
 */
export async function deleteIdTokens(kv: KVNamespace, userId: string): Promise<void> {
  await kv.delete(buildTokenKey(userId));
}
