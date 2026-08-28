import { describe, expect, it } from 'vitest';

import { IdKvPrefix } from '../../../src/id/constants.js';
import { consumeOAuthState, generateOAuthState, storeOAuthState } from '../../../src/id/oauth-state.js';
import { createMockKv } from './test-helpers.js';

describe('ID OAuth state', () => {
  it('should consume state exactly once', async () => {
    const kv = createMockKv();
    const state = generateOAuthState();
    await storeOAuthState(kv, state, {
      verifier: 'verifier-123',
      oauthReqInfo: { clientId: 'client' } as never,
      createdAt: Date.now(),
    });

    const first = await consumeOAuthState(kv, state);
    const second = await consumeOAuthState(kv, state);

    expect(first?.verifier).toBe('verifier-123');
    expect(second).toBeNull();
    expect(kv.delete).toHaveBeenCalledWith(`${IdKvPrefix.OAuthState}${state}`);
  });
});
