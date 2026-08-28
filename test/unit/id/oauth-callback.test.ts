import { describe, expect, it, vi } from 'vitest';

import { IdKvPrefix } from '../../../src/id/constants.js';
import { handleIdOAuthCallback } from '../../../src/id/oauth-callback.js';
import { storeOAuthState } from '../../../src/id/oauth-state.js';
import { loadIdTokens } from '../../../src/id/token-store.js';
import { createMockEnv, mockTokenResponse } from './test-helpers.js';

describe('ID OAuth callback', () => {
  it('should complete happy path callback and store tokens', async () => {
    const env = createMockEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockTokenResponse());

    await storeOAuthState(env.OAUTH_KV, 'state-1', {
      verifier: 'verifier-1',
      oauthReqInfo: { clientId: 'mcp-client' } as never,
      createdAt: Date.now(),
    });

    const response = await handleIdOAuthCallback(
      new Request('https://mcp.zapsign.com.br/mcp/id?code=abc&state=state-1'),
      env,
    );

    expect(response.status).toBe(302);
    expect(env.OAUTH_PROVIDER.completeAuthorization).toHaveBeenCalledOnce();
    const stored = await loadIdTokens(env.OAUTH_KV, env.ID_TOKEN_ENCRYPTION_KEY, 'user-a');
    expect(stored?.refreshToken).toBe('refresh-token-a');
  });

  it('should handle consent denial without storing tokens', async () => {
    const env = createMockEnv();
    await storeOAuthState(env.OAUTH_KV, 'state-deny', {
      verifier: 'verifier-1',
      oauthReqInfo: { clientId: 'mcp-client' } as never,
      createdAt: Date.now(),
    });

    const response = await handleIdOAuthCallback(
      new Request('https://mcp.zapsign.com.br/mcp/id?error=access_denied&state=state-deny'),
      env,
    );

    expect(response.status).toBe(200);
    expect(env.OAUTH_PROVIDER.completeAuthorization).not.toHaveBeenCalled();
  });

  it('should reject reused or missing state', async () => {
    const env = createMockEnv();
    await storeOAuthState(env.OAUTH_KV, 'state-once', {
      verifier: 'verifier-1',
      oauthReqInfo: { clientId: 'mcp-client' } as never,
      createdAt: Date.now(),
    });

    await handleIdOAuthCallback(
      new Request('https://mcp.zapsign.com.br/mcp/id?code=abc&state=state-once'),
      env,
    );

    const reused = await handleIdOAuthCallback(
      new Request('https://mcp.zapsign.com.br/mcp/id?code=abc&state=state-once'),
      env,
    );
    expect(reused.status).toBe(400);
  });

  it('should reject tampered state keys', async () => {
    const env = createMockEnv();
    const response = await handleIdOAuthCallback(
      new Request('https://mcp.zapsign.com.br/mcp/id?code=abc&state=missing-state'),
      env,
    );
    expect(response.status).toBe(400);
    expect(await env.OAUTH_KV.get(`${IdKvPrefix.OAuthState}missing-state`)).toBeNull();
  });
});
