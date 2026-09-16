import type { Env } from '../types/env.js';
import {
  COLORS,
  CspProfile,
  detectLanguage,
  escapeAttr,
  escapeHtml,
  htmlResponse,
  type SupportedLanguage,
  withSecurityHeaders,
  ZAPSIGN_ICON_SVG,
} from '../utils/html.js';
import { readMeasurementIds, renderMeasurementSnippets } from '../utils/measurement.js';
import { PRIVACY_POLICY_MARKDOWN } from './privacy-policy-markdown.js';

const INLINE_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const CODE_PATTERN = /`([^`]+)`/g;

function formatInlineMarkdown(text: string): string {
  const linkTokens: string[] = [];
  const withLinkTokens = text.replace(INLINE_LINK_PATTERN, (_match, label: string, href: string) => {
    const token = `\u0000${linkTokens.length}\u0000`;
    linkTokens.push(
      `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
    );
    return token;
  });
  const withFormatting = escapeHtml(withLinkTokens)
    .replace(BOLD_PATTERN, '<strong>$1</strong>')
    .replace(CODE_PATTERN, '<code>$1</code>');
  return withFormatting.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => {
    return linkTokens[Number(index)] ?? '';
  });
}

function renderListItem(line: string): string {
  return `<li>${formatInlineMarkdown(line.slice(2))}</li>`;
}

function isTableBlock(block: string): boolean {
  const lines = block.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length < 2) {
    return false;
  }
  return lines.every((line) => line.startsWith('|') && line.endsWith('|'));
}

function splitTableCells(line: string): string[] {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderMarkdownTable(block: string): string {
  const lines = block.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  const rows = lines.map(splitTableCells).filter((cells) => !isTableSeparatorRow(cells));
  if (rows.length === 0) {
    return '';
  }

  const [header, ...body] = rows;
  const thead = `<thead><tr>${header.map((cell) => `<th>${formatInlineMarkdown(cell)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${formatInlineMarkdown(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;
  return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
}

function renderMarkdownBlock(block: string): string {
  if (block.startsWith('# ')) {
    return `<h1>${formatInlineMarkdown(block.slice(2))}</h1>`;
  }
  if (block.startsWith('## ')) {
    return `<h2>${formatInlineMarkdown(block.slice(3))}</h2>`;
  }
  if (block.startsWith('### ')) {
    return `<h3>${formatInlineMarkdown(block.slice(4))}</h3>`;
  }
  if (isTableBlock(block)) {
    return renderMarkdownTable(block);
  }
  if (block.startsWith('- ')) {
    const items = block.split('\n').filter((line) => line.startsWith('- '));
    return `<ul>${items.map(renderListItem).join('')}</ul>`;
  }
  const paragraphs = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${formatInlineMarkdown(line)}</p>`);
  return paragraphs.join('');
}

function markdownToHtml(markdown: string): string {
  return markdown
    .trim()
    .split(/\n{2,}/)
    .map(renderMarkdownBlock)
    .join('\n');
}

/**
 * Renders the public privacy policy HTML page.
 *
 * @param lang - UI language for document lang / Content-Language
 * @param measurementHtml - Optional consent + analytics snippet
 * @returns Complete HTML document string
 */
export function renderPrivacyPage(lang: SupportedLanguage, measurementHtml = ''): string {
  const body = markdownToHtml(PRIVACY_POLICY_MARKDOWN);
  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Policy — ZapSign MCP</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, system-ui, sans-serif;
      background: ${COLORS.neutral0};
      color: ${COLORS.neutral950};
      line-height: 1.6;
      min-height: 100vh;
      padding: 32px 16px 48px;
    }
    .card {
      max-width: 720px;
      margin: 0 auto;
      background: ${COLORS.white};
      border: 1px solid ${COLORS.neutral200};
      border-radius: 16px;
      padding: 32px 28px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .content h1 { font-size: 28px; margin-bottom: 12px; letter-spacing: -0.02em; }
    .content h2 { font-size: 18px; margin: 28px 0 10px; letter-spacing: -0.01em; }
    .content h3 { font-size: 16px; margin: 20px 0 8px; letter-spacing: -0.01em; }
    .content p { margin-bottom: 12px; color: ${COLORS.neutral600}; font-size: 15px; }
    .content ul { margin: 0 0 12px 20px; color: ${COLORS.neutral600}; font-size: 15px; }
    .content li { margin-bottom: 6px; }
    .content a { color: ${COLORS.brand500}; }
    .content strong { color: ${COLORS.neutral950}; }
    .content code {
      font-size: 13px;
      background: ${COLORS.neutral0};
      padding: 2px 6px;
      border-radius: 4px;
    }
    .content .table-wrap { overflow-x: auto; margin: 0 0 16px; }
    .content table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      color: ${COLORS.neutral600};
    }
    .content th, .content td {
      border: 1px solid ${COLORS.neutral200};
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    .content th {
      background: ${COLORS.neutral0};
      color: ${COLORS.neutral950};
      font-weight: 600;
    }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid ${COLORS.neutral200};
      font-size: 13px;
      color: ${COLORS.neutral600};
    }
    .footer a { color: ${COLORS.brand500}; }
  </style>
</head>
<body>
  <main class="card">
    <div class="logo-row">
      ${ZAPSIGN_ICON_SVG}
      <span class="logo-text">ZapSign MCP</span>
    </div>
    <article class="content">
      ${body}
    </article>
    <p class="footer">
      Canonical URL:
      <a href="https://mcp.zapsign.com.br/privacy">https://mcp.zapsign.com.br/privacy</a>
    </p>
  </main>
  ${measurementHtml}
</body>
</html>`;
}

/**
 * Handles GET /privacy — public privacy policy for MCP directory submissions.
 */
export async function handlePrivacy(request: Request, env: Env): Promise<Response> {
  const lang = detectLanguage(request);
  const measurementHtml = renderMeasurementSnippets(readMeasurementIds(env), lang);
  const html = renderPrivacyPage(lang, measurementHtml);
  return withSecurityHeaders(htmlResponse(html, 200, { lang }), CspProfile.Marketing);
}
