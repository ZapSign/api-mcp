export const OAuthScope = {
  DocumentsRead: 'documents:read',
  DocumentsWrite: 'documents:write',
  SignersRead: 'signers:read',
  SignersWrite: 'signers:write',
  TemplatesRead: 'templates:read',
  TemplatesWrite: 'templates:write',
  WebhooksRead: 'webhooks:read',
  WebhooksWrite: 'webhooks:write',
  PartnerWrite: 'partner:write',
} as const;

export const DEFAULT_OAUTH_SCOPES = [
  OAuthScope.DocumentsRead,
  OAuthScope.DocumentsWrite,
  OAuthScope.SignersRead,
  OAuthScope.SignersWrite,
  OAuthScope.TemplatesRead,
  OAuthScope.TemplatesWrite,
  OAuthScope.WebhooksRead,
  OAuthScope.WebhooksWrite,
  OAuthScope.PartnerWrite,
] as const;

/** Primary public origin (Brazil). */
export const CANONICAL_OAUTH_ORIGIN = 'https://mcp.zapsign.com.br';

/** Alias origin used in international docs and Anthropic submission materials. */
export const ALTERNATE_OAUTH_ORIGIN = 'https://mcp.zapsign.co';

export const SUPPORTED_OAUTH_ORIGINS = [
  CANONICAL_OAUTH_ORIGIN,
  ALTERNATE_OAUTH_ORIGIN,
] as const;

export const CANONICAL_MCP_RESOURCE = `${CANONICAL_OAUTH_ORIGIN}/mcp`;

/**
 * Path-only OAuth endpoints so both mcp.zapsign.com.br and mcp.zapsign.co work.
 * Absolute URLs are still exposed via metadata relative to the request host.
 */
export const OAUTH_ROUTE_PATHS = {
  Api: '/mcp',
  Authorize: '/authorize',
  Token: '/token',
  Register: '/register',
} as const;

export const CANONICAL_OAUTH_ENDPOINTS = {
  Authorize: `${CANONICAL_OAUTH_ORIGIN}${OAUTH_ROUTE_PATHS.Authorize}`,
  Token: `${CANONICAL_OAUTH_ORIGIN}${OAUTH_ROUTE_PATHS.Token}`,
  Register: `${CANONICAL_OAUTH_ORIGIN}${OAUTH_ROUTE_PATHS.Register}`,
} as const;

/**
 * Returns true when origin is an allowed MCP OAuth host.
 */
export function isSupportedOAuthOrigin(origin: string): boolean {
  return (SUPPORTED_OAUTH_ORIGINS as readonly string[]).includes(origin);
}

export interface AuthProps {
  userId: string;
  zapSignApiUrl: string;
  zapSignApiToken: string;
  grantedScope: string;
}
