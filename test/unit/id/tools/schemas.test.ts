import { describe, expect, it } from 'vitest';

import {
  CreateCpfPhoneMatchValidationInputSchema,
  CreateLivenessDocumentMatchValidationInputSchema,
  CreatePhoneOwnershipValidationInputSchema,
  CreateSimSwapValidationInputSchema,
  GetValidationInputSchema,
  ListValidationsInputSchema,
  VerifyValidationInputSchema,
} from '../../../../src/id/tools/schemas.js';

describe('ID tool schemas', () => {
  it('should accept list_validations pagination input', () => {
    const parsed = ListValidationsInputSchema.parse({ limit: 10, after: 'val_1' });
    expect(parsed.limit).toBe(10);
  });

  it('should require consent true on create inputs', () => {
    expect(() => CreateCpfPhoneMatchValidationInputSchema.parse({
      cpf: '12345678909',
      phone: '+5511999998888',
      consent: false,
    })).toThrow();
  });

  it('should accept get_validation id', () => {
    expect(GetValidationInputSchema.parse({ id: 'val_abc' }).id).toBe('val_abc');
  });

  it('should accept sim swap optional max_age_hours', () => {
    const parsed = CreateSimSwapValidationInputSchema.parse({
      phone: '+5511999998888',
      consent: true,
      max_age_hours: 24,
    });
    expect(parsed.max_age_hours).toBe(24);
  });

  it('should accept liveness redirect_url', () => {
    const parsed = CreateLivenessDocumentMatchValidationInputSchema.parse({
      consent: true,
      redirect_url: 'https://example.com/done',
    });
    expect(parsed.redirect_url).toContain('https://');
  });

  it('should accept phone ownership input', () => {
    expect(CreatePhoneOwnershipValidationInputSchema.parse({
      phone: '+5511999998888',
      consent: true,
    }).phone).toBe('+5511999998888');
  });

  it('should require numeric verify code', () => {
    expect(() => VerifyValidationInputSchema.parse({ id: 'val_1', code: 'abc' })).toThrow();
    expect(VerifyValidationInputSchema.parse({ id: 'val_1', code: '483920' }).code).toBe('483920');
  });
});
