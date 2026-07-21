import type {
  TokenExchangeCallbackOptions,
  TokenExchangeCallbackResult,
} from '@cloudflare/workers-oauth-provider';

const ACCESS_TOKEN_TTL = 3600;

/** Passthrough token exchange — static API token never expires. */
export async function handleTokenExchange(
  _options: TokenExchangeCallbackOptions,
): Promise<TokenExchangeCallbackResult> {
  return { accessTokenTTL: ACCESS_TOKEN_TTL };
}
