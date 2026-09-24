/**
 * OAuth metadata endpoints.
 *
 * GET /.well-known/oauth-protected-resource
 * GET /.well-known/oauth-authorization-server
 */
import type { NodeOAuthConfig } from './types.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Serves /.well-known/oauth-protected-resource per RFC 9728 / MCP auth spec.
 */
export function handleProtectedResourceMetadata(
  config: NodeOAuthConfig,
): Response {
  return jsonResponse({
    resource: config.resourceMetadata.resource,
    authorization_servers: [...config.resourceMetadata.authorization_servers],
    scopes_supported: [...config.resourceMetadata.scopes_supported],
    bearer_methods_supported: ['header'],
    resource_signing_alg_values_supported: [],
  });
}

/**
 * Serves /.well-known/oauth-authorization-server per RFC 8414.
 */
export function handleAuthorizationServerMetadata(
  config: NodeOAuthConfig,
  requestOrigin: string,
): Response {
  const issuer = config.issuer;
  return jsonResponse({
    issuer,
    authorization_endpoint: `${requestOrigin}${config.authorizeEndpoint}`,
    token_endpoint: `${requestOrigin}${config.tokenEndpoint}`,
    registration_endpoint: `${requestOrigin}${config.clientRegistrationEndpoint}`,
    scopes_supported: [...config.scopesSupported],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    require_pkce: true,
  });
}
