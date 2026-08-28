import { ZapSignMcpError } from '../errors/base.js';
import {
  IdApiBaseUrl,
  IdDefaultScopeString,
  IdKvPrefix,
  IdOAuthClient,
  IdOAuthEndpoints,
  IdOAuthTtl,
} from './constants.js';
import { deleteIdTokens, loadIdTokens, storeIdTokens, type StoredIdTokens } from './token-store.js';

export class IdTokenError extends ZapSignMcpError {
  constructor(message: string, code: string, statusCode: number, retryable: boolean) {
    super(message, code, statusCode, retryable);
    this.name = 'IdTokenError';
  }

  static reLoginRequired(): IdTokenError {
    return new IdTokenError(
      'Your ZapSign ID session expired. Reconnect the ZapSign ID integration and try again.',
      'relogin_required',
      401,
      false,
    );
  }
}

interface TokenResponseBody {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseTokenResponseBody(value: unknown): TokenResponseBody {
  if (!isRecord(value)) {
    return {};
  }
  return value as TokenResponseBody;
}

function buildRefreshLockKey(userId: string): string {
  return `${IdKvPrefix.RefreshLock}${userId}`;
}

/**
 * Decodes JWT exp claim without verifying signature.
 *
 * @param accessToken - OAuth access token JWT
 * @returns Expiration epoch seconds or null when unavailable
 */
export function decodeAccessTokenExp(accessToken: string): number | null {
  const parts = accessToken.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload: unknown = JSON.parse(payloadJson);
    if (!isRecord(payload) || typeof payload.exp !== 'number') {
      return null;
    }
    return payload.exp;
  } catch {
    return null;
  }
}

function resolveExpiresAt(accessToken: string, expiresIn?: number): number {
  const jwtExp = decodeAccessTokenExp(accessToken);
  if (jwtExp !== null) {
    return jwtExp;
  }
  const ttl = expiresIn ?? IdOAuthTtl.AccessTokenSeconds;
  return Math.floor(Date.now() / 1000) + ttl;
}

function shouldRefreshAccessToken(tokens: StoredIdTokens): boolean {
  const now = Math.floor(Date.now() / 1000);
  return tokens.expiresAt - now <= IdOAuthTtl.AccessRefreshLeadSeconds;
}

async function postTokenRequest(body: URLSearchParams): Promise<TokenResponseBody> {
  const response = await fetch(IdOAuthEndpoints.Token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const parsed = parseTokenResponseBody(await response.json());
  if (!response.ok) {
    return parsed;
  }
  return parsed;
}

function toStoredTokens(body: TokenResponseBody, fallbackScope: string): StoredIdTokens {
  if (!body.access_token || !body.refresh_token) {
    throw IdTokenError.reLoginRequired();
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    scope: body.scope ?? fallbackScope,
    expiresAt: resolveExpiresAt(body.access_token, body.expires_in),
  };
}

/**
 * Exchanges an authorization code for ZapSign ID tokens.
 *
 * @param code - Authorization code from callback
 * @param verifier - PKCE verifier
 * @returns Token bundle ready for storage
 */
export async function exchangeAuthorizationCode(
  code: string,
  verifier: string,
): Promise<StoredIdTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: IdOAuthClient.RedirectUri,
    client_id: IdOAuthClient.ClientId,
    code_verifier: verifier,
  });
  const responseBody = await postTokenRequest(body);
  if (responseBody.error) {
    throw new IdTokenError(
      responseBody.error_description ?? 'Authorization code exchange failed.',
      responseBody.error,
      400,
      false,
    );
  }
  return toStoredTokens(responseBody, IdDefaultScopeString);
}

async function refreshTokens(refreshToken: string): Promise<StoredIdTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: IdOAuthClient.ClientId,
  });
  const responseBody = await postTokenRequest(body);
  if (responseBody.error === 'invalid_grant') {
    throw IdTokenError.reLoginRequired();
  }
  if (responseBody.error) {
    throw new IdTokenError(
      responseBody.error_description ?? 'Token refresh failed.',
      responseBody.error,
      401,
      false,
    );
  }
  return toStoredTokens(responseBody, IdDefaultScopeString);
}

