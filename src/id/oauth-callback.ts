import type { Env } from '../types/env.js';
import {
  COLORS,
  CspProfile,
  ZAPSIGN_ICON_SVG,
  detectLanguage,
  escapeAttr,
  escapeHtml,
  htmlResponse,
  withSecurityHeaders,
} from '../utils/html.js';
import { log, logError } from '../utils/logger.js';
import { consumeOAuthState } from './oauth-state.js';
import {
  decodeAccessTokenSubject,
  exchangeAuthorizationCode,
} from './token-service.js';
import { storeIdTokens } from './token-store.js';
import type { IdAuthProps } from './types.js';

function renderCancelledPage(lang: string): string {
  const title = lang.startsWith('pt') ? 'Conexão cancelada' : 'Connection cancelled';
  const message = lang.startsWith('pt')
    ? 'Você cancelou a autorização do ZapSign ID. Volte ao aplicativo e tente novamente quando quiser conectar.'
    : 'You cancelled ZapSign ID authorization. Return to your app and try again when you are ready to connect.';
  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:${COLORS.neutral0};">
  <div style="max-width:480px;margin:48px auto;padding:0 16px;">
    <div style="background:#fff;border-radius:12px;padding:28px 24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">${ZAPSIGN_ICON_SVG}<strong>ZapSign ID</strong></div>
      <h1 style="font-size:1.25rem;margin:0 0 12px;">${escapeHtml(title)}</h1>
      <p style="color:${COLORS.neutral600};line-height:1.5;">${escapeHtml(message)}</p>
    </div>
  </div>
</body></html>`;
}

function renderCallbackError(message: string): Response {
  return new Response(message, { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/**
 * True when the request is the ZapSign ID OAuth redirect callback.
 */
export function isZapSignIdCallback(request: Request): boolean {
  if (request.method !== 'GET') {
    return false;
  }
  const url = new URL(request.url);
  if (url.pathname !== '/mcp/id') {
    return false;
  }
  return url.searchParams.has('state')
    && (url.searchParams.has('code') || url.searchParams.has('error'));
}

/**
 * Handles the ZapSign ID OAuth redirect callback at /mcp/id.
 *
 * @param request - OAuth redirect request
 * @param env - Worker env bindings
 * @returns Redirect to MCP client or HTML error page
 */
export async function handleIdOAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  if (!state) {
    return renderCallbackError('Missing OAuth state.');
  }

  const stored = await consumeOAuthState(env.OAUTH_KV, state);
  if (!stored) {
    return renderCallbackError('Invalid or expired OAuth state.');
  }

  const oauthError = url.searchParams.get('error');
  if (oauthError === 'access_denied') {
    const lang = detectLanguage(request);
    return withSecurityHeaders(htmlResponse(renderCancelledPage(lang), 200, { lang }), CspProfile.Auth);
  }

  if (oauthError) {
    logError('id_oauth_callback_denied', { error_code: oauthError });
    return renderCallbackError('Authorization failed.');
  }

  const code = url.searchParams.get('code');
  if (!code) {
    return renderCallbackError('Missing authorization code.');
  }

  try {
    const tokens = await exchangeAuthorizationCode(code, stored.verifier);
    const userId = decodeAccessTokenSubject(tokens.accessToken);
    if (!userId) {
      return renderCallbackError('Unable to resolve ZapSign ID account.');
    }

    await storeIdTokens(env.OAUTH_KV, env.ID_TOKEN_ENCRYPTION_KEY, userId, tokens);
    const authProps: IdAuthProps = {
      userId,
      grantedScope: tokens.scope,
    };
    const grantedScopes = tokens.scope.split(' ').filter((scope) => scope.length > 0);
    const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
      request: stored.oauthReqInfo,
      userId,
      metadata: {},
      scope: grantedScopes,
      props: authProps,
    });
    log('id_oauth_completed', { userId });
    return Response.redirect(redirectTo, 302);
  } catch (error) {
    logError('id_oauth_callback_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
    });
    return renderCallbackError('Authorization could not be completed.');
  }
}
