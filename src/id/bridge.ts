import { OAuthProvider } from '@cloudflare/workers-oauth-provider';
import { createMcpHandler } from 'agents/mcp';

import type { Env } from '../types/env.js';
import { CANONICAL_OAUTH_ORIGIN } from '../auth/types.js';
import { IdAuthHandler, IdSupportedScopes } from './auth-handler.js';
import { handleIdBrowserLanding, isIdBrowserLanding } from './browser-landing.js';
import {
  IdMcpResource,
  IdOAuthRoutePaths,
  IdOAuthTtl,
} from './constants.js';
import { handleIdOAuthCallback, isZapSignIdCallback } from './oauth-callback.js';
import { createIdServer } from './server.js';

const idMcpHandler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const server = createIdServer(env);
    const handler = createMcpHandler(
      server as unknown as Parameters<typeof createMcpHandler>[0],
    );
    const response = await handler(request, env, ctx);
    response.headers.delete('Access-Control-Expose-Headers');
    return response;
  },
};

export const idOAuthProviderConfig = {
  apiRoute: IdOAuthRoutePaths.Api,
  apiHandler: idMcpHandler,
  defaultHandler: IdAuthHandler,
  authorizeEndpoint: IdOAuthRoutePaths.Authorize,
  tokenEndpoint: IdOAuthRoutePaths.Token,
  clientRegistrationEndpoint: IdOAuthRoutePaths.Register,
  clientIdMetadataDocumentEnabled: true,
  allowPlainPKCE: false,
  scopesSupported: [...IdSupportedScopes],
  refreshTokenTTL: IdOAuthTtl.RefreshTokenSeconds,
  resourceMetadata: {
    resource: IdMcpResource,
    authorization_servers: [CANONICAL_OAUTH_ORIGIN],
    scopes_supported: [...IdSupportedScopes],
  },
};

export const idOAuthProvider = new OAuthProvider<Env>(idOAuthProviderConfig);

/**
 * Routes ZapSign ID MCP traffic before the signature MCP handler.
 */
export async function handleIdBridgeRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (isZapSignIdCallback(request)) {
    return handleIdOAuthCallback(request, env);
  }
  if (isIdBrowserLanding(request)) {
    return handleIdBrowserLanding(request, env);
  }
  return idOAuthProvider.fetch(request, env, ctx);
}

/**
 * True when the request targets the ZapSign ID MCP bridge.
 */
export function isIdBridgePath(pathname: string): boolean {
  return pathname === IdOAuthRoutePaths.Api || pathname.startsWith(`${IdOAuthRoutePaths.Api}/`);
}
