import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdKvPrefix } from '../../../src/id/constants.js';
import {
  decodeAccessTokenExp,
  decodeAccessTokenSubject,
  exchangeAuthorizationCode,
  getValidAccessToken,
  IdTokenError,
} from '../../../src/id/token-service.js';
import { loadIdTokens, storeIdTokens } from '../../../src/id/token-store.js';
import {
  createMockEnv,
  createMockJwt,
  createMockKv,
  mockTokenResponse,
  TEST_ENCRYPTION_KEY,
} from './test-helpers.js';

describe('ID token service', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should exchange authorization codes and store tokens', async () => {
    fetchMock.mockResolvedValueOnce(mockTokenResponse());
    const tokens = await exchangeAuthorizationCode('auth-code', 'verifier-1');
    expect(tokens.refreshToken).toBe('refresh-token-a');
    expect(decodeAccessTokenExp(tokens.accessToken)).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should refresh expired access tokens with single-flight lock', async () => {
    const kv = createMockKv();
    const expiringToken = createMockJwt({
      sub: 'user-a',
      exp: Math.floor(Date.now() / 1000) + 30,
    });
    await storeIdTokens(kv, TEST_ENCRYPTION_KEY, 'user-a', {
      accessToken: expiringToken,
      refreshToken: 'refresh-old',
      scope: 'validations:read validations:write',
      expiresAt: Math.floor(Date.now() / 1000) + 30,
    });

    fetchMock.mockResolvedValueOnce(mockTokenResponse({
      access_token: createMockJwt({ sub: 'user-a', exp: Math.floor(Date.now() / 1000) + 900 }),
      refresh_token: 'refresh-new',
    }));

    const result = await getValidAccessToken(kv, TEST_ENCRYPTION_KEY, 'user-a');
    expect(decodeAccessTokenSubject(result.accessToken)).toBe('user-a');
    expect(kv.put).toHaveBeenCalledWith(`${IdKvPrefix.RefreshLock}user-a`, '1', expect.any(Object));
  });

  it('should wipe tokens on invalid_grant refresh', async () => {
    const kv = createMockKv();
    const expiringToken = createMockJwt({
      sub: 'user-a',
      exp: Math.floor(Date.now() / 1000) + 10,
    });
    await storeIdTokens(kv, TEST_ENCRYPTION_KEY, 'user-a', {
      accessToken: expiringToken,
      refreshToken: 'refresh-old',
      scope: 'validations:read validations:write',
      expiresAt: Math.floor(Date.now() / 1000) + 10,
    });

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      error: 'invalid_grant',
      error_description: 'Refresh token reused',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } }));

    await expect(getValidAccessToken(kv, TEST_ENCRYPTION_KEY, 'user-a')).rejects.toBeInstanceOf(IdTokenError);
    expect(await loadIdTokens(kv, TEST_ENCRYPTION_KEY, 'user-a')).toBeNull();
  });

  it('should isolate tokens per user', async () => {
    const kv = createMockKv();
    await storeIdTokens(kv, TEST_ENCRYPTION_KEY, 'user-a', {
      accessToken: 'token-a',
      refreshToken: 'refresh-a',
      scope: 'validations:read',
      expiresAt: Math.floor(Date.now() / 1000) + 900,
    });
    await storeIdTokens(kv, TEST_ENCRYPTION_KEY, 'user-b', {
      accessToken: 'token-b',
      refreshToken: 'refresh-b',
      scope: 'validations:read',
      expiresAt: Math.floor(Date.now() / 1000) + 900,
    });

    const userA = await loadIdTokens(kv, TEST_ENCRYPTION_KEY, 'user-a');
    const userB = await loadIdTokens(kv, TEST_ENCRYPTION_KEY, 'user-b');
    expect(userA?.accessToken).toBe('token-a');
    expect(userB?.accessToken).toBe('token-b');
  });

  it('should use env encryption key from worker bindings', async () => {
    const env = createMockEnv();
    const kv = env.OAUTH_KV;
    await storeIdTokens(kv, env.ID_TOKEN_ENCRYPTION_KEY, 'user-a', {
      accessToken: 'token-a',
      refreshToken: 'refresh-a',
      scope: 'validations:read',
      expiresAt: Math.floor(Date.now() / 1000) + 900,
    });
    const loaded = await loadIdTokens(kv, env.ID_TOKEN_ENCRYPTION_KEY, 'user-a');
    expect(loaded?.accessToken).toBe('token-a');
  });
});
