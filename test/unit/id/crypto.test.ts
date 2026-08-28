import { describe, expect, it } from 'vitest';

import { decryptSecret, encryptSecret } from '../../../src/id/crypto.js';
import { TEST_ENCRYPTION_KEY } from './test-helpers.js';

describe('ID token crypto', () => {
  it('should round-trip encrypted token payloads', async () => {
    const payload = JSON.stringify({ accessToken: 'abc', refreshToken: 'def' });
    const encrypted = await encryptSecret(payload, TEST_ENCRYPTION_KEY);
    const decrypted = await decryptSecret(encrypted, TEST_ENCRYPTION_KEY);
    expect(decrypted).toBe(payload);
  });
});
