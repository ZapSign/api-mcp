import { describe, it, expect } from 'vitest';
import { handlePrivacy, renderPrivacyPage } from '../../../src/docs/privacy-page.js';
import type { Env } from '../../../src/types/env.js';

function makeRequest(path: string, headers?: Record<string, string>): Request {
  return new Request(`https://mcp.zapsign.com.br${path}`, { method: 'GET', headers });
}

function makeEnv(): Env {
  return {
    OAUTH_KV: {} as Env['OAUTH_KV'],
    ZAPSIGN_API_URL: 'https://sandbox.api.zapsign.com.br',
    COOKIE_ENCRYPTION_KEY: 'test',
    ENVIRONMENT: 'sandbox',
    OAUTH_PROVIDER: {} as Env['OAUTH_PROVIDER'],
    GA4_MEASUREMENT_ID: '',
    CLARITY_PROJECT_ID: '',
  };
}

describe('renderPrivacyPage', () => {
  it('should return valid HTML with connector privacy content', () => {
    const html = renderPrivacyPage('en');
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('ZapSign MCP Connector');
    expect(html).toContain('Claude');
    expect(html).toContain('ChatGPT');
    expect(html).toContain('Cloudflare');
    expect(html).toContain('support@zapsign.com.br');
  });
});

describe('handlePrivacy', () => {
  it('should return 200 HTML for GET /privacy', async () => {
    const response = await handlePrivacy(makeRequest('/privacy'), makeEnv());
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('Privacy Policy');
  });

  it('should honor Accept-Language for Content-Language', async () => {
    const response = await handlePrivacy(
      makeRequest('/privacy', { 'Accept-Language': 'pt-BR' }),
      makeEnv(),
    );
    expect(response.headers.get('Content-Language')).toBe('pt-BR');
  });
});
