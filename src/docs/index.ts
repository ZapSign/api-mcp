import type { Env } from '../types/env.js';
import {
  CspProfile,
  detectLanguage,
  withSecurityHeaders,
  htmlResponse,
} from '../utils/html.js';
import { readMeasurementIds, renderMeasurementSnippets } from '../utils/measurement.js';
import { renderDocumentationPage } from './documentation-page.js';

/**
 * Handles GET /docs - public documentation page for MCP Connectors Directory.
 */
export async function handleDocs(request: Request, env: Env): Promise<Response> {
  const lang = detectLanguage(request);
  const measurementHtml = renderMeasurementSnippets(readMeasurementIds(env), lang);
  const html = renderDocumentationPage(lang, measurementHtml);
  return withSecurityHeaders(htmlResponse(html, 200, { lang }), CspProfile.Marketing);
}
