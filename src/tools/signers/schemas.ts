import { z } from 'zod';

import { AuthMode } from '../../types/zapsign.js';
import { PathTokenSchema } from '../path-token-schema.js';

export const AddSignerBaseSchema = z.object({
  doc_token: PathTokenSchema.describe('Token of the document to add the signer to'),
  name: z.string().min(1).describe('Full name of the signer'),
  email: z.string().email().optional().describe('Signer email address for notifications'),
  phone_country: z.string().regex(/^\d{1,4}$/).optional().describe('Phone country code without + prefix (e.g. 55 for Brazil)'),
  phone_number: z.string().regex(/^\d{6,15}$/).optional().describe('Phone number with area code, without country code (e.g. 11999887766)'),
  send_automatic_email: z.boolean().optional().describe('If true, ZapSign sends the signing link via email automatically'),
  send_automatic_whatsapp: z.boolean().optional().describe('If true, ZapSign sends the signing link via WhatsApp automatically'),
  custom_message: z.string().optional().describe('Custom message included in the email/WhatsApp notification sent to the signer'),
  auth_mode: z.nativeEnum(AuthMode).optional().describe('Signer authentication method: assinaturaTela (draw signature on screen), tokenEmail (email OTP code), assinaturaTela-tokenEmail (screen signature and email OTP), tokenSms (SMS OTP code), assinaturaTela-tokenSms (screen signature and SMS OTP), tokenWhatsapp (WhatsApp OTP code), assinaturaTela-tokenWhatsapp (screen signature and WhatsApp OTP)'),
  order_group: z.number().int().optional().describe('Signing order group number (only used when signature_order_active is true on the document)'),
  lock_name: z.boolean().optional().describe('If true, the signer cannot change their name'),
  lock_email: z.boolean().optional().describe('If true, the signer cannot change their email'),
  lock_phone: z.boolean().optional().describe('If true, the signer cannot change their phone number'),
  redirect_link: z.string().url().optional().describe('URL to redirect the signer to after they complete signing'),
  qualification: z.string().optional().describe('Signer role or title (e.g. Contractor, Witness, Legal Representative)'),
  external_id: z.string().optional().describe('Your external reference ID for this signer'),
}).strict();

export const AddSignerInputSchema = AddSignerBaseSchema.superRefine(
  (signer, context) => {
    if (signer.send_automatic_email && !signer.email) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'email is required when send_automatic_email is true',
      });
    }

    if (signer.send_automatic_whatsapp && (!signer.phone_country || !signer.phone_number)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone_number'],
        message: 'phone_country and phone_number are required when send_automatic_whatsapp is true',
      });
    }
  },
);

export const GetSignerInputSchema = z.object({
  signer_token: PathTokenSchema.describe('Unique token identifying the signer (returned when signer is created)'),
}).strict();

export const UpdateSignerBaseSchema = z.object({
  signer_token: PathTokenSchema.describe('Unique token identifying the signer to update'),
  name: z.string().min(1).optional().describe('New name for the signer'),
  email: z.string().email().optional().describe('New email address for the signer'),
  phone_country: z.string().regex(/^\d{1,4}$/).optional().describe('New phone country code without + prefix (e.g. 55 for Brazil)'),
  phone_number: z.string().regex(/^\d{6,15}$/).optional().describe('New phone number with area code, without country code'),
}).strict();

export const UpdateSignerInputSchema = UpdateSignerBaseSchema.refine(
  ({ signer_token: _signerToken, ...updateData }) => Object.keys(updateData).length > 0,
  { message: 'Provide at least one signer field to update' },
);

export const DeleteSignerInputSchema = z.object({
  signer_token: PathTokenSchema.describe('Unique token identifying the signer to delete'),
}).strict();
