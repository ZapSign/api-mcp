import { describe, expect, it } from 'vitest';

import {
  IdApiBaseUrl,
  IdDefaultScopeString,
  IdMcpResource,
  IdOAuthClient,
  IdOAuthEndpoints,
  IdOAuthIssuer,
  IdOAuthTtl,
} from '../../../src/id/constants.js';

describe('ID OAuth constants', () => {
  it('should expose the fixed ZapSign ID OAuth contract', () => {
    expect(IdOAuthIssuer).toBe('https://id.zapsign.com.br');
    expect(IdOAuthEndpoints.Authorization).toBe('https://id.zapsign.com.br/oauth/authorize');
    expect(IdOAuthEndpoints.Token).toBe('https://id.zapsign.com.br/oauth/token');
    expect(IdOAuthEndpoints.Revoke).toBe('https://id.zapsign.com.br/oauth/revoke');
    expect(IdOAuthEndpoints.Jwks).toBe('https://id.zapsign.com.br/oauth/jwks');
    expect(IdOAuthEndpoints.Discovery).toBe('https://id.zapsign.com.br/.well-known/oauth-authorization-server');
    expect(IdApiBaseUrl).toBe('https://api.id.zapsign.com.br/v1');
    expect(IdOAuthClient.ClientId).toBe('zapsign-id-mcp');
    expect(IdOAuthClient.RedirectUri).toBe('https://mcp.zapsign.com.br/mcp/id');
    expect(IdDefaultScopeString).toBe('validations:read validations:write');
    expect(IdMcpResource).toBe('https://mcp.zapsign.com.br/mcp/id');
    expect(IdOAuthTtl.AuthCodeSeconds).toBe(60);
    expect(IdOAuthTtl.AccessTokenSeconds).toBe(900);
    expect(IdOAuthTtl.RefreshTokenSeconds).toBe(2_592_000);
  });
});
