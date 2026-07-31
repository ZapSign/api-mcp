import type { Env } from '../types/env.js';
import {
  DEFAULT_OAUTH_SCOPES,
  isSupportedOAuthOrigin,
  type AuthProps,
} from './types.js';
import { handleDocs } from '../docs/index.js';
import { handlePrivacy } from '../docs/privacy-page.js';
import type { AuthRequest, ClientInfo } from '@cloudflare/workers-oauth-provider';
import { ZapSignClient } from '../api/client.js';
import { log, logError } from '../utils/logger.js';
import {
  COLORS,
  DEFAULT_UI_LANGUAGE,
  type SupportedLanguage,
  ZAPSIGN_ICON_SVG,
  detectLanguage,
  escapeAttr,
  escapeHtml,
  isSupportedLanguage,
  resolveUiCopy,
  CspProfile,
  withSecurityHeaders,
  htmlResponse,
  type CspProfileName,
} from '../utils/html.js';

const CSRF_TTL_SECONDS = 300;
const CSRF_KEY_PREFIX = 'csrf:';
const HMAC_SIGNATURE_PATTERN = /^[A-Za-z0-9+/]{43}=$/;
const VERSION = '2.0.0';

const ZAPSIGN_DASHBOARD_URLS: Record<string, string> = {
  production: 'https://app.zapsign.com.br/conta/configuracoes/integration?tab=api-zapsign',
  sandbox: 'https://sandbox.app.zapsign.com.br/conta/configuracoes/integration?tab=api-zapsign',
};

const ZAPSIGN_SIGNUP_URL = 'https://app.zapsign.com.br/cadastro';

const AuthorizationFailureReason = {
  CsrfInvalid: 'csrf_invalid',
  HmacInvalid: 'hmac_invalid',
  ApiTokenInvalid: 'api_token_invalid',
  OriginInvalid: 'origin_invalid',
} as const;

