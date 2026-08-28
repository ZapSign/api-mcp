import { describe, expect, it } from 'vitest';

import { sanitizeToolResult } from '../../../src/utils/tool-response.js';

describe('sanitizeToolResult', () => {
  it('should remove personal and restricted fields while preserving workflow fields', () => {
    const result = sanitizeToolResult({
      token: 'doc-token',
      open_id: 42,
      name: 'Contract',
      created_by: { email: 'owner@example.com' },
      metadata: [{ key: 'customer_email', value: 'customer@example.com' }],
      signers: [
        {
          token: 'signer-token',
          name: 'Signer',
          email: 'signer@example.com',
          phone_number: '11999999999',
          cpf: '12345678900',
          geo_latitude: '-23.5',
          sign_url: 'https://example.com/sign',
          status: 'new',
        },
      ],
    });

    expect(result).toEqual({
      token: 'doc-token',
      name: 'Contract',
      signers: [
        {
          token: 'signer-token',
          name: 'Signer',
          sign_url: 'https://example.com/sign',
          status: 'new',
        },
      ],
    });
  });

  it('should remove restricted fields from nested template and payment data', () => {
    const result = sanitizeToolResult({
      template: {
        token: 'template-token',
        signers: [{ name: 'Signer', email: 'signer@example.com', phone_number: '11999999999' }],
      },
      payment_method: 'credit_card',
      transaction_id: 'processor-id',
      notes: 'card ending in 1234',
      status: 'paid',
    });

    expect(result).toEqual({
      template: {
        token: 'template-token',
        signers: [{ name: 'Signer' }],
      },
      status: 'paid',
    });
  });
});
