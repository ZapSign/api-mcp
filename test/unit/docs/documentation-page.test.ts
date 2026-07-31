import { describe, it, expect } from 'vitest';
import { renderDocumentationPage } from '../../../src/docs/documentation-page.js';
import { handleDocs } from '../../../src/docs/index.js';
import { detectLanguage } from '../../../src/utils/html.js';
import type { Env } from '../../../src/types/env.js';

function makeRequest(method: string, path: string, options?: { headers?: Record<string, string> }): Request {
  const url = `https://mcp.example.com${path}`;
  return new Request(url, { method, headers: options?.headers ?? {} });
}

function makeEnv(overrides?: Partial<Pick<Env, 'GA4_MEASUREMENT_ID' | 'CLARITY_PROJECT_ID'>>): Env {
  return {
    OAUTH_KV: {} as Env['OAUTH_KV'],
    ZAPSIGN_API_URL: 'https://sandbox.api.zapsign.com.br',
    COOKIE_ENCRYPTION_KEY: 'test',
    ENVIRONMENT: 'sandbox',
    OAUTH_PROVIDER: {} as Env['OAUTH_PROVIDER'],
    GA4_MEASUREMENT_ID: '',
    CLARITY_PROJECT_ID: '',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// renderDocumentationPage
// ---------------------------------------------------------------------------

describe('renderDocumentationPage', () => {
  it('should return valid HTML with DOCTYPE', () => {
    const html = renderDocumentationPage('en');
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('</html>');
  });

  it('should render in English by default', () => {
    const html = renderDocumentationPage('en');
    expect(html).toContain('What is this');
    expect(html).toContain('How to Connect');
    expect(html).toContain('Available Tools');
  });

  it('should render in Portuguese', () => {
    const html = renderDocumentationPage('pt-BR');
    expect(html).toContain('O que é isso');
    expect(html).toContain('Como conectar');
  });

  it('should render in Spanish', () => {
    const html = renderDocumentationPage('es');
    expect(html).toContain('Qué es esto');
    expect(html).toContain('Cómo conectar');
  });

  it('should set correct html lang attribute', () => {
    expect(renderDocumentationPage('en')).toContain('lang="en"');
    expect(renderDocumentationPage('pt-BR')).toContain('lang="pt-BR"');
    expect(renderDocumentationPage('es')).toContain('lang="es"');
  });

  it('should include the full tool union names', () => {
    const html = renderDocumentationPage('en');
    const toolNames = [
      'list_documents',
      'get_document',
      'create_document',
      'update_document',
      'delete_document',
      'place_signatures',
      'add_extra_document',
      'add_extra_document_from_template',
      'add_timestamp',
      'reorder_envelope_documents',
      'add_signer',
      'get_signer',
      'update_signer',
      'delete_signer',
      'sign_in_batch',
      'list_templates',
      'get_template',
      'create_from_template',
      'create_webhook',
      'delete_webhook',
      'create_webhook_header',
      'delete_webhook_header',
      'reprocess_documents_webhooks',
      'create_partner_account',
      'update_partner_payment_status',
    ];
    for (const name of toolNames) {
      expect(html).toContain(name);
    }
  });

  it('should include prerequisite links', () => {
    const html = renderDocumentationPage('en');
    expect(html).toContain('zapsign.co/plans-and-prices');
    expect(html).toContain('app.zapsign.co/conta/configuracoes/integration');
  });

  it('should include ZapSign API docs link', () => {
    const html = renderDocumentationPage('en');
    expect(html).toContain('docs.zapsign.com.br');
  });

  it('should include footer links', () => {
    const html = renderDocumentationPage('en');
    expect(html).toContain('mailto:support@zapsign.com.br');
    expect(html).toContain('clients.zapsign.com.br');
    expect(html).toContain('vanta.com');
    expect(html).toContain('https://mcp.zapsign.com.br/privacy');
    expect(html).toContain('plans-and-prices');
  });

  it('should include server URL', () => {
    const html = renderDocumentationPage('en');
    expect(html).toContain('mcp.zapsign.com.br');
  });

  it('should include troubleshooting section', () => {
    const html = renderDocumentationPage('en');
    expect(html).toContain('<details>');
    expect(html).toContain('<summary>');
  });

  it('should NOT contain script tags without measurement HTML', () => {
    const html = renderDocumentationPage('en');
    expect(html).not.toContain('<script');
  });

  it('should include measurement HTML when provided', () => {
    const html = renderDocumentationPage('en', '<script>window.__zs=1</script>');
    expect(html).toContain('<script>window.__zs=1</script>');
  });
});

// ---------------------------------------------------------------------------
// handleDocs (route handler)
// ---------------------------------------------------------------------------

describe('handleDocs', () => {
  it('should return 200 with text/html content type', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request, makeEnv());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
  });

  it('should include marketing security headers', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request, makeEnv());

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Content-Security-Policy')).toContain('googletagmanager.com');
    expect(response.headers.get('Content-Security-Policy')).not.toContain("script-src 'none'");
  });

  it('should omit analytics scripts when measurement IDs are unset', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request, makeEnv());
    const html = await response.text();

    expect(html).not.toContain('<script');
    expect(html).not.toContain('zs-consent');
  });

  it('should inject consent analytics when measurement IDs are set', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request, makeEnv({
      GA4_MEASUREMENT_ID: 'G-DOCS123',
      CLARITY_PROJECT_ID: 'docsclarity',
    }));
    const html = await response.text();

    expect(html).toContain('zs-consent');
    expect(html).toContain('G-DOCS123');
    expect(html).toContain('docsclarity');
  });

  it('should default to English when Accept-Language is missing', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request, makeEnv());
    const html = await response.text();

    expect(response.headers.get('Content-Language')).toBe('en');
    expect(response.headers.get('Vary')).toBe('Accept-Language');
    expect(html).toContain('What is this');
    expect(html).toContain('How to Connect');
  });

  it('should render in Portuguese for pt-BR Accept-Language', async () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'pt-BR' },
    });
    const response = await handleDocs(request, makeEnv());
    const html = await response.text();

    expect(response.headers.get('Content-Language')).toBe('pt-BR');
    expect(html).toContain('O que é isso');
    expect(html).toContain('Como conectar');
  });

  it('should render in Spanish for es Accept-Language', async () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'es-ES,es;q=0.9' },
    });
    const response = await handleDocs(request, makeEnv());
    const html = await response.text();

    expect(response.headers.get('Content-Language')).toBe('es');
    expect(html).toContain('Qué es esto');
    expect(html).toContain('Cómo conectar');
  });
});

// ---------------------------------------------------------------------------
// detectLanguage
// ---------------------------------------------------------------------------

describe('detectLanguage', () => {
  it('should use provided defaultLang when no match', () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'ja' },
    });
    const result = detectLanguage(request, 'en');
    expect(result).toBe('en');
  });

  it('should use en as default when no defaultLang provided', () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'ja' },
    });
    const result = detectLanguage(request);
    expect(result).toBe('en');
  });

  it('should still detect language from header regardless of defaultLang', () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'es' },
    });
    const result = detectLanguage(request, 'en');
    expect(result).toBe('es');
  });

  it('should honor Accept-Language quality values', () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'en;q=0.8,pt-BR;q=0.9' },
    });
    expect(detectLanguage(request)).toBe('pt-BR');
  });

  it('should honor ?lang= query over Accept-Language', () => {
    const request = makeRequest('GET', '/docs?lang=es', {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    expect(detectLanguage(request)).toBe('es');
  });
});
