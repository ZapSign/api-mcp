import { describe, expect, it } from 'vitest';
import workerExample from '../../../.dev.vars.example?raw';
import integrationExample from '../../.env.test.example?raw';
import genericExample from '../../../.env.example?raw';
import readme from '../../../README.md?raw';

describe('environment examples', () => {
  it('should separate local Worker bindings from opt-in integration credentials', () => {
    expect(workerExample).toContain('ZAPSIGN_API_URL=https://sandbox.api.zapsign.com.br');
    expect(workerExample).toContain('COOKIE_ENCRYPTION_KEY=');
    expect(workerExample).toContain('ENVIRONMENT=sandbox');
    expect(workerExample).not.toContain('ZAPSIGN_API_TOKEN=');

    expect(integrationExample).toContain('ZAPSIGN_API_URL=https://sandbox.api.zapsign.com.br');
    expect(integrationExample).toContain('ZAPSIGN_API_TOKEN=');
    expect(integrationExample).toContain('ZAPSIGN_TEMPLATE_TOKEN=');
    expect(integrationExample).toContain('ZAPSIGN_TEST_SIGNER_EMAIL=');
    expect(integrationExample).toContain('ZAPSIGN_TEST_PDF_URL=');
    expect(integrationExample).toContain('ZAPSIGN_ENABLE_NOTIFICATIONS=false');
  });

  it('should direct developers to the scoped example files', () => {
    expect(genericExample).toContain('.dev.vars.example');
    expect(genericExample).toContain('test/.env.test.example');
    expect(readme).toContain('cp .dev.vars.example .dev.vars');
    expect(readme).toContain('npm run test:integration');
    expect(readme).toContain('ZAPSIGN_TEST_SIGNER_EMAIL');
    expect(readme).toContain('ZAPSIGN_TEST_PDF_URL');
  });
});
