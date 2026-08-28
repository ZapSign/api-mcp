import { z } from 'zod';

import { PathTokenSchema } from '../path-token-schema.js';

export const CreatePartnerAccountInputSchema = z.object({
  name: z.string().min(1).describe('Partner full name'),
  email: z.string().email().describe('Partner email address'),
  phone: z.string().optional().describe('Partner phone in Brazilian format'),
  company_name: z.string().optional().describe('Company name when applicable'),
}).strict();

export const UpdatePartnerPaymentStatusInputSchema = z.object({
  partner_token: PathTokenSchema.describe('Partner account token'),
  payment_status: z
    .enum(['paid', 'pending', 'failed', 'cancelled'])
    .describe('New payment status'),
  payment_method: z
    .string()
    .min(1)
    .describe('Payment method category only; never include card numbers or payment credentials'),
}).strict();