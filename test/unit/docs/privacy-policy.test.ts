import { describe, expect, it } from 'vitest';

import { PRIVACY_POLICY_MARKDOWN } from '../../../src/docs/privacy-policy-markdown.js';

describe('marketplace privacy policy', () => {
  it('should disclose allowlisted MCP fields and withheld categories', () => {
    expect(PRIVACY_POLICY_MARKDOWN).toContain('MCP response field disclosure');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('Data returned | Purpose | Source');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('response allowlist');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('answers_count');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('create_document');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('add_signer');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('create_from_template');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('We do not expose via MCP');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('CPF / CNPJ');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('Biometric photos');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('Precise geolocation');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('IP addresses');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('Digital certificates');
    expect(PRIVACY_POLICY_MARKDOWN).toContain('sign_url');
  });
});
