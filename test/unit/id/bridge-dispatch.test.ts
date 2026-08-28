import { describe, expect, it, vi } from 'vitest';

import { handleIdBridgeRequest, idOAuthProvider, idOAuthProviderConfig } from '../../../src/id/bridge.js';

describe('ID bridge routing', () => {
  it('should expose ID OAuth provider metadata', () => {
    expect(idOAuthProviderConfig.apiRoute).toBe('/mcp/id');
    expect(idOAuthProviderConfig.authorizeEndpoint).toBe('/id/authorize');
    expect(idOAuthProviderConfig.tokenEndpoint).toBe('/id/token');
    expect(idOAuthProviderConfig.scopesSupported).toEqual(['validations:read', 'validations:write']);
    expect(idOAuthProviderConfig.resourceMetadata.resource).toBe('https://mcp.zapsign.com.br/mcp/id');
  });

  it('should route OAuth callback before the ID OAuth provider fetch', async () => {
    const providerFetch = vi.spyOn(idOAuthProvider, 'fetch');
    const response = await handleIdBridgeRequest(
      new Request('https://mcp.zapsign.com.br/mcp/id?code=x&state=missing'),
      {
        OAUTH_KV: { get: vi.fn(async () => null), put: vi.fn(), delete: vi.fn() },
        OAUTH_PROVIDER: { completeAuthorization: vi.fn() },
        ID_TOKEN_ENCRYPTION_KEY: 'abc',
      } as never,
      {} as ExecutionContext,
    );
    expect(response.status).toBe(400);
    expect(providerFetch).not.toHaveBeenCalled();
  });
});
