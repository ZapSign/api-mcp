import { describe, expect, it } from 'vitest';

import {
  CreatePartnerAccountInputSchema,
  UpdatePartnerPaymentStatusInputSchema,
} from '../../../src/tools/partner/schemas.js';

describe('marketplace privacy minimization', () => {
  it('should reject government identifiers from partner provisioning', () => {
    const result = CreatePartnerAccountInputSchema.safeParse({
      name: 'ACME',
      email: 'ops@example.com',
      cpf: '12345678900',
      cnpj: '12345678000199',
    });

    expect(result.success).toBe(false);
  });

  it('should reject unbounded payment details from payment updates', () => {
    const result = UpdatePartnerPaymentStatusInputSchema.safeParse({
      partner_token: 'partner-token',
      payment_status: 'paid',
      payment_method: 'credit_card',
      transaction_id: 'card-number-or-processor-data',
      notes: 'card details',
    });

    expect(result.success).toBe(false);
  });
});
