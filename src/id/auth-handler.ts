import type { Env } from '../types/env.js';
import {
  COLORS,
  CspProfile,
  detectLanguage,
  escapeAttr,
  escapeHtml,
  htmlResponse,
  withSecurityHeaders,
  ZAPSIGN_ICON_SVG,
  type SupportedLanguage,
} from '../utils/html.js';
import { log, logError } from '../utils/logger.js';
import {
  IdDefaultScopeString,
  IdOAuthClient,
  IdOAuthEndpoints,
  IdOAuthRoutePaths,
  IdOAuthScopes,
} from './constants.js';
import { buildPkcePair } from './pkce.js';
import { generateOAuthState, storeOAuthState } from './oauth-state.js';
import { revokeIdGrant } from './token-service.js';
import { getIdAuthProps } from './get-id-auth.js';

function oauthErrorResponse(code: string, description: string): Response {
  return new Response(JSON.stringify({ error: code, error_description: description }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildAuthorizeRedirect(state: string, challenge: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: IdOAuthClient.ClientId,
    redirect_uri: IdOAuthClient.RedirectUri,
    scope: IdDefaultScopeString,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${IdOAuthEndpoints.Authorization}?${params.toString()}`;
}

async function handleIdAuthorize(request: Request, env: Env): Promise<Response> {
  try {
    const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
    const state = generateOAuthState();
    const pkce = await buildPkcePair();
    await storeOAuthState(env.OAUTH_KV, state, {
      verifier: pkce.verifier,
      oauthReqInfo,
      createdAt: Date.now(),
    });
    const redirectUrl = buildAuthorizeRedirect(state, pkce.challenge);
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    logError('id_authorize_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
    });
    return oauthErrorResponse('invalid_request', 'Invalid OAuth authorization request.');
  }
}

function renderDisconnectPage(lang: SupportedLanguage, disconnected: boolean): Response {
  const title = disconnected ? 'Disconnected' : 'Disconnect failed';
  const message = disconnected
    ? 'Your ZapSign ID MCP connection was removed.'
    : 'Unable to disconnect. Sign in again and retry.';
  const html = `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:system-ui,sans-serif;background:${COLORS.neutral0};padding:48px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;">${ZAPSIGN_ICON_SVG}<strong>ZapSign ID</strong></div>
    <h1 style="font-size:1.2rem;">${escapeHtml(title)}</h1>
    <p style="color:${COLORS.neutral600};">${escapeHtml(message)}</p>
  </div>
</body></html>`;
  return withSecurityHeaders(htmlResponse(html, disconnected ? 200 : 400, { lang }), CspProfile.Auth);
}

async function handleIdDisconnect(request: Request, env: Env): Promise<Response> {
  const lang = detectLanguage(request);
  const props = getIdAuthProps();
  if (!props) {
    return renderDisconnectPage(lang, false);
  }

  try {
    await revokeIdGrant(env.OAUTH_KV, env.ID_TOKEN_ENCRYPTION_KEY, props.userId);
    log('id_oauth_disconnected', { userId: props.userId });
    return renderDisconnectPage(lang, true);
  } catch (error) {
    logError('id_disconnect_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
    });
    return renderDisconnectPage(lang, false);
  }
}

type RouteHandler = (request: Request, env: Env) => Promise<Response>;

const routeHandlers: Record<string, RouteHandler> = {
  [`GET ${IdOAuthRoutePaths.Authorize}`]: handleIdAuthorize,
  [`POST ${IdOAuthRoutePaths.Disconnect}`]: handleIdDisconnect,
};

function buildRouteKey(request: Request): string {
  const url = new URL(request.url);
  return `${request.method} ${url.pathname}`;
}

export const IdAuthHandler: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const routeKey = buildRouteKey(request);
    const handler = routeHandlers[routeKey];
    if (!handler) {
      return withSecurityHeaders(new Response('Not Found', { status: 404 }), CspProfile.Auth);
    }
    const response = await handler(request, env);
    return withSecurityHeaders(response, CspProfile.Auth);
  },
};

export const IdSupportedScopes = [...IdOAuthScopes];
