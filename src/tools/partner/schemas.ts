import { z } from 'zod';

import { PathTokenSchema } from '../path-token-schema.js';

export const CreatePartnerAccountInputSchema = z.object({
  name: z.string().min(1).describe('Partner full name'),
  email: z.string().email().describe('Partner email address'),
  phone: z.string().optional().describe('Partner phone in Brazilian format'),
  cpf: z.string().optional().describe('Partner CPF'),
  cnpj: z.string().optional().describe('Partner CNPJ'),
  company_name: z.string().optional().describe('Company name when applicable'),
  external_id: z.string().optional().describe('External partner identifier'),
}).strict();

export const UpdatePartnerPaymentStatusInputSchema = z.object({
  partner_token: PathTokenSchema.describe('Partner account token'),
  payment_status: z
    .enum(['paid', 'pending', 'failed', 'cancelled'])
    .describe('New payment status'),
  payment_method: z.string().min(1).describe('Payment method used'),
  transaction_id: z.string().optional().describe('Payment processor transaction ID'),
  notes: z.string().optional().describe('Optional payment notes'),
}).strict();