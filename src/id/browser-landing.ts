import type { Env } from '../types/env.js';
import {
  COLORS,
  CspProfile,
  ZAPSIGN_ICON_SVG,
  detectLanguage,
  escapeAttr,
  escapeHtml,
  htmlResponse,
  resolveUiCopy,
  withSecurityHeaders,
  type SupportedLanguage,
} from '../utils/html.js';
import { readMeasurementIds, renderMeasurementSnippets } from '../utils/measurement.js';
import { IdMcpResource } from './constants.js';

const MCP_URL_PLACEHOLDER = '{mcpUrl}';

type LandingCopy = {
  title: string;
  lead: string;
  howTitle: string;
  step1: string;
  step2: string;
  step3: string;
  ctaDocs: string;
  urlLabel: string;
};

const COPY: Record<SupportedLanguage, LandingCopy> = {
  'pt-BR': {
    title: 'Conectar ao ZapSign ID',
    lead: 'Esta URL é o endpoint MCP do ZapSign ID. A autorização OAuth abre quando você adiciona o conector no ChatGPT ou em outro cliente MCP.',
    howTitle: 'Como conectar',
    step1: 'Abra seu cliente MCP e crie um conector apontando para a URL abaixo',
    step2: 'Ao conectar, você será redirecionado para login no ZapSign ID',
    step3: `URL do servidor MCP: ${MCP_URL_PLACEHOLDER}`,
    ctaDocs: 'Documentação ZapSign ID',
    urlLabel: 'URL do conector MCP',
  },
  en: {
    title: 'Connect to ZapSign ID',
    lead: 'This URL is the ZapSign ID MCP endpoint. OAuth authorization opens when you add the connector in ChatGPT or another MCP client.',
    howTitle: 'How to connect',
    step1: 'Create an MCP connector in your client using the URL below',
    step2: 'When connecting, you will sign in with ZapSign ID OAuth',
    step3: `MCP server URL: ${MCP_URL_PLACEHOLDER}`,
    ctaDocs: 'ZapSign ID documentation',
    urlLabel: 'MCP connector URL',
  },
  es: {
    title: 'Conectar a ZapSign ID',
    lead: 'Esta URL es el endpoint MCP de ZapSign ID. La autorización OAuth se abre al agregar el conector en ChatGPT u otro cliente MCP.',
    howTitle: 'Cómo conectar',
    step1: 'Crea un conector MCP en tu cliente con la URL de abajo',
    step2: 'Al conectar, iniciarás sesión con OAuth de ZapSign ID',
    step3: `URL del servidor MCP: ${MCP_URL_PLACEHOLDER}`,
    ctaDocs: 'Documentación de ZapSign ID',
    urlLabel: 'URL del conector MCP',
  },
};

/**
 * True for human browser navigations to /mcp/id without OAuth callback params.
 */
export function isIdBrowserLanding(request: Request): boolean {
  if (request.method !== 'GET') {
    return false;
  }

  const url = new URL(request.url);
  if (url.pathname !== '/mcp/id') {
    return false;
  }

  if (url.searchParams.has('code') || url.searchParams.has('error') || url.searchParams.has('state')) {
    return false;
  }

  if (request.headers.get('Authorization')) {
    return false;
  }

  const accept = request.headers.get('Accept') ?? '';
  if (accept.includes('text/event-stream')) {
    return false;
  }

  if (accept.includes('text/html')) {
    return true;
  }

  return request.headers.get('Sec-Fetch-Dest') === 'document';
}

function renderLanding(lang: SupportedLanguage, mcpUrl: string, measurementHtml: string): string {
  const t = resolveUiCopy(COPY, lang);
  const title = escapeHtml(t.title);
  const lead = escapeHtml(t.lead);
  const howTitle = escapeHtml(t.howTitle);
  const steps = [t.step1, t.step2, t.step3]
    .map((step) => `<li>${escapeHtml(step.replaceAll(MCP_URL_PLACEHOLDER, mcpUrl))}</li>`)
    .join('');
  const urlLabel = escapeHtml(t.urlLabel);
  const ctaDocs = escapeHtml(t.ctaDocs);
  const escapedMcpUrl = escapeHtml(mcpUrl);
  const measurement = measurementHtml ? `\n${measurementHtml}` : '';

  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — ZapSign ID MCP</title>
  <style>
    body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:${COLORS.neutral0};color:${COLORS.neutral950};}
    .wrap{max-width:480px;margin:48px auto;padding:0 16px;}
    .card{background:#fff;border-radius:12px;padding:28px 24px;box-shadow:0 1px 3px rgba(0,0,0,.08);}
    .brand{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
    .brand svg{width:28px;height:28px;}
    h1{font-size:1.35rem;margin:0 0 12px;}
    p{line-height:1.5;color:${COLORS.neutral600};margin:0 0 16px;}
    ol{margin:0 0 20px;padding-left:1.25rem;color:${COLORS.neutral600};line-height:1.55;}
    .url-box{background:${COLORS.brandAlpha10};border:1px solid ${COLORS.brandAlpha16};border-radius:8px;padding:12px 14px;margin-bottom:20px;word-break:break-all;font-family:ui-monospace,monospace;font-size:.9rem;}
    .label{font-size:.75rem;font-weight:600;color:${COLORS.neutral600};margin-bottom:6px;text-transform:uppercase;letter-spacing:.02em;}
    a.btn{display:block;text-align:center;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:600;background:${COLORS.brand500};color:#fff;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="brand">${ZAPSIGN_ICON_SVG}<strong>ZapSign ID</strong></div>
      <h1>${title}</h1>
      <p>${lead}</p>
      <div class="label">${urlLabel}</div>
      <div class="url-box">${escapedMcpUrl}</div>
      <h2 style="font-size:1rem;margin:0 0 10px;">${howTitle}</h2>
      <ol>${steps}</ol>
      <a class="btn" href="https://docs.id.zapsign.com.br/" target="_blank" rel="noopener noreferrer">${ctaDocs}</a>
    </div>
  </div>${measurement}
</body>
</html>`;
}

/**
 * Serves a human-readable landing page for browser visits to /mcp/id.
 *
 * @param request - Incoming browser request
 * @param env - Worker env bindings
 * @returns HTML response
 */
export function handleIdBrowserLanding(request: Request, env: Env): Response {
  const lang = detectLanguage(request);
  const measurementHtml = renderMeasurementSnippets(readMeasurementIds(env), lang);
  const html = renderLanding(lang, IdMcpResource, measurementHtml);
  return withSecurityHeaders(htmlResponse(html, 200, { lang }), CspProfile.Marketing);
}
