import { describe, expect, it } from 'vitest';

import { PRIVACY_POLICY_MARKDOWN } from '../../../src/docs/privacy-policy-markdown.js';

describe('marketplace privacy policy', () => {
  it('should disclose pass-through business data and excluded restricted data', () => {
    expect(PRIVACY_POLICY_MARKDOWN).toContain('document names and statuses');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('signer names and contact details');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('does **not** request or return CPF');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('payment-card data');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('biometric data');
  });
});
