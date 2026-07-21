import {
  COLORS,
  ZAPSIGN_ICON_SVG,
  detectLanguage,
  escapeAttr,
  escapeHtml,
  htmlResponse,
  resolveUiCopy,
  withSecurityHeaders,
  type SupportedLanguage,
} from '../utils/html.js';
import { CANONICAL_MCP_RESOURCE } from '../auth/types.js';

const CLAUDE_TUTORIAL_URL = 'https://agents.zapsign.com.br/tutoriais/claude.html';
const DOCS_URL = 'https://mcp.zapsign.com.br/docs';

type LandingCopy = {
  title: string;
  lead: string;
  howTitle: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  ctaClaude: string;
  ctaDocs: string;
  urlLabel: string;
};

const COPY: Record<SupportedLanguage, LandingCopy> = {
  'pt-BR': {
    title: 'Conectar ao ZapSign',
    lead: 'Esta URL é o endpoint MCP. A tela de autorização com o Token API abre quando você adiciona o conector no Claude (ou outro cliente MCP).',
    howTitle: 'Como conectar no Claude',
    step1: 'Abra Claude → Configurações → Conectores → Adicionar conector personalizado',
    step2: 'Nome: ZapSign · URL: https://mcp.zapsign.com.br/mcp',
    step3: 'Deixe Client ID / Client Secret vazios e clique em Adicionar',
    step4: 'Ao conectar, a ZapSign abre a página de autorização para você colar o Token API',
    ctaClaude: 'Ver tutorial do Claude',
    ctaDocs: 'Documentação do conector',
    urlLabel: 'URL do conector MCP',
  },
  en: {
    title: 'Connect to ZapSign',
    lead: 'This URL is the MCP endpoint. The API Token authorization page opens when you add the connector in Claude (or another MCP client).',
    howTitle: 'How to connect in Claude',
    step1: 'Open Claude → Settings → Connectors → Add custom connector',
    step2: 'Name: ZapSign · URL: https://mcp.zapsign.com.br/mcp',
    step3: 'Leave OAuth Client ID / Secret empty and click Add',
    step4: 'When you connect, ZapSign opens the authorization page to paste your API Token',
    ctaClaude: 'Open Claude tutorial',
    ctaDocs: 'Connector documentation',
    urlLabel: 'MCP connector URL',
  },
  es: {
    title: 'Conectar a ZapSign',
    lead: 'Esta URL es el endpoint MCP. La página de autorización con Token API se abre al agregar el conector en Claude (u otro cliente MCP).',
    howTitle: 'Cómo conectar en Claude',
    step1: 'Abre Claude → Configuración → Conectores → Agregar conector personalizado',
    step2: 'Nombre: ZapSign · URL: https://mcp.zapsign.com.br/mcp',
    step3: 'Deja Client ID / Client Secret vacíos y haz clic en Agregar',
    step4: 'Al conectar, ZapSign abre la página de autorización para pegar tu Token API',
    ctaClaude: 'Ver tutorial de Claude',
    ctaDocs: 'Documentación del conector',
    urlLabel: 'URL del conector MCP',
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

function renderLanding(lang: SupportedLanguage): string {
  const t = resolveUiCopy(COPY, lang);
  const title = escapeHtml(t.title);
  const lead = escapeHtml(t.lead);
  const howTitle = escapeHtml(t.howTitle);
  const steps = [t.step1, t.step2, t.step3, t.step4]
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join('');
  const urlLabel = escapeHtml(t.urlLabel);
  const ctaClaude = escapeHtml(t.ctaClaude);
  const ctaDocs = escapeHtml(t.ctaDocs);
  const mcpUrl = escapeAttr(CANONICAL_MCP_RESOURCE);

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
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="brand">${ZAPSIGN_ICON_SVG}<strong>ZapSign</strong></div>
      <h1>${title}</h1>
      <p>${lead}</p>
      <div class="label">${urlLabel}</div>
      <div class="url-box">${mcpUrl}</div>
      <h2 style="font-size:1rem;margin:0 0 10px;">${howTitle}</h2>
      <ol>${steps}</ol>
      <div class="actions">
        <a class="btn primary" href="${escapeAttr(CLAUDE_TUTORIAL_URL)}">${ctaClaude}</a>
        <a class="btn secondary" href="${escapeAttr(DOCS_URL)}">${ctaDocs}</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Serves a human-readable connect page for browser visits to /mcp.
 *
 * @param request - Incoming browser request
 * @returns HTML response with security headers
 */
export function handleMcpBrowserLanding(request: Request): Response {
  const lang = detectLanguage(request);
  return withSecurityHeaders(htmlResponse(renderLanding(lang), 200, { lang }));
}
