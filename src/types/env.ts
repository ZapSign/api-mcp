import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

export interface Env {
  OAUTH_KV: KVNamespace;
  ZAPSIGN_API_URL: string;
  COOKIE_ENCRYPTION_KEY: string;
  ENVIRONMENT: string;
  OAUTH_PROVIDER: OAuthHelpers;
  /** Public GA4 Measurement ID (G-…); empty until property is created */
  GA4_MEASUREMENT_ID: string;
  /** Public Microsoft Clarity project ID; empty until project is created */
  CLARITY_PROJECT_ID: string;
  /** OpenAI Apps domain-verification challenge token (plain text at well-known URL) */
  OPENAI_APPS_CHALLENGE_TOKEN?: string;
}
