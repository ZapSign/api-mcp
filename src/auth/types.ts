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

export const CANONICAL_OAUTH_ORIGIN = 'https://mcp.zapsign.com.br';
export const CANONICAL_MCP_RESOURCE = `${CANONICAL_OAUTH_ORIGIN}/mcp`;

export const CANONICAL_OAUTH_ENDPOINTS = {
  Authorize: `${CANONICAL_OAUTH_ORIGIN}/authorize`,
  Token: `${CANONICAL_OAUTH_ORIGIN}/token`,
  Register: `${CANONICAL_OAUTH_ORIGIN}/register`,
} as const;

export interface AuthProps {
  userId: string;
  zapSignApiUrl: string;
  zapSignApiToken: string;
  grantedScope: string;
}