async function acquireRefreshLock(kv: KVNamespace, userId: string): Promise<boolean> {
  const key = buildRefreshLockKey(userId);
  const existing = await kv.get(key);
  if (existing) {
    return false;
  }
  await kv.put(key, '1', { expirationTtl: IdOAuthTtl.RefreshLockSeconds });
  return true;
}

async function releaseRefreshLock(kv: KVNamespace, userId: string): Promise<void> {
  await kv.delete(buildRefreshLockKey(userId));
}

async function waitForRefreshLock(kv: KVNamespace, userId: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const locked = await kv.get(buildRefreshLockKey(userId));
    if (!locked) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function readStoredTokens(
  kv: KVNamespace,
  encryptionKey: string,
  userId: string,
): Promise<StoredIdTokens> {
  const stored = await loadIdTokens(kv, encryptionKey, userId);
  if (!stored) {
    throw IdTokenError.reLoginRequired();
  }
  return stored;
}

async function resolveContendedRefresh(
  kv: KVNamespace,
  encryptionKey: string,
  userId: string,
): Promise<{ accessToken: string; scope: string }> {
  await waitForRefreshLock(kv, userId);
  const refreshed = await readStoredTokens(kv, encryptionKey, userId);
  if (!shouldRefreshAccessToken(refreshed)) {
    return { accessToken: refreshed.accessToken, scope: refreshed.scope };
  }
  throw IdTokenError.reLoginRequired();
}

async function rotateStoredTokens(
  kv: KVNamespace,
  encryptionKey: string,
  userId: string,
  latest: StoredIdTokens,
): Promise<{ accessToken: string; scope: string }> {
  const rotated = await refreshTokens(latest.refreshToken);
  await storeIdTokens(kv, encryptionKey, userId, rotated);
  return { accessToken: rotated.accessToken, scope: rotated.scope };
}

/**
 * Returns a valid access token, refreshing when close to expiry.
 *
 * @param kv - OAuth KV namespace
 * @param encryptionKey - AES key secret
 * @param userId - ZapSign ID subject
 * @returns Access token and granted scope
 */
export async function getValidAccessToken(
  kv: KVNamespace,
  encryptionKey: string,
  userId: string,
): Promise<{ accessToken: string; scope: string }> {
  const stored = await readStoredTokens(kv, encryptionKey, userId);
  if (!shouldRefreshAccessToken(stored)) {
    return { accessToken: stored.accessToken, scope: stored.scope };
  }

  const lockAcquired = await acquireRefreshLock(kv, userId);
  if (!lockAcquired) {
    return resolveContendedRefresh(kv, encryptionKey, userId);
  }

  try {
    const latest = await readStoredTokens(kv, encryptionKey, userId);
    if (!shouldRefreshAccessToken(latest)) {
      return { accessToken: latest.accessToken, scope: latest.scope };
    }
    return await rotateStoredTokens(kv, encryptionKey, userId, latest);
  } catch (error) {
    if (error instanceof IdTokenError && error.code === 'relogin_required') {
      await deleteIdTokens(kv, userId);
    }
    throw error;
  } finally {
    await releaseRefreshLock(kv, userId);
  }
}

/**
 * Revokes refresh token at ZapSign ID and deletes local storage.
 *
 * @param kv - OAuth KV namespace
 * @param encryptionKey - AES key secret
 * @param userId - ZapSign ID subject
 */
export async function revokeIdGrant(
  kv: KVNamespace,
  encryptionKey: string,
  userId: string,
): Promise<void> {
  const stored = await loadIdTokens(kv, encryptionKey, userId);
  if (stored) {
    const body = new URLSearchParams({
      token: stored.refreshToken,
      client_id: IdOAuthClient.ClientId,
    });
    await fetch(IdOAuthEndpoints.Revoke, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  }
  await deleteIdTokens(kv, userId);
}

/**
 * Extracts the subject claim from an access token JWT without verification.
 *
 * @param accessToken - OAuth access token JWT
 * @returns Subject identifier
 */
export function decodeAccessTokenSubject(accessToken: string): string | null {
  const parts = accessToken.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload: unknown = JSON.parse(payloadJson);
    if (!isRecord(payload) || typeof payload.sub !== 'string') {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}

export const IdTokenService = {
  audience: IdApiBaseUrl,
};
