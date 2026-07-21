import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

export interface Env {
  OAUTH_KV: KVNamespace;
  ZAPSIGN_API_URL: string;
  COOKIE_ENCRYPTION_KEY: string;
  ENVIRONMENT: string;
  OAUTH_PROVIDER: OAuthHelpers;
}
