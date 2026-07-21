import { detectLanguage, withSecurityHeaders, htmlResponse } from '../utils/html.js';
import { renderDocumentationPage } from './documentation-page.js';

/**
 * Handles GET /docs - public documentation page for MCP Connectors Directory.
 */
export async function handleDocs(request: Request): Promise<Response> {
  const lang = detectLanguage(request);
  const html = renderDocumentationPage(lang);
  return withSecurityHeaders(htmlResponse(html, 200, { lang }));
}
