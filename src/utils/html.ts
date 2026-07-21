/**
 * Shared HTML utilities for OAuth pages and responses.
 * Extracted from oauth-handler for reuse and testability.
 */

export const COLORS = {
  brand500: '#1F5EF4',
  brand700: '#1A3A9E',
  brandAlpha10: '#E9EFFE',
  brandAlpha16: '#DBE5FD',
  neutral0: '#F7F7F7',
  neutral200: '#D1D1D1',
  neutral600: '#5C5C5C',
  neutral950: '#030712',
  white: '#FFFFFF',
  error600: '#D7263D',
  error50: '#FEF2F2',
} as const;

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_UI_LANGUAGE: SupportedLanguage = 'en';

/**
 * Returns true when value is a supported UI language tag.
 */
export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export const ZAPSIGN_ICON_SVG = `<svg viewBox="0 0 114 115" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><path fill="#89d4f7" d="m113.97 24.18c-0.95 2.27-2.59 7.98-24.2 43.53-21.61 35.55-29.72 45.02-29.72 45.02q-0.48 0.74-1.25 1.17-0.78 0.43-1.66 0.43-0.88 0-1.66-0.43-0.77-0.43-1.25-1.17c0 0-8.22-9.48-29.73-45.02-21.54-35.53-23.39-41.49-24.19-43.53-0.8-2.04-0.13-4.15 2.92-4.76 0.9-0.19 2.72-0.62 5.79-1.16 3.14 5.87 8.48 15.28 17.78 30.64 20.01 33.03 27.63 41.85 27.63 41.85q0.44 0.69 1.17 1.09 0.73 0.39 1.55 0.39 0.82-0.01 1.55-0.4 0.71-0.4 1.16-1.1c0 0 7.56-8.8 27.63-41.85 9.37-15.43 14.72-24.81 17.82-30.65 3.12 0.54 4.96 0.99 5.77 1.17 2.73 0.6 3.84 2.52 2.9 4.79z"/><path fill="#2c68f5" d="m109.96 8.41q-2.02 5.06-4.68 9.82c-3.1 5.84-8.44 15.21-17.81 30.65-20.08 33.05-27.61 41.85-27.61 41.85-0.29 0.45-0.69 0.83-1.16 1.09q-0.72 0.39-1.54 0.39-0.82-0.01-1.54-0.39-0.71-0.4-1.16-1.09c0 0-7.62-8.82-27.63-41.85-9.3-15.35-14.64-24.77-17.78-30.64q-2.7-4.74-4.7-9.83c-0.77-1.91-0.12-3.86 2.7-4.45 2.82-0.59 15.89-3.96 50.13-3.96 34.24 0 47.57 3.4 50.13 3.96 2.56 0.56 3.57 2.34 2.68 4.45z"/></svg>`;

const HTML_ESCAPE_PATTERN = /[&<>"']/g;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtmlValue(value: string): string {
  return value.replace(HTML_ESCAPE_PATTERN, (character) => HTML_ESCAPES[character] ?? character);
}

/**
 * Escapes a value before inserting it into HTML text content.
 *
 * @param value - Untrusted or dynamically generated text
 * @returns HTML-safe text
 */
export function escapeHtml(value: string): string {
  return escapeHtmlValue(value);
}

/**
 * Escapes a value before inserting it into a quoted HTML attribute.
 *
 * @param value - Untrusted or dynamically generated attribute value
 * @returns HTML-safe attribute value
 */
export function escapeAttr(value: string): string {
  return escapeHtmlValue(value);
}

interface LanguagePreference {
  tag: string;
  q: number;
}

function parseAcceptLanguage(header: string): LanguagePreference[] {
  return header
    .split(',')
    .map((part) => {
      const segments = part.trim().split(';');
      const tag = (segments[0] ?? '').trim().toLowerCase();
      if (!tag) {
        return null;
      }

      const qSegment = segments.find((segment) => segment.trim().startsWith('q='));
      const qValue = qSegment ? Number.parseFloat(qSegment.trim().slice(2)) : 1;
      const q = Number.isFinite(qValue) ? qValue : 0;
      return { tag, q };
    })
    .filter((item): item is LanguagePreference => item !== null)
    .sort((left, right) => right.q - left.q);
}

function mapToSupportedLanguage(tag: string): SupportedLanguage | null {
  if (tag === 'pt-br' || tag.startsWith('pt')) {
    return 'pt-BR';
  }
  if (tag === 'en' || tag.startsWith('en-')) {
    return 'en';
  }
  if (tag === 'es' || tag.startsWith('es-')) {
    return 'es';
  }
  return null;
}

/**
 * Detects UI language from `?lang=` then Accept-Language (q-value order).
 * Falls back to English when no supported language is found.
 *
 * @param request - Request with optional lang query and Accept-Language
 * @param defaultLang - Fallback language (default: en)
 */
export function detectLanguage(
  request: Request,
  defaultLang: SupportedLanguage = DEFAULT_UI_LANGUAGE,
): SupportedLanguage {
  const url = new URL(request.url);
  const queryLang = url.searchParams.get('lang');
  if (queryLang && isSupportedLanguage(queryLang)) {
    return queryLang;
  }

  const preferences = parseAcceptLanguage(request.headers.get('Accept-Language') ?? '');
  for (const preference of preferences) {
    const mapped = mapToSupportedLanguage(preference.tag);
    if (mapped) {
      return mapped;
    }
  }

  return defaultLang;
}

/**
 * Picks localized copy with English fallback for missing catalogs.
 */
export function resolveUiCopy<T extends Record<string, string>>(
  catalog: Record<SupportedLanguage, T>,
  lang: SupportedLanguage,
): T {
  return catalog[lang] ?? catalog.en;
}

/**
 * Adds security headers to an HTML response (CSP, X-Content-Type-Options, X-Frame-Options).
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'none'; img-src 'self' data:");
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/**
 * Creates an HTML response with Content-Type and optional i18n headers.
 *
 * @param html - HTML document body
 * @param status - HTTP status code
 * @param options - Optional language for Content-Language / Vary
 */
export function htmlResponse(
  html: string,
  status: number,
  options?: { lang?: SupportedLanguage },
): Response {
  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
  if (options?.lang) {
    headers.set('Content-Language', options.lang);
    headers.set('Vary', 'Accept-Language');
  }
  return new Response(html, { status, headers });
}
