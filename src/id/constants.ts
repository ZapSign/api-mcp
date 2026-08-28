export const IdOAuthIssuer = 'https://id.zapsign.com.br';

export const IdOAuthEndpoints = {
  Authorization: `${IdOAuthIssuer}/oauth/authorize`,
  Token: `${IdOAuthIssuer}/oauth/token`,
  Revoke: `${IdOAuthIssuer}/oauth/revoke`,
  Jwks: `${IdOAuthIssuer}/oauth/jwks`,
  Discovery: `${IdOAuthIssuer}/.well-known/oauth-authorization-server`,
} as const;

export const IdProtectedResourceDiscovery =
  'https://api.id.zapsign.com.br/.well-known/oauth-protected-resource/v1';

export const IdApiBaseUrl = 'https://api.id.zapsign.com.br/v1';

export const IdApiPaths = {
  Validations: '/validations',
  CpfPhoneMatch: '/validations/cpf-phone-match',
  SimSwap: '/validations/sim-swap',
  LivenessDocumentMatch: '/validations/liveness-document-match',
  PhoneOwnership: '/validations/phone-ownership',
  validationById: (id: string): string => `/validations/${encodeURIComponent(id)}`,
  validationVerify: (id: string): string => `/validations/${encodeURIComponent(id)}/verify`,
} as const;

/**
 * API key paths (/api-keys*) are intentionally omitted: Id rejects OAuth bearer
 * tokens on those routes (sk_* API keys only). No MCP tools are registered for them.
 */

export const IdOAuthClient = {
  ClientId: 'zapsign-id-mcp',
  RedirectUri: 'https://mcp.zapsign.com.br/mcp/id',
} as const;

export const IdOAuthScope = {
  ValidationsRead: 'validations:read',
  ValidationsWrite: 'validations:write',
} as const;

export const IdOAuthScopes = [
  IdOAuthScope.ValidationsRead,
  IdOAuthScope.ValidationsWrite,
] as const;

export const IdOAuthTtl = {
  AuthCodeSeconds: 60,
  AccessTokenSeconds: 900,
  RefreshTokenSeconds: 2_592_000,
  OAuthStateSeconds: 600,
  RefreshLockSeconds: 15,
  AccessRefreshLeadSeconds: 60,
} as const;

export const IdMcpResource = 'https://mcp.zapsign.com.br/mcp/id';

export const IdOAuthRoutePaths = {
  Api: '/mcp/id',
  Authorize: '/id/authorize',
  Token: '/id/token',
  Register: '/id/register',
  Disconnect: '/id/disconnect',
} as const;

export const IdKvPrefix = {
  OAuthState: 'id-oauth-state:',
  Tokens: 'id-tokens:',
  RefreshLock: 'id-refresh-lock:',
} as const;

export const IdDefaultScopeString = IdOAuthScopes.join(' ');
