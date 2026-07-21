import { describe, it, expect } from 'vitest';
import { GrantType } from '@cloudflare/workers-oauth-provider';
import type { TokenExchangeCallbackOptions } from '@cloudflare/workers-oauth-provider';
import { handleTokenExchange } from '../../../src/auth/token-exchange.js';
import { MOCK_AUTH_PROPS } from '../../mocks/zapsign-responses.js';

function makeOptions(overrides: Partial<TokenExchangeCallbackOptions>): TokenExchangeCallbackOptions {
  return {
    grantType: GrantType.AUTHORIZATION_CODE,
    props: { ...MOCK_AUTH_PROPS },
    ...overrides,
  } as TokenExchangeCallbackOptions;
}

describe('handleTokenExchange — passthrough', () => {
  it('should return accessTokenTTL for authorization_code grant', async () => {
    const options = makeOptions({ grantType: GrantType.AUTHORIZATION_CODE });

    const result = await handleTokenExchange(options);

    expect(result.accessTokenTTL).toBe(3600);
  });

  it('should return accessTokenTTL for refresh_token grant', async () => {
    const options = makeOptions({ grantType: GrantType.REFRESH_TOKEN });

    const result = await handleTokenExchange(options);

    expect(result.accessTokenTTL).toBe(3600);
  });

  it('should not include updated props', async () => {
    const options = makeOptions({ grantType: GrantType.REFRESH_TOKEN });

    const result = await handleTokenExchange(options);

    expect(result).not.toHaveProperty('accessTokenProps');
    expect(result).not.toHaveProperty('newProps');
  });
});
