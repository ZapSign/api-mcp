/**
 * OAuth store — KvStore-backed persistence for clients, grants, and tokens.
 *
 * Key prefixes (matching DynamoKvStore namespaces):
 *   client:<clientId>
 *   grant:<code>
 *   token:<prefix>:<mid>:<hash>   (mirrors the workers-oauth-provider layout)
 */
import type { KvStore } from '../../store/kv-store.js';
import type { StoredClient, StoredGrant, StoredToken } from './types.js';

const CLIENT_PREFIX = 'client:';
const GRANT_PREFIX = 'grant:';

// Token keys preserve the 3-part format used by index.ts rejectRootAudience:
//   token:<randomA>:<randomB>:<hash>
// We store the token string as-is — callers pass the full opaque token.
const TOKEN_PREFIX = 'token:';

const GRANT_TTL_SECONDS = 120;   // auth codes expire in 2 minutes
const ACCESS_TOKEN_TTL_SECONDS = 3_600; // 1 hour

function clientKey(clientId: string): string {
  return `${CLIENT_PREFIX}${clientId}`;
}

function grantKey(code: string): string {
  return `${GRANT_PREFIX}${code}`;
}

function tokenKey(token: string): string {
  // token has shape  <prefix>:<mid>:<hash>
  // The overall key stored in KV must start with "token:" so DynamoKvStore
  // maps it to TOKEN# namespace.  Tokens from completeAuthorization already
  // include the "token:" segment generated here.
  return token.startsWith(TOKEN_PREFIX) ? token : `${TOKEN_PREFIX}${token}`;
}

function generateId(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generates an opaque token string in the 3-part format expected by rejectRootAudience. */
export function generateOpaqueToken(): string {
  return `token:${generateId(8)}:${generateId(8)}`;
}

export class OAuthStore {
  constructor(private readonly kv: KvStore) {}

  // ── Clients ─────────────────────────────────────────────────────────────

  async getClient(clientId: string): Promise<StoredClient | null> {
    const raw = await this.kv.getJson(clientKey(clientId));
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    return raw as StoredClient;
  }

  async putClient(client: StoredClient, ttlSeconds?: number): Promise<void> {
    await this.kv.putJson(clientKey(client.clientId), client, { ttlSeconds });
  }

  // ── Authorization codes ─────────────────────────────────────────────────

  async putGrant(code: string, grant: StoredGrant): Promise<void> {
    await this.kv.putJson(grantKey(code), grant, {
      ttlSeconds: GRANT_TTL_SECONDS,
    });
  }

  async consumeGrant(code: string): Promise<StoredGrant | null> {
    const key = grantKey(code);
    const raw = await this.kv.getJson(key);
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    await this.kv.delete(key);
    return raw as StoredGrant;
  }

  // ── Tokens ───────────────────────────────────────────────────────────────

  async putToken(
    token: string,
    data: StoredToken,
  ): Promise<void> {
    const nowEpoch = Math.floor(Date.now() / 1_000);
    const ttl = data.expiresAt > nowEpoch ? data.expiresAt - nowEpoch : ACCESS_TOKEN_TTL_SECONDS;
    await this.kv.putJson(tokenKey(token), data, { ttlSeconds: ttl });
  }

  async getToken(token: string): Promise<StoredToken | null> {
    const raw = await this.kv.getJson(tokenKey(token));
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const t = raw as StoredToken;
    // App-level expiry check (DynamoDB TTL is cleanup-only per plan D6)
    const nowEpoch = Math.floor(Date.now() / 1_000);
    if (t.expiresAt <= nowEpoch) {
      return null;
    }
    return t;
  }

  async deleteToken(token: string): Promise<void> {
    await this.kv.delete(tokenKey(token));
  }
}
