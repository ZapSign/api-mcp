import { OAuthProvider } from '@cloudflare/workers-oauth-provider';
import { createMcpHandler } from 'agents/mcp';
import type { Env } from './types/env.js';
import { createServer } from './server.js';
import { AuthHandler } from './auth/oauth-handler.js';
import { handleTokenExchange } from './auth/token-exchange.js';
import {
  CANONICAL_MCP_RESOURCE,
  CANONICAL_OAUTH_ORIGIN,
  DEFAULT_OAUTH_SCOPES,
  OAUTH_ROUTE_PATHS,
  SUPPORTED_OAUTH_ORIGINS,
  isSupportedOAuthOrigin,
} from './auth/types.js';
import {
  handleMcpBrowserLanding,
  isBrowserMcpNavigation,
} from './docs/mcp-browser-landing.js';

const REFRESH_TOKEN_TTL_SECONDS = 2592000; // 30 days — forces periodic reconnection even though the API token does not expire

interface StoredTokenData {
  audience?: string | string[];
}

function isStoredTokenData(value: unknown): value is StoredTokenData {
  if (typeof value !== 'object' || value === null || !('audience' in value)) {
    return false;
  }

  const audience = value.audience;
  return typeof audience === 'string'
    || (Array.isArray(audience) && audience.every((item) => typeof item === 'string'));
}

function isRootAudience(value: string): boolean {
  try {
    const audience = new URL(value);
    return isSupportedOAuthOrigin(audience.origin)
      && (audience.pathname === '' || audience.pathname === '/');
  } catch {
    return false;
  }
}

function getTokenStoragePrefix(token: string): string | null {
  const parts = token.split(':');
  if (parts.length !== 3) {
    return null;
  }

  return `token:${parts[0]}:${parts[1]}:`;
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function rejectRootAudience(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isSupportedOAuthOrigin(url.origin) || url.pathname !== OAUTH_ROUTE_PATHS.Api) {
    return null;
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length);
  const storagePrefix = getTokenStoragePrefix(token);
  if (!storagePrefix) {
    return null;
  }

  const tokenId = await hashToken(token);
  const tokenData = await env.OAUTH_KV.get(
    `${storagePrefix}${tokenId}`,
    { type: 'json' },
  );
  if (!isStoredTokenData(tokenData)) {
    return null;
  }

  const audiences = Array.isArray(tokenData.audience)
    ? tokenData.audience
    : tokenData.audience ? [tokenData.audience] : [];
  if (!audiences.some(isRootAudience)) {
    return null;
  }

  return new Response(JSON.stringify({
    error: 'invalid_token',
    error_description: 'Token audience does not match the MCP resource.',
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="OAuth", resource_metadata="${CANONICAL_OAUTH_ORIGIN}/.well-known/oauth-protected-resource", error="invalid_token", error_description="Invalid audience"`,
    },
  });
}

// agents@0.6.0 bundles its own @modelcontextprotocol/sdk@1.26.0, creating duplicate types.
// The runtime objects are compatible; the `as unknown` bridge is safe here.
const mcpHandler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const server = createServer();
    const handler = createMcpHandler(
      server as unknown as Parameters<typeof createMcpHandler>[0],
    );
    const response = await handler(request, env, ctx);
    response.headers.delete('Access-Control-Expose-Headers');
    return response;
  },
};

const oauthProvider = new OAuthProvider<Env>({
  // Path routes so mcp.zapsign.com.br and mcp.zapsign.co share the same Worker.
  apiRoute: OAUTH_ROUTE_PATHS.Api,
  apiHandler: mcpHandler,
  defaultHandler: AuthHandler,
  authorizeEndpoint: OAUTH_ROUTE_PATHS.Authorize,
  tokenEndpoint: OAUTH_ROUTE_PATHS.Token,
  clientRegistrationEndpoint: OAUTH_ROUTE_PATHS.Register,
  clientIdMetadataDocumentEnabled: true,
  allowPlainPKCE: false,
  scopesSupported: [...DEFAULT_OAUTH_SCOPES],
  tokenExchangeCallback: handleTokenExchange,
  refreshTokenTTL: REFRESH_TOKEN_TTL_SECONDS,
  resourceMetadata: {
    resource: CANONICAL_MCP_RESOURCE,
    authorization_servers: [...SUPPORTED_OAUTH_ORIGINS],
    scopes_supported: [...DEFAULT_OAUTH_SCOPES],
  },
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/mcp/id' || pathname.startsWith('/mcp/id/')) {
      const { handleIdBridgeRequest } = await import('./id/bridge.js');
      return handleIdBridgeRequest(request, env, ctx);
    }

    if (isBrowserMcpNavigation(request)) {
      return handleMcpBrowserLanding(request, env);
    }

    const audienceError = await rejectRootAudience(request, env);
    if (audienceError) {
      return audienceError;
    }

    return oauthProvider.fetch(request, env, ctx);
  },
};
