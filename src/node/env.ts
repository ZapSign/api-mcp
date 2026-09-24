/**
 * Node runtime environment — replaces the Workers Env binding.
 *
 * All fields map 1-to-1 with the Workers Env so existing handler code
 * (oauth-handler.ts, id/auth-handler.ts, etc.) compiles unchanged.
 */
import type { KvStore } from '../store/kv-store.js';
import type { OAuthHelpers } from './oauth/types.js';

export interface NodeEnv {
  /** KvStore backed by DynamoDB (or InMemoryKvStore in tests). */
  readonly OAUTH_KV: KvStore;
  /** ZapSign API base URL (e.g. https://api.zapsign.com.br). */
  readonly ZAPSIGN_API_URL: string;
  /** HMAC key for CSRF tokens and form signatures. */
  readonly COOKIE_ENCRYPTION_KEY: string;
  /** "production" | "sandbox" etc. */
  readonly ENVIRONMENT: string;
  /** OAuthHelpers injected by the provider at request time. */
  readonly OAUTH_PROVIDER: OAuthHelpers;
  /** GA4 measurement ID (may be empty). */
  readonly GA4_MEASUREMENT_ID: string;
  /** Clarity project ID (may be empty). */
  readonly CLARITY_PROJECT_ID: string;
  /** OpenAI domain-verification token (may be absent). */
  readonly OPENAI_APPS_CHALLENGE_TOKEN?: string;
  /** AES-256-GCM key (base64) for ZapSign ID token encryption. */
  readonly ID_TOKEN_ENCRYPTION_KEY: string;
}

/** Builds a NodeEnv from process.env, throwing on missing required vars. */
export function buildNodeEnvFromProcess(oauthHelpers: OAuthHelpers, kv: KvStore): NodeEnv {
  function require(name: string): string {
    const v = process.env[name];
    if (!v) {
      throw new Error(`Missing required env var: ${name}`);
    }
    return v;
  }

  function optional(name: string, fallback = ''): string {
    return process.env[name] ?? fallback;
  }

  return {
    OAUTH_KV: kv,
    ZAPSIGN_API_URL: optional('ZAPSIGN_API_URL', 'https://api.zapsign.com.br'),
    COOKIE_ENCRYPTION_KEY: require('COOKIE_ENCRYPTION_KEY'),
    ENVIRONMENT: optional('ENVIRONMENT', 'production'),
    OAUTH_PROVIDER: oauthHelpers,
    GA4_MEASUREMENT_ID: optional('GA4_MEASUREMENT_ID'),
    CLARITY_PROJECT_ID: optional('CLARITY_PROJECT_ID'),
    OPENAI_APPS_CHALLENGE_TOKEN: optional('OPENAI_APPS_CHALLENGE_TOKEN') || undefined,
    ID_TOKEN_ENCRYPTION_KEY: require('ID_TOKEN_ENCRYPTION_KEY'),
  };
}
