/**
 * Node OAuth façade — shared types.
 * Re-exports workers-oauth-provider's AuthRequest/ClientInfo shapes so
 * the rest of the codebase keeps the same type contract.
 */
export type { AuthRequest, ClientInfo } from '@cloudflare/workers-oauth-provider';

export interface NodeOAuthConfig {
  /** Path that the MCP API handler listens on (e.g. "/mcp"). */
  readonly apiRoute: string;
  /** Path for the authorize endpoint (e.g. "/authorize"). */
  readonly authorizeEndpoint: string;
  /** Path for the token endpoint (e.g. "/token"). */
  readonly tokenEndpoint: string;
  /** Path for the dynamic-client-registration endpoint (e.g. "/register"). */
  readonly clientRegistrationEndpoint: string;
  /** Whether to serve CIMD documents at the client metadata URL. */
  readonly clientIdMetadataDocumentEnabled: boolean;
  /** Reject plain PKCE (only S256 allowed when false). */
  readonly allowPlainPKCE: boolean;
  /** Supported OAuth scopes. */
  readonly scopesSupported: string[];
  /** Refresh-token TTL in seconds. */
  readonly refreshTokenTTL: number;
  /** Resource metadata object published at /.well-known/oauth-protected-resource */
  readonly resourceMetadata: ResourceMetadata;
  /** Authorization-server issuer (the public host). */
  readonly issuer: string;
}

export interface ResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly scopes_supported: readonly string[];
}

/** Shape stored in KV for a registered OAuth client. */
export interface StoredClient {
  clientId: string;
  clientSecret?: string;
  redirectUris: string[];
  clientName?: string;
  logoUri?: string;
  clientUri?: string;
  policyUri?: string;
  tosUri?: string;
  tokenEndpointAuthMethod: string;
  grantTypes: string[];
  responseTypes: string[];
  registrationDate: number;
}

/** Shape stored in KV for an authorization code. */
export interface StoredGrant {
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string[];
  codeChallenge: string;
  codeChallengeMethod: string;
  resource?: string | string[];
  props: unknown;
  metadata: unknown;
  createdAt: number;
}

/** Shape stored in KV for an access/refresh token pair. */
export interface StoredToken {
  clientId: string;
  userId: string;
  scope: string[];
  resource?: string | string[];
  props: unknown;
  audience?: string | string[];
  createdAt: number;
  expiresAt: number;
  refreshToken?: string;
  refreshExpiresAt?: number;
}

/** OAuthHelpers-compatible interface exposed to the auth handler. */
export interface OAuthHelpers {
  parseAuthRequest(request: Request): Promise<import('@cloudflare/workers-oauth-provider').AuthRequest>;
  lookupClient(clientId: string): Promise<import('@cloudflare/workers-oauth-provider').ClientInfo | null>;
  completeAuthorization(options: {
    request: import('@cloudflare/workers-oauth-provider').AuthRequest;
    userId: string;
    metadata: unknown;
    scope: string[];
    props: unknown;
  }): Promise<{ redirectTo: string }>;
}
