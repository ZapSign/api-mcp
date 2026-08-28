import { z } from 'zod';

const ExternalIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,256}$/)
  .optional();

export const IdempotencyKeySchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,256}$/)
  .optional();

export const ListValidationsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  after: z.string().optional(),
  before: z.string().optional(),
});

export const GetValidationInputSchema = z.object({
  id: z.string().min(1),
});

export const CreateCpfPhoneMatchValidationInputSchema = z.object({
  cpf: z.string().min(1),
  phone: z.string().min(1),
  consent: z.literal(true),
  external_id: ExternalIdSchema,
  idempotency_key: IdempotencyKeySchema,
});

export const CreateSimSwapValidationInputSchema = z.object({
  phone: z.string().min(1),
  consent: z.literal(true),
  max_age_hours: z.number().int().min(1).max(2400).optional(),
  external_id: ExternalIdSchema,
  idempotency_key: IdempotencyKeySchema,
});

export const CreateLivenessDocumentMatchValidationInputSchema = z.object({
  consent: z.literal(true),
  redirect_url: z.string().url().optional(),
  external_id: ExternalIdSchema,
  idempotency_key: IdempotencyKeySchema,
});

export const CreatePhoneOwnershipValidationInputSchema = z.object({
  phone: z.string().min(1),
  consent: z.literal(true),
  external_id: ExternalIdSchema,
  idempotency_key: IdempotencyKeySchema,
});

export const VerifyValidationInputSchema = z.object({
  id: z.string().min(1),
  code: z.string().regex(/^[0-9]+$/),
  idempotency_key: IdempotencyKeySchema,
});

export type ListValidationsInput = z.infer<typeof ListValidationsInputSchema>;
export type GetValidationInput = z.infer<typeof GetValidationInputSchema>;
export type CreateCpfPhoneMatchValidationInput = z.infer<typeof CreateCpfPhoneMatchValidationInputSchema>;
export type CreateSimSwapValidationInput = z.infer<typeof CreateSimSwapValidationInputSchema>;
export type CreateLivenessDocumentMatchValidationInput = z.infer<
  typeof CreateLivenessDocumentMatchValidationInputSchema
>;
export type CreatePhoneOwnershipValidationInput = z.infer<typeof CreatePhoneOwnershipValidationInputSchema>;
export type VerifyValidationInput = z.infer<typeof VerifyValidationInputSchema>;
