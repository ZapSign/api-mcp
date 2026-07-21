export const SANDBOX_API_URL = 'https://sandbox.api.zapsign.com.br';

export interface SandboxIntegrationConfig {
  apiToken: string;
  apiUrl: string;
  notificationsEnabled: boolean;
  pdfUrl: string;
  signerEmail: string;
  templateToken: string;
}

function readValue(env: Record<string, string | undefined>, key: string): string {
  return env[key]?.trim() ?? '';
}

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function readSandboxIntegrationConfig(
  env: Record<string, string | undefined>,
): SandboxIntegrationConfig {
  return {
    apiToken: readValue(env, 'ZAPSIGN_API_TOKEN'),
    apiUrl: normalizeUrl(readValue(env, 'ZAPSIGN_API_URL')),
    notificationsEnabled: readValue(env, 'ZAPSIGN_ENABLE_NOTIFICATIONS') === 'true',
    pdfUrl: readValue(env, 'ZAPSIGN_TEST_PDF_URL'),
    signerEmail: readValue(env, 'ZAPSIGN_TEST_SIGNER_EMAIL'),
    templateToken: readValue(env, 'ZAPSIGN_TEMPLATE_TOKEN'),
  };
}

export function getSandboxPreflightErrors(
  config: SandboxIntegrationConfig,
): string[] {
  const errors: string[] = [];
  if (config.apiUrl !== SANDBOX_API_URL) {
    errors.push(`ZAPSIGN_API_URL must be ${SANDBOX_API_URL}.`);
  }
  if (!config.apiToken) {
    errors.push('ZAPSIGN_API_TOKEN is required for sandbox integration tests.');
  }
  if (!config.signerEmail) {
    errors.push('ZAPSIGN_TEST_SIGNER_EMAIL is required for an owned test inbox.');
  }
  if (!config.pdfUrl) {
    errors.push('ZAPSIGN_TEST_PDF_URL is required for an owned PDF fixture.');
  }
  return errors;
}