const SUPPORTED_SCOPE_SET = new Set<string>(DEFAULT_OAUTH_SCOPES);

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  'pt-BR': {
    title: 'Conectar ao ZapSign',
    submit: 'Conectar ao ZapSign',
    permissionsTitle: 'Ao conectar, o aplicativo poderá:',
    permRead: 'Ler seus documentos e templates',
    permCreate: 'Criar e enviar documentos para assinatura',
    permSigners: 'Gerenciar signatários',
    permDelete: 'Excluir documentos e remover signatários',
    apiTokenLabel: 'Token API',
    apiTokenPlaceholder: 'Cole seu token API do ZapSign',
    stepIntro: 'Para conectar, você precisará do seu Token API do ZapSign:',
    step1: 'Abra o painel do ZapSign',
    step1Link: 'Abrir Configurações do ZapSign',
    step2: 'Copie seu Token API na aba API (Configurações → Integrações → API)',
    step3: 'Cole-o abaixo',
    signUpPrompt: 'Não tem uma conta ZapSign?',
    signUpLink: 'Cadastre-se grátis',
    privacyNote: 'Seu token é criptografado e armazenado com segurança. Você pode desconectar a qualquer momento.',
    errorInvalidToken: 'Token API inválido. Verifique se você copiou o token completo de ZapSign: Configurações > Integrações.',
    errorCsrf: 'Sessão expirada. Por favor, tente novamente.',
    errorTampered: 'Requisição inválida. Por favor, volte e tente novamente.',
    errorUnexpected: 'Ocorreu um erro inesperado. Tente novamente.',
    restart: 'Volte ao aplicativo e inicie a conexão novamente.',
    clientLabel: 'Aplicativo:',
    redirectLabel: 'Você retornará para:',
    scopesTitle: 'Permissões solicitadas',
  },
  en: {
    title: 'Connect to ZapSign',
    submit: 'Connect to ZapSign',
    permissionsTitle: 'By connecting, the application will be able to:',
    permRead: 'Read your documents and templates',
    permCreate: 'Create and send documents for signature',
    permSigners: 'Manage signers',
    permDelete: 'Delete documents and remove signers',
    apiTokenLabel: 'API Token',
    apiTokenPlaceholder: 'Paste your ZapSign API token',
    stepIntro: 'To connect, you\'ll need your ZapSign API Token:',
    step1: 'Open your ZapSign Dashboard',
    step1Link: 'Open ZapSign Settings',
    step2: 'Copy your API Token from the API tab (Settings → Integrations → API)',
    step3: 'Paste it below',
    signUpPrompt: 'Don\'t have a ZapSign account?',
    signUpLink: 'Sign up for free',
    privacyNote: 'Your token is encrypted and stored securely. You can disconnect at any time.',
    errorInvalidToken: 'Invalid API token. Please verify you copied the complete token from ZapSign: Settings > Integrations.',
    errorCsrf: 'Session expired. Please try again.',
    errorTampered: 'Invalid request. Please go back and try again.',
    errorUnexpected: 'An unexpected error occurred. Please try again.',
    restart: 'Return to the application and start the connection again.',
    clientLabel: 'Application:',
    redirectLabel: 'You will return to:',
    scopesTitle: 'Requested permissions',
  },
  es: {
    title: 'Conectar a ZapSign',
    submit: 'Conectar a ZapSign',
    permissionsTitle: 'Al conectar, la aplicación podrá:',
    permRead: 'Leer tus documentos y plantillas',
    permCreate: 'Crear y enviar documentos para firma',
    permSigners: 'Gestionar firmantes',
    permDelete: 'Eliminar documentos y quitar firmantes',
    apiTokenLabel: 'Token API',
    apiTokenPlaceholder: 'Pega tu token API de ZapSign',
    stepIntro: 'Para conectar, necesitarás tu Token API de ZapSign:',
    step1: 'Abre el panel de ZapSign',
    step1Link: 'Abrir Configuración de ZapSign',
    step2: 'Copia tu Token API en la pestaña API (Configuración → Integraciones → API)',
    step3: 'Pégalo abajo',
    signUpPrompt: '¿No tienes una cuenta de ZapSign?',
    signUpLink: 'Regístrate gratis',
    privacyNote: 'Tu token se cifra y almacena de forma segura. Puedes desconectar en cualquier momento.',
    errorInvalidToken: 'Token API inválido. Verifica que hayas copiado el token completo de ZapSign: Configuración > Integraciones.',
    errorCsrf: 'Sesión expirada. Por favor, inténtalo de nuevo.',
    errorTampered: 'Solicitud inválida. Por favor, vuelve e inténtalo de nuevo.',
    errorUnexpected: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    restart: 'Vuelve a la aplicación e inicia la conexión nuevamente.',
    clientLabel: 'Aplicación:',
    redirectLabel: 'Volverás a:',
    scopesTitle: 'Permisos solicitados',
  },
};

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signHmac(data: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyHmac(data: string, signature: string, secret: string): Promise<boolean> {
  if (!HMAC_SIGNATURE_PATTERN.test(signature)) {
    return false;
  }

  const key = await getHmacKey(secret);
  const encoder = new TextEncoder();
  const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
}

async function generateCsrfToken(env: Env, oauthReqInfoB64: string): Promise<string> {
  const token = crypto.randomUUID();
  const binding = await signHmac(oauthReqInfoB64, env.COOKIE_ENCRYPTION_KEY);
  await env.OAUTH_KV.put(`${CSRF_KEY_PREFIX}${token}`, binding, {
    expirationTtl: CSRF_TTL_SECONDS,
  });
  return token;
}

async function verifyCsrfToken(
  env: Env,
  token: string,
  oauthReqInfoB64: string,
): Promise<boolean> {
  const stored = await env.OAUTH_KV.get(`${CSRF_KEY_PREFIX}${token}`);
  if (!stored) {
    return false;
  }
  await env.OAUTH_KV.delete(`${CSRF_KEY_PREFIX}${token}`);
  return verifyHmac(oauthReqInfoB64, stored, env.COOKIE_ENCRYPTION_KEY);
}

function resolveDashboardUrl(env: Env): string {
  return ZAPSIGN_DASHBOARD_URLS[env.ENVIRONMENT] ?? ZAPSIGN_DASHBOARD_URLS['production'];
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function validateApiToken(baseUrl: string, token: string): Promise<boolean> {
  try {
    const client = new ZapSignClient(baseUrl, token);
    await client.listDocuments({ page: 1 });
    return true;
  } catch {
    return false;
  }
}

function resolveGrantedScopes(requestedScopes: string[] | undefined): string[] {
  if (requestedScopes && requestedScopes.length > 0) {
    return requestedScopes;
  }

  return [...DEFAULT_OAUTH_SCOPES];
}

function findUnsupportedScope(scopes: string[] | undefined): string | undefined {
  return scopes?.find((scope) => !SUPPORTED_SCOPE_SET.has(scope));
}

function validateAuthorizationRequest(oauthRequest: AuthRequest): string | null {
  if (oauthRequest.responseType !== 'code' || !oauthRequest.clientId || !oauthRequest.redirectUri) {
    return 'The authorization request is missing required parameters.';
  }

  if (!oauthRequest.codeChallenge || oauthRequest.codeChallengeMethod !== 'S256') {
    return 'A code_challenge using S256 is required.';
  }

  const unsupportedScope = findUnsupportedScope(oauthRequest.scope);
  if (unsupportedScope) {
    return `The requested scope is not supported: ${unsupportedScope}`;
  }

  return null;
}

function oauthErrorResponse(
  code: string,
  description: string,
  status = 400,
): Response {
  return new Response(JSON.stringify({ error: code, error_description: description }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function validateLoginOrigin(
  request: Request,
  cfConnectingIp: string | undefined,
): Response | null {
  const origin = request.headers.get('Origin');
  if (!origin || isSupportedOAuthOrigin(origin)) {
    return null;
  }

  logAuthorizationFailure(AuthorizationFailureReason.OriginInvalid, cfConnectingIp);
  return oauthErrorResponse('invalid_request', 'The request Origin is not allowed.', 403);
}

function logAuthorizationFailure(
  reason: (typeof AuthorizationFailureReason)[keyof typeof AuthorizationFailureReason],
  cfConnectingIp: string | undefined,
): void {
  logError('authorize_failed', {
    reason,
    cf_connecting_ip: cfConnectingIp,
    error_id: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
  });
}

function escapeTranslations(translations: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(translations).map(([key, value]) => [key, escapeHtml(value)]),
  );
}

function buildTokenPageAttributes(
  lang: SupportedLanguage,
  oauthReqInfoB64: string,
  csrfToken: string,
  hmacSignature: string,
  dashboardUrl: string,
): Record<string, string> {
  return {
    lang: escapeAttr(lang),
    oauthReqInfoB64: escapeAttr(oauthReqInfoB64),
    csrfToken: escapeAttr(csrfToken),
    hmacSignature: escapeAttr(hmacSignature),
    dashboardUrl: escapeAttr(dashboardUrl),
  };
}

function renderErrorBanner(translations: Record<string, string>, errorKey?: string): string {
  if (!errorKey) {
    return '';
  }

  return `<div class="error-banner">${translations[errorKey] ?? translations['errorUnexpected']}</div>`;
}

function renderSecurityErrorPage(
  lang: SupportedLanguage,
  errorKey: string,
  status: number,
): Response {
  const t = escapeTranslations(resolveUiCopy(TRANSLATIONS, lang));
  const banner = renderErrorBanner(t, errorKey);
  const html = `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${t['title']}</title></head>
<body style="font-family:system-ui,sans-serif;background:${COLORS.neutral0};color:${COLORS.neutral950};display:grid;min-height:100vh;place-items:center;margin:0;padding:24px">
  <main style="background:${COLORS.white};border:1px solid ${COLORS.neutral200};border-radius:16px;max-width:440px;padding:40px;text-align:center">
    ${ZAPSIGN_ICON_SVG}<h1>ZapSign</h1>${banner}<p>${t['restart']}</p>
  </main>
</body>
</html>`;
  return htmlResponse(html, status, { lang });
}

interface ConsentDetails {
  clientName: string;
  redirectHost: string;
  scopes: string[];
}

function buildConsentDetails(
  oauthRequest: AuthRequest,
  clientInfo?: ClientInfo,
): ConsentDetails {
  return {
    clientName: clientInfo?.clientName ?? oauthRequest.clientId,
    redirectHost: new URL(oauthRequest.redirectUri).host,
    scopes: resolveGrantedScopes(oauthRequest.scope),
  };
}

function renderConsentDetails(
  translations: Record<string, string>,
  consent: ConsentDetails,
): string {
  const scopes = consent.scopes
    .map((scope) => `<li><code>${escapeHtml(scope)}</code></li>`)
    .join('');
  return `<section class="consent-details">
  <p><strong>${translations['clientLabel']}</strong> ${escapeHtml(consent.clientName)}</p>
  <p><strong>${translations['redirectLabel']}</strong> <code>${escapeHtml(consent.redirectHost)}</code></p>
  <h3>${translations['scopesTitle']}</h3><ul>${scopes}</ul>
</section>`;
}

function renderTokenPage(
  lang: SupportedLanguage,
  oauthReqInfoB64: string,
  csrfToken: string,
  hmacSignature: string,
  dashboardUrl: string,
  consent: ConsentDetails,
  errorKey?: string,
): string {
  const t = escapeTranslations(resolveUiCopy(TRANSLATIONS, lang));
  const attributes = buildTokenPageAttributes(lang, oauthReqInfoB64, csrfToken, hmacSignature, dashboardUrl);
  const errorHtml = renderErrorBanner(t, errorKey);
  const consentHtml = renderConsentDetails(t, consent);

  return `<!DOCTYPE html>
<html lang="${attributes['lang']}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t['title']}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: ${COLORS.neutral0};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: ${COLORS.neutral950};
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: ${COLORS.white};
      border: 1px solid ${COLORS.neutral200};
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px rgba(3,7,18,0.08), 0 4px 6px -4px rgba(3,7,18,0.05);
      padding: 40px;
      width: 100%;
      max-width: 440px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .logo-row svg { flex-shrink: 0; }
    .logo-text {
      font-size: 22px;
      font-weight: 600;
      color: ${COLORS.neutral950};
      letter-spacing: -0.01em;
    }
    .permissions {
      background: ${COLORS.brandAlpha10};
      border: 1px solid ${COLORS.brandAlpha16};
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 24px;
    }
    .permissions h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 10px;
      color: ${COLORS.neutral950};
      letter-spacing: -0.006em;
    }
    .permissions ul { list-style: none; padding: 0; }
    .permissions li {
      font-size: 13px;
      color: ${COLORS.neutral600};
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.006em;
    }
    .permissions li::before {
      content: '';
      display: inline-block;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      background: ${COLORS.brand500};
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/%3E%3C/svg%3E") center/contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/%3E%3C/svg%3E") center/contain no-repeat;
    }
    .consent-details { margin-bottom: 24px; font-size: 13px; color: ${COLORS.neutral600}; }
    .consent-details p { margin-bottom: 8px; }
    .consent-details h3 { color: ${COLORS.neutral950}; font-size: 13px; margin: 12px 0 6px; }
    .consent-details ul { margin: 0; padding-left: 18px; }
    .consent-details code { color: ${COLORS.neutral950}; }
    .error-banner {
      background: ${COLORS.error50};
      color: ${COLORS.error600};
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: -0.006em;
    }
    .steps {
      margin-bottom: 24px;
    }
    .steps p {
      font-size: 13px;
      color: ${COLORS.neutral600};
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }
    .step-number {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${COLORS.brand500};
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-text {
      font-size: 13px;
      color: ${COLORS.neutral950};
      line-height: 22px;
      letter-spacing: -0.006em;
    }
    .step-link {
      color: ${COLORS.brand500};
      text-decoration: none;
      font-weight: 500;
    }
    .step-link:hover { text-decoration: underline; }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 6px;
      color: ${COLORS.neutral950};
      letter-spacing: -0.006em;
    }
    input[type="password"],
    input[type="text"] {
      width: 100%;
      padding: 10px 14px;
      background: ${COLORS.neutral0};
      border: 1px solid ${COLORS.neutral200};
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      color: ${COLORS.neutral950};
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input::placeholder { color: ${COLORS.neutral600}; }
    input:focus {
      border-color: ${COLORS.brand500};
      box-shadow: 0 0 0 3px rgba(31,94,244,0.12);
    }
    .field-group { margin-bottom: 28px; }
    .btn-submit {
      width: 100%;
      padding: 12px 20px;
      background: ${COLORS.brand500};
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      letter-spacing: -0.006em;
    }
    .btn-submit:hover {
      background: ${COLORS.brand700};
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(31,94,244,0.3);
    }
    .btn-submit:active {
      transform: translateY(0);
      box-shadow: none;
    }
    .privacy-note {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: ${COLORS.neutral600};
      line-height: 1.5;
    }
    .privacy-note svg {
      display: inline-block;
      vertical-align: -2px;
      margin-right: 4px;
    }
    .signup-row {
      margin-top: 16px;
      text-align: center;
      font-size: 12px;
      color: ${COLORS.neutral600};
      line-height: 1.5;
    }
    .signup-row a {
      color: ${COLORS.brand500};
      text-decoration: none;
      font-weight: 500;
    }
    .signup-row a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-row">
      ${ZAPSIGN_ICON_SVG}
      <span class="logo-text">ZapSign</span>
    </div>
    ${errorHtml}
    <div class="permissions">
      <h3>${t['permissionsTitle']}</h3>
      <ul>
        <li>${t['permRead']}</li>
        <li>${t['permCreate']}</li>
        <li>${t['permSigners']}</li>
        <li>${t['permDelete']}</li>
      </ul>
    </div>
    ${consentHtml}
    <div class="steps">
      <p>${t['stepIntro']}</p>
      <div class="step">
        <span class="step-number">1</span>
        <span class="step-text">${t['step1']} &mdash; <a class="step-link" href="${attributes['dashboardUrl']}" target="_blank" rel="noopener noreferrer">${t['step1Link']} &#8599;</a></span>
      </div>
      <div class="step">
        <span class="step-number">2</span>
        <span class="step-text">${t['step2']}</span>
      </div>
      <div class="step">
        <span class="step-number">3</span>
        <span class="step-text">${t['step3']}</span>
      </div>
    </div>
    <form method="POST" action="/authorize/login">
      <div class="field-group">
        <label for="apiToken">${t['apiTokenLabel']}</label>
        <input type="password" id="apiToken" name="apiToken" required placeholder="${t['apiTokenPlaceholder']}" autocomplete="off">
      </div>
      <input type="hidden" name="oauthReqInfo" value="${attributes['oauthReqInfoB64']}">
      <input type="hidden" name="csrfToken" value="${attributes['csrfToken']}">
      <input type="hidden" name="hmacSignature" value="${attributes['hmacSignature']}">
      <input type="hidden" name="lang" value="${attributes['lang']}">
      <button type="submit" class="btn-submit">${t['submit']}</button>
    </form>
    <p class="privacy-note">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="${COLORS.neutral600}" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
      ${t['privacyNote']}
    </p>
    <p class="signup-row">
      ${t['signUpPrompt']} <a href="${ZAPSIGN_SIGNUP_URL}" target="_blank" rel="noopener noreferrer">${t['signUpLink']} &#8599;</a>
    </p>
  </div>
</body>
</html>`;
}

async function handleHealth(): Promise<Response> {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString(), version: VERSION });
}

async function handleAuthorize(request: Request, env: Env): Promise<Response> {
  try {
    const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
    const validationError = validateAuthorizationRequest(oauthReqInfo);
    if (validationError) {
      const code = findUnsupportedScope(oauthReqInfo.scope) ? 'invalid_scope' : 'invalid_request';
      return oauthErrorResponse(code, validationError);
    }

    const clientInfo = await env.OAUTH_PROVIDER.lookupClient(oauthReqInfo.clientId);
    if (!clientInfo) {
      return oauthErrorResponse('invalid_client', 'Unknown OAuth client.');
    }

    const lang = detectLanguage(request);
    const oauthReqInfoB64 = btoa(JSON.stringify(oauthReqInfo));
    const csrfToken = await generateCsrfToken(env, oauthReqInfoB64);
    const hmacSignature = await signHmac(oauthReqInfoB64, env.COOKIE_ENCRYPTION_KEY);
    const dashboardUrl = resolveDashboardUrl(env);
    const consent = buildConsentDetails(oauthReqInfo, clientInfo);
    const html = renderTokenPage(lang, oauthReqInfoB64, csrfToken, hmacSignature, dashboardUrl, consent);
    return htmlResponse(html, 200, { lang });
  } catch (error) {
    logError('authorize_request_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
    });
    return oauthErrorResponse('invalid_request', 'Invalid OAuth authorization request.');
  }
}

interface TokenFormData {
  apiToken: string;
  oauthReqInfoB64: string;
  csrfToken: string;
  hmacSignature: string;
  lang: SupportedLanguage;
}

function parseTokenForm(params: URLSearchParams): TokenFormData {
  const rawLang = params.get('lang') ?? DEFAULT_UI_LANGUAGE;
  const lang: SupportedLanguage = isSupportedLanguage(rawLang)
    ? rawLang
    : DEFAULT_UI_LANGUAGE;
  return {
    apiToken: params.get('apiToken') ?? '',
    oauthReqInfoB64: params.get('oauthReqInfo') ?? '',
    csrfToken: params.get('csrfToken') ?? '',
    hmacSignature: params.get('hmacSignature') ?? '',
    lang,
  };
}

async function renderValidatedTokenError(
  env: Env,
  lang: SupportedLanguage,
  oauthReqInfoB64: string,
  errorKey: string,
  status: number,
): Promise<Response> {
  const newCsrf = await generateCsrfToken(env, oauthReqInfoB64);
  const newHmac = await signHmac(oauthReqInfoB64, env.COOKIE_ENCRYPTION_KEY);
  const dashboardUrl = resolveDashboardUrl(env);
  const oauthRequest: AuthRequest = JSON.parse(atob(oauthReqInfoB64));
  const consent = buildConsentDetails(oauthRequest);
  const html = renderTokenPage(lang, oauthReqInfoB64, newCsrf, newHmac, dashboardUrl, consent, errorKey);
  return htmlResponse(html, status, { lang });
}

async function validateSecurityTokens(
  env: Env,
  form: TokenFormData,
  cfConnectingIp: string | undefined,
): Promise<Response | null> {
  const csrfValid = await verifyCsrfToken(
    env,
    form.csrfToken,
    form.oauthReqInfoB64,
  );
  if (!csrfValid) {
    logAuthorizationFailure(AuthorizationFailureReason.CsrfInvalid, cfConnectingIp);
    return renderSecurityErrorPage(form.lang, 'errorCsrf', 403);
  }

  const hmacValid = await verifyHmac(form.oauthReqInfoB64, form.hmacSignature, env.COOKIE_ENCRYPTION_KEY);
  if (!hmacValid) {
    logAuthorizationFailure(AuthorizationFailureReason.HmacInvalid, cfConnectingIp);
    return renderSecurityErrorPage(form.lang, 'errorTampered', 400);
  }

  return null;
}

async function performTokenAuthorize(
  env: Env,
  form: TokenFormData,
  cfConnectingIp: string | undefined,
): Promise<Response> {
  let oauthReqInfo: AuthRequest;
  try {
    oauthReqInfo = JSON.parse(atob(form.oauthReqInfoB64));
  } catch (error) {
    logError('authorize_request_failed', {
      error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
    });
    return oauthErrorResponse('invalid_request', 'Invalid OAuth authorization request.');
  }

  const unsupportedScope = findUnsupportedScope(oauthReqInfo.scope);
  if (unsupportedScope) {
    return oauthErrorResponse(
      'invalid_scope',
      `The requested scope is not supported: ${unsupportedScope}`,
    );
  }

  const grantedScopes = resolveGrantedScopes(oauthReqInfo.scope);

  const isValid = await validateApiToken(env.ZAPSIGN_API_URL, form.apiToken);
  if (!isValid) {
    logAuthorizationFailure(AuthorizationFailureReason.ApiTokenInvalid, cfConnectingIp);
    return renderValidatedTokenError(env, form.lang, form.oauthReqInfoB64, 'errorInvalidToken', 200);
  }

  const userId = await hashToken(form.apiToken);

  const authProps: AuthProps = {
    userId,
    zapSignApiUrl: env.ZAPSIGN_API_URL,
    zapSignApiToken: form.apiToken,
    grantedScope: grantedScopes.join(' '),
  };

  const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId,
    metadata: {},
    scope: grantedScopes,
    props: authProps,
  });

  log('oauth_authorization_completed', { userId });
  return Response.redirect(redirectTo, 302);
}

