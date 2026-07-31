import { describe, it, expect } from 'vitest';
import { handleOpenAiAppsChallenge } from '../../../src/docs/openai-apps-challenge.js';
import type { Env } from '../../../src/types/env.js';

function makeRequest(): Request {
  return new Request('https://mcp.zapsign.com.br/.well-known/openai-apps-challenge', {
    method: 'GET',
  });
}

function makeEnv(token?: string): Env {
  return {
    OAUTH_KV: {} as Env['OAUTH_KV'],
    ZAPSIGN_API_URL: 'https://sandbox.api.zapsign.com.br',
    COOKIE_ENCRYPTION_KEY: 'test',
    ENVIRONMENT: 'sandbox',
    OAUTH_PROVIDER: {} as Env['OAUTH_PROVIDER'],
    GA4_MEASUREMENT_ID: '',
    CLARITY_PROJECT_ID: '',
    OPENAI_APPS_CHALLENGE_TOKEN: token,
  };
}

describe('handleOpenAiAppsChallenge', () => {
  it('should return 404 when challenge token is unset', async () => {
    const response = await handleOpenAiAppsChallenge(makeRequest(), makeEnv());
    expect(response.status).toBe(404);
  });

  it('should return plain-text challenge token when configured', async () => {
    const token = 'openai-challenge-token-example';
    const response = await handleOpenAiAppsChallenge(makeRequest(), makeEnv(token));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(await response.text()).toBe(token);
  });

  it('should return 404 when challenge token is blank', async () => {
    const response = await handleOpenAiAppsChallenge(makeRequest(), makeEnv('   '));
    expect(response.status).toBe(404);
  });
});
