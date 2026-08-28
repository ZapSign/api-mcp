import { describe, expect, it } from 'vitest';

import { buildPkcePair, createS256Challenge } from '../../../src/id/pkce.js';

describe('ID PKCE', () => {
  it('should generate verifier and S256 challenge pairs', async () => {
    const pair = await buildPkcePair();
    expect(pair.verifier.length).toBeGreaterThanOrEqual(43);
    expect(pair.verifier.length).toBeLessThanOrEqual(128);
    expect(pair.challenge).toBe(await createS256Challenge(pair.verifier));
  });
});