async function handleTokenSubmit(request: Request, env: Env): Promise<Response> {
  const cfConnectingIp = request.headers.get('CF-Connecting-IP') ?? undefined;
  const originError = validateLoginOrigin(request, cfConnectingIp);
  if (originError) {
    return originError;
  }

  const body = await request.text();
  const form = parseTokenForm(new URLSearchParams(body));

  const securityError = await validateSecurityTokens(env, form, cfConnectingIp);
  if (securityError) {
    return securityError;
  }

  return performTokenAuthorize(env, form, cfConnectingIp);
}

type RouteHandler = (request: Request, env: Env) => Promise<Response>;

const routeHandlers: Record<string, RouteHandler> = {
  'GET /health': handleHealth,
  'GET /authorize': handleAuthorize,
  'GET /docs': handleDocs,
  'GET /privacy': handlePrivacy,
  'POST /authorize/login': handleTokenSubmit,
};

const ROUTE_CSP_PROFILES: Record<string, CspProfileName> = {
  'GET /docs': CspProfile.Marketing,
  'GET /privacy': CspProfile.Marketing,
};

function buildRouteKey(request: Request): string {
  const url = new URL(request.url);
  return `${request.method} ${url.pathname}`;
}

function resolveCspProfile(routeKey: string): CspProfileName {
  return ROUTE_CSP_PROFILES[routeKey] ?? CspProfile.Auth;
}

export const AuthHandler: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const routeKey = buildRouteKey(request);
    const handler = routeHandlers[routeKey];

    if (!handler) {
      return withSecurityHeaders(new Response('Not Found', { status: 404 }), CspProfile.Auth);
    }

    const response = await handler(request, env);
    return withSecurityHeaders(response, resolveCspProfile(routeKey));
  },
};
