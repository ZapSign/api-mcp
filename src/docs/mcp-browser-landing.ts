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

const CHATGPT_TUTORIAL_URL = 'https://agents.zapsign.com.br/tutoriais/chatgpt.html';
const PRIVACY_POLICY_URL = 'https://zapsign.co/politica-de-privacidade';
const MCP_URL_PLACEHOLDER = '{mcpUrl}';

type LandingCopy = {
  title: string;
  lead: string;
  howTitle: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  ctaChatgpt: string;
  ctaDocs: string;
  urlLabel: string;
  privacy: string;
};

const COPY: Record<SupportedLanguage, LandingCopy> = {
  'pt-BR': {
    title: 'Conectar ao ZapSign',
    lead: 'Esta URL é o endpoint MCP. A tela de autorização com o Token API abre quando você adiciona o conector no ChatGPT (ou outro cliente MCP, como o Claude).',
    howTitle: 'Como conectar no ChatGPT',
    step1: 'Abra o ChatGPT → Settings → Apps & Connectors → Advanced → ative Developer mode',
    step2: 'Em Connectors → Create, informe Nome: ZapSign',
    step3: `URL do servidor MCP: ${MCP_URL_PLACEHOLDER}`,
    step4: 'Ao conectar, a ZapSign abre a página de autorização para você colar o Token API',
    ctaChatgpt: 'Ver tutorial do ChatGPT',
    ctaDocs: 'Documentação do conector',
    urlLabel: 'URL do conector MCP',
    privacy: 'Política de Privacidade',
  },
  en: {
    title: 'Connect to ZapSign',
    lead: 'This URL is the MCP endpoint. The API Token authorization page opens when you add the connector in ChatGPT (or another MCP client, such as Claude).',
    howTitle: 'How to connect in ChatGPT',
    step1: 'Open ChatGPT → Settings → Apps & Connectors → Advanced → enable Developer mode',
    step2: 'In Connectors → Create, enter Name: ZapSign',
    step3: `MCP server URL: ${MCP_URL_PLACEHOLDER}`,
    step4: 'When you connect, ZapSign opens the authorization page to paste your API Token',
    ctaChatgpt: 'Open ChatGPT tutorial',
    ctaDocs: 'Connector documentation',
    urlLabel: 'MCP connector URL',
    privacy: 'Privacy Policy',
  },
  es: {
    title: 'Conectar a ZapSign',
    lead: 'Esta URL es el endpoint MCP. La página de autorización con Token API se abre al agregar el conector en ChatGPT (u otro cliente MCP, como Claude).',
    howTitle: 'Cómo conectar en ChatGPT',
    step1: 'Abre ChatGPT → Settings → Apps & Connectors → Advanced → activa Developer mode',
    step2: 'En Connectors → Create, indica Nombre: ZapSign',
    step3: `URL del servidor MCP: ${MCP_URL_PLACEHOLDER}`,
    step4: 'Al conectar, ZapSign abre la página de autorización para pegar tu Token API',
    ctaChatgpt: 'Ver tutorial de ChatGPT',
    ctaDocs: 'Documentación del conector',
    urlLabel: 'URL del conector MCP',
    privacy: 'Política de Privacidad',
  },
};

/**
 * True for human browser navigations to /mcp (not MCP protocol clients).
 */
export function isBrowserMcpNavigation(request: Request): boolean {
  if (request.method !== 'GET') {
    return false;
  }

  const url = new URL(request.url);
  if (url.pathname !== '/mcp') {
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

function renderLanding(
  lang: SupportedLanguage,
  mcpUrl: string,
  docsUrl: string,
  measurementHtml: string,
): string {
  const t = resolveUiCopy(COPY, lang);
  const title = escapeHtml(t.title);
  const lead = escapeHtml(t.lead);
  const howTitle = escapeHtml(t.howTitle);
  const steps = [t.step1, t.step2, t.step3, t.step4]
    .map((step) => `<li>${escapeHtml(step.replaceAll(MCP_URL_PLACEHOLDER, mcpUrl))}</li>`)
    .join('');
  const urlLabel = escapeHtml(t.urlLabel);
  const ctaChatgpt = escapeHtml(t.ctaChatgpt);
  const ctaDocs = escapeHtml(t.ctaDocs);
  const privacy = escapeHtml(t.privacy);
  const escapedMcpUrl = escapeHtml(mcpUrl);
  const measurement = measurementHtml ? `\n${measurementHtml}` : '';

  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — ZapSign MCP</title>
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
    .actions{display:flex;flex-direction:column;gap:10px;}
    a.btn{display:block;text-align:center;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:600;}
    a.primary{background:${COLORS.brand500};color:#fff;}
    a.secondary{background:${COLORS.neutral0};color:${COLORS.neutral950};border:1px solid ${COLORS.neutral200};}
    .privacy{margin-top:16px;text-align:center;font-size:13px;}
    .privacy a{color:${COLORS.neutral600};}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="brand">${ZAPSIGN_ICON_SVG}<strong>ZapSign</strong></div>
      <h1>${title}</h1>
      <p>${lead}</p>
      <div class="label">${urlLabel}</div>
      <div class="url-box">${escapedMcpUrl}</div>
      <h2 style="font-size:1rem;margin:0 0 10px;">${howTitle}</h2>
      <ol>${steps}</ol>
      <div class="actions">
        <a class="btn primary" href="${escapeAttr(CHATGPT_TUTORIAL_URL)}">${ctaChatgpt}</a>
        <a class="btn secondary" href="${escapeAttr(docsUrl)}">${ctaDocs}</a>
      </div>
      <p class="privacy"><a href="${escapeAttr(PRIVACY_POLICY_URL)}" target="_blank" rel="noopener noreferrer">${privacy}</a></p>
    </div>
  </div>${measurement}
</body>
</html>`;
}

/**
 * Serves a human-readable connect page for browser visits to /mcp.
 *
 * @param request - Incoming browser request
 * @param env - Worker env (measurement IDs)
 * @returns HTML response with marketing security headers
 */
export function handleMcpBrowserLanding(request: Request, env: Env): Response {
  const lang = detectLanguage(request);
  const origin = new URL(request.url).origin;
  const mcpUrl = `${origin}/mcp`;
  const docsUrl = `${origin}/docs`;
  const measurementHtml = renderMeasurementSnippets(readMeasurementIds(env), lang);
  const html = renderLanding(lang, mcpUrl, docsUrl, measurementHtml);
  return withSecurityHeaders(htmlResponse(html, 200, { lang }), CspProfile.Marketing);
}
