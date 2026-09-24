/**
 * OAuth token endpoint — authorization_code + refresh_token grant types.
 *
 * POST /token
 */
import type { KvStore } from '../../store/kv-store.js';
import type { StoredToken } from './types.js';
import { OAuthStore, generateOpaqueToken } from './store.js';
import { verifyS256 } from './pkce.js';
import { logError } from '../../utils/logger.js';

const ACCESS_TOKEN_TTL_SECONDS = 3_600; // 1 hour

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: string, description: string, status = 400): Response {
  return jsonResponse({ error, error_description: description }, status);
}

function buildTokenData(
  grant: import('./store.js').OAuthStore extends { consumeGrant: (code: string) => Promise<infer T> } ? NonNullable<T> : never,
  now: number,
  accessToken: string,
  refreshToken: string,
  refreshTokenTTL: number,
): StoredToken {
  return {
    clientId: grant.clientId,
    userId: grant.userId,
    scope: grant.scope,
    resource: grant.resource,
    props: grant.props,
    audience: grant.resource,
    createdAt: now,
    expiresAt: now + ACCESS_TOKEN_TTL_SECONDS,
    refreshToken,
    refreshExpiresAt: now + refreshTokenTTL,
  };
}

function buildRefreshData(tokenData: StoredToken, refreshTokenTTL: number): StoredToken {
  return {
    ...tokenData,
    expiresAt: tokenData.createdAt + refreshTokenTTL,
    refreshToken: undefined,
    refreshExpiresAt: undefined,
  };
}

async function issueTokenPair(
  store: OAuthStore,
  accessToken: string,
  refreshToken: string,
  tokenData: StoredToken,
  refreshData: StoredToken,
  logEvent: string,
): Promise<Response | null> {
  try {
    await store.putToken(accessToken, tokenData);
    await store.putToken(refreshToken, refreshData);
    return null;
  } catch (error) {
    logError(logEvent, {
      error_class: error instanceof Error ? error.constructor.name : 'unknown',
    });
    return errorResponse('server_error', 'Failed to issue tokens.', 500);
  }
}

async function verifyAuthCodeGrant(
  params: URLSearchParams,
  store: OAuthStore,
): Promise<{ error: Response } | { grant: Awaited<ReturnType<OAuthStore['consumeGrant']>> & NonNullable<unknown> }> {
  const code = params.get('code');
  const redirectUri = params.get('redirect_uri');
  const clientId = params.get('client_id');
  const codeVerifier = params.get('code_verifier');

  if (!code || !redirectUri || !clientId) {
    return { error: errorResponse('invalid_request', 'code, redirect_uri, and client_id are required.') };
  }

  const grant = await store.consumeGrant(code);
  if (!grant) {
    return { error: errorResponse('invalid_grant', 'Authorization code is invalid or expired.') };
  }
  if (grant.clientId !== clientId) {
    return { error: errorResponse('invalid_grant', 'client_id mismatch.') };
  }
  if (grant.redirectUri !== redirectUri) {
    return { error: errorResponse('invalid_grant', 'redirect_uri mismatch.') };
  }
  if (!codeVerifier) {
    return { error: errorResponse('invalid_request', 'code_verifier is required (PKCE S256).') };
  }
  const pkceOk = await verifyS256(codeVerifier, grant.codeChallenge);
  if (!pkceOk) {
    return { error: errorResponse('invalid_grant', 'code_verifier does not match code_challenge.') };
  }
  return { grant };
}

async function handleAuthorizationCodeGrant(
  params: URLSearchParams,
  store: OAuthStore,
  refreshTokenTTL: number,
): Promise<Response> {
  const verified = await verifyAuthCodeGrant(params, store);
  if ('error' in verified) {
    return verified.error;
  }

  const { grant } = verified;
  const now = Math.floor(Date.now() / 1_000);
  const accessToken = generateOpaqueToken();
  const refreshToken = generateOpaqueToken();

  const tokenData: StoredToken = {
    clientId: grant.clientId,
    userId: grant.userId,
    scope: grant.scope,
    resource: grant.resource,
    props: grant.props,
    audience: grant.resource,
    createdAt: now,
    expiresAt: now + ACCESS_TOKEN_TTL_SECONDS,
    refreshToken,
    refreshExpiresAt: now + refreshTokenTTL,
  };
  const refreshData: StoredToken = {
    ...tokenData,
    expiresAt: now + refreshTokenTTL,
    refreshToken: undefined,
    refreshExpiresAt: undefined,
  };

  const storeErr = await issueTokenPair(store, accessToken, refreshToken, tokenData, refreshData, 'token_store_failed');
  if (storeErr) {
    return storeErr;
  }

  return jsonResponse({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    scope: grant.scope.join(' '),
  }, 200);
}

async function handleRefreshTokenGrant(
  params: URLSearchParams,
  store: OAuthStore,
  refreshTokenTTL: number,
): Promise<Response> {
  const refreshToken = params.get('refresh_token');
  const clientId = params.get('client_id');

  if (!refreshToken || !clientId) {
    return errorResponse('invalid_request', 'refresh_token and client_id are required.');
  }

  const storedRefresh = await store.getToken(refreshToken);
  if (!storedRefresh) {
    return errorResponse('invalid_grant', 'refresh_token is invalid or expired.');
  }
  if (storedRefresh.clientId !== clientId) {
    return errorResponse('invalid_grant', 'client_id mismatch.');
  }

  await store.deleteToken(refreshToken);

  const now = Math.floor(Date.now() / 1_000);
  const newAccessToken = generateOpaqueToken();
  const newRefreshToken = generateOpaqueToken();

  const tokenData: StoredToken = {
    ...storedRefresh,
    createdAt: now,
    expiresAt: now + ACCESS_TOKEN_TTL_SECONDS,
    refreshToken: newRefreshToken,
    refreshExpiresAt: now + refreshTokenTTL,
  };
  const refreshData: StoredToken = {
    ...tokenData,
    expiresAt: now + refreshTokenTTL,
    refreshToken: undefined,
    refreshExpiresAt: undefined,
  };

  const storeErr = await issueTokenPair(store, newAccessToken, newRefreshToken, tokenData, refreshData, 'token_refresh_store_failed');
  if (storeErr) {
    return storeErr;
  }

  return jsonResponse({
    access_token: newAccessToken,
    token_type: 'bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: newRefreshToken,
    scope: storedRefresh.scope.join(' '),
  }, 200);
}

/**
 * Handles POST /token — authorization_code and refresh_token grants.
 */
export async function handleTokenEndpoint(
  request: Request,
  kv: KvStore,
  refreshTokenTTL: number,
): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('invalid_request', 'Method not allowed.', 405);
  }

  let params: URLSearchParams;
  try {
    const body = await request.text();
    params = new URLSearchParams(body);
  } catch {
    return errorResponse('invalid_request', 'Could not parse request body.');
  }

  const grantType = params.get('grant_type');
  const store = new OAuthStore(kv);

  if (grantType === 'authorization_code') {
    return handleAuthorizationCodeGrant(params, store, refreshTokenTTL);
  }
  if (grantType === 'refresh_token') {
    return handleRefreshTokenGrant(params, store, refreshTokenTTL);
  }

  return errorResponse('unsupported_grant_type', `grant_type "${grantType ?? ''}" is not supported.`);
}

// buildTokenData and buildRefreshData are helpers used in tests/future extensions
export { buildTokenData, buildRefreshData };
