import { describe, expect, it } from 'vitest';

import {
  getSandboxPreflightErrors,
  readSandboxIntegrationConfig,
} from '../integration/config.js';

describe('sandbox integration configuration', () => {
  it('should accept an owned sandbox configuration with notifications disabled', () => {
    const config = readSandboxIntegrationConfig({
      ZAPSIGN_API_URL: 'https://sandbox.api.zapsign.com.br/',
      ZAPSIGN_API_TOKEN: 'sandbox-token',
      ZAPSIGN_TEMPLATE_TOKEN: 'template-token',
      ZAPSIGN_TEST_SIGNER_EMAIL: 'mcp-tests@example.test',
      ZAPSIGN_TEST_PDF_URL: 'https://fixtures.example.test/document.pdf',
    });

    expect(getSandboxPreflightErrors(config)).toEqual([]);
    expect(config.notificationsEnabled).toBe(false);
  });

  it('should reject production URLs and missing institutional test recipients', () => {
    const config = readSandboxIntegrationConfig({
      ZAPSIGN_API_URL: 'https://api.zapsign.com.br',
      ZAPSIGN_API_TOKEN: 'token',
    });

    expect(getSandboxPreflightErrors(config)).toEqual([
      'ZAPSIGN_API_URL must be https://sandbox.api.zapsign.com.br.',
      'ZAPSIGN_TEST_SIGNER_EMAIL is required for an owned test inbox.',
      'ZAPSIGN_TEST_PDF_URL is required for an owned PDF fixture.',
    ]);
  });
});
