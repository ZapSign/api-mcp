import { describe, expect, it, vi } from 'vitest';

import { log } from '../../../src/utils/logger.js';

describe('ID OAuth logging', () => {
  it('should not emit verifier, state, or code in structured logs', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    log('id_oauth_debug', {
      verifier: 'secret-verifier',
      state: 'secret-state',
      code: 'secret-code',
      userId: 'user-a',
    });

    const payload = JSON.parse(String(spy.mock.calls[0][0]));
    expect(payload.verifier).toBeUndefined();
    expect(payload.state).toBeUndefined();
    expect(payload.code).toBeUndefined();
    expect(payload.userId).toBe('user-a');
    spy.mockRestore();
  });
});
