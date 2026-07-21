import { describe, it, expect } from 'vitest';
import { renderDocumentationPage } from '../../../src/docs/documentation-page.js';
import { handleDocs } from '../../../src/docs/index.js';
import { detectLanguage } from '../../../src/utils/html.js';

function makeRequest(method: string, path: string, options?: { headers?: Record<string, string> }): Request {
  const url = `https://mcp.example.com${path}`;
  return new Request(url, { method, headers: options?.headers ?? {} });
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
    expect(html).toContain('politica-de-privacidade');
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

  it('should NOT contain script tags', () => {
    const html = renderDocumentationPage('en');
    expect(html).not.toContain('<script');
  });
});

// ---------------------------------------------------------------------------
// handleDocs (route handler)
// ---------------------------------------------------------------------------

describe('handleDocs', () => {
  it('should return 200 with text/html content type', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
  });

  it('should include security headers', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'none'");
  });

  it('should default to English when Accept-Language is missing', async () => {
    const request = makeRequest('GET', '/docs');
    const response = await handleDocs(request);
    const html = await response.text();

    expect(html).toContain('What is this');
    expect(html).toContain('How to Connect');
  });

  it('should render in Portuguese for pt-BR Accept-Language', async () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'pt-BR' },
    });
    const response = await handleDocs(request);
    const html = await response.text();

    expect(html).toContain('O que é isso');
    expect(html).toContain('Como conectar');
  });

  it('should render in Spanish for es Accept-Language', async () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'es-ES,es;q=0.9' },
    });
    const response = await handleDocs(request);
    const html = await response.text();

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

  it('should use pt-BR as default when no defaultLang provided', () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'ja' },
    });
    const result = detectLanguage(request);
    expect(result).toBe('pt-BR');
  });

  it('should still detect language from header regardless of defaultLang', () => {
    const request = makeRequest('GET', '/docs', {
      headers: { 'Accept-Language': 'es' },
    });
    const result = detectLanguage(request, 'en');
    expect(result).toBe('es');
  });
});
