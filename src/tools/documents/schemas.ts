import { z } from 'zod';

import {
  AuthMode,
  DocumentStatus,
  SortOrder,
} from '../../types/zapsign.js';
import { PathTokenSchema } from '../path-token-schema.js';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function isHttpUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isPdfBase64(value: string): boolean {
  try {
    return atob(value).startsWith('%PDF-');
  } catch {
    return false;
  }
}

const HttpUrlSchema = z.string().url().refine(isHttpUrl, {
  message: 'URL must use http or https',
});

const PdfBase64Schema = z
  .string()
  .min(1)
  .refine((value) => BASE64_PATTERN.test(value), {
    message: 'base64_pdf must contain valid base64 without a data URL prefix',
  })
  .refine(isPdfBase64, {
    message: 'base64_pdf must decode to a PDF document',
  });

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

const DateOnlySchema = z
  .string()
  .refine(isValidDateOnly, 'Date must use the YYYY-MM-DD format');

// ---------------------------------------------------------------------------
// Inline signer schema (used by CreateDocumentBaseSchema)
// ---------------------------------------------------------------------------

export const CreateSignerInputSchema = z.object({
  name: z.string().min(1).describe('Full name of the signer'),
  email: z.string().email().optional().describe('Signer email address for notifications'),
  phone_country: z.string().regex(/^\d{1,4}$/).optional().describe('Phone country code without + prefix (e.g. 55 for Brazil)'),
  phone_number: z.string().regex(/^\d{6,15}$/).optional().describe('Phone number with area code, without country code (e.g. 11999887766)'),
  send_automatic_email: z.boolean().optional().describe('If true, ZapSign sends the signing link via email automatically'),
  send_automatic_whatsapp: z.boolean().optional().describe('If true, ZapSign sends the signing link via WhatsApp automatically'),
  custom_message: z.string().optional().describe('Custom message included in the email/WhatsApp notification sent to the signer'),
  auth_mode: z
    .nativeEnum(AuthMode)
    .optional()
    .describe('Signer authentication method: assinaturaTela (draw signature on screen), tokenEmail (email OTP code), assinaturaTela-tokenEmail (screen signature and email OTP), tokenSms (SMS OTP code), assinaturaTela-tokenSms (screen signature and SMS OTP), tokenWhatsapp (WhatsApp OTP code), assinaturaTela-tokenWhatsapp (screen signature and WhatsApp OTP)'),
  order_group: z.number().int().optional().describe('Signing order group number (only used when signature_order_active is true on the document)'),
  lock_name: z.boolean().optional().describe('If true, the signer cannot change their name'),
  lock_email: z.boolean().optional().describe('If true, the signer cannot change their email'),
  lock_phone: z.boolean().optional().describe('If true, the signer cannot change their phone number'),
  redirect_link: z.string().url().optional().describe('URL to redirect the signer to after they complete signing'),
  qualification: z.string().optional().describe('Signer role or title (e.g. Contractor, Witness, Legal Representative)'),
  external_id: z.string().optional().describe('Your external reference ID for this signer'),
}).strict();

// ---------------------------------------------------------------------------
// Document tool input schemas
// ---------------------------------------------------------------------------

export const ListDocumentsInputSchema = z.object({
  page: z.number().int().min(1).default(1).optional().describe('Page number for paginated results (starts at 1)'),
  status: z
    .enum(Object.values(DocumentStatus) as [string, ...string[]])
    .optional()
    .describe('Filter by document status: pending, signed, or refused'),
  folder_path: z.string().optional().describe('Filter by folder path in ZapSign dashboard'),
  created_from: DateOnlySchema.optional().describe('Filter documents created after this date (ISO format YYYY-MM-DD)'),
  created_to: DateOnlySchema.optional().describe('Filter documents created before this date (ISO format YYYY-MM-DD)'),
  sort_order: z
    .enum(Object.values(SortOrder) as [string, ...string[]])
    .optional()
    .describe('Sort order: asc (oldest first) or desc (newest first)'),
}).strict();

export const GetDocumentInputSchema = z.object({
  doc_token: PathTokenSchema.describe('Unique token identifying the document (returned when document is created)'),
}).strict();

export const CreateDocumentBaseSchema = z.object({
  name: z.string().min(1).describe('Document name displayed in the ZapSign dashboard'),
  url_pdf: HttpUrlSchema.optional().describe('Public HTTP(S) URL to a PDF file (provide exactly one of url_pdf, url_docx, or base64_pdf)'),
  url_docx: HttpUrlSchema.optional().describe('Public HTTP(S) URL to a DOCX file (provide exactly one of url_pdf, url_docx, or base64_pdf)'),
  base64_pdf: PdfBase64Schema.optional().describe('Base64-encoded PDF content beginning with the PDF signature (provide exactly one of url_pdf, url_docx, or base64_pdf)'),
  signers: z.array(CreateSignerInputSchema).min(1).describe('Array of signers who must sign this document (at least one required)'),
  lang: z.string().optional().describe('Document language code: pt-BR, en, or es'),
  signature_order_active: z.boolean().optional().describe('If true, signers must sign in the order specified by each signer order_group field'),
  folder_path: z.string().optional().describe('Folder path in ZapSign dashboard (e.g. /contracts/2026)'),
  external_id: z.string().optional().describe('Your external reference ID for this document'),
  async: z.boolean().optional().describe('If true, create the document via the async ZapSign endpoint'),
}).strict();

export const CreateDocumentInputSchema = CreateDocumentBaseSchema.superRefine(
  (document, context) => {
    const sources = [document.url_pdf, document.url_docx, document.base64_pdf].filter(
      (value) => value !== undefined,
    );
    if (sources.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one of url_pdf, url_docx, or base64_pdf',
      });
    }

    if (sources.length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide only one of url_pdf, url_docx, or base64_pdf',
      });
    }

    document.signers.forEach((signer, index) => {
      if (signer.send_automatic_email && !signer.email) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['signers', index, 'email'],
          message: 'email is required when send_automatic_email is true',
        });
      }

      if (signer.send_automatic_whatsapp && (!signer.phone_country || !signer.phone_number)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['signers', index, 'phone_number'],
          message: 'phone_country and phone_number are required when send_automatic_whatsapp is true',
        });
      }
    });
  },
);

export const UpdateDocumentExtraDocSchema = z.object({
  token: z.string().min(1).describe('Token of an existing extra document'),
  name: z.string().min(1).describe('New name for the extra document'),
}).strict();

export const UpdateDocumentBaseSchema = z.object({
  doc_token: PathTokenSchema.describe('Unique token identifying the document to update'),
  name: z.string().optional().describe('New document name'),
  folder_path: z.string().optional().describe('New folder path in ZapSign dashboard'),
  folder_token: z.string().min(1).optional().describe('Folder token, which takes precedence over folder_path when both are provided'),
  date_limit_to_sign: DateOnlySchema.optional().describe('New signing deadline in YYYY-MM-DD format'),
  extra_docs: z.array(UpdateDocumentExtraDocSchema).min(1).optional().describe('Existing extra documents to rename by token'),
}).strict();

export const UpdateDocumentInputSchema = UpdateDocumentBaseSchema.refine(
  ({ doc_token: _docToken, ...updateData }) => Object.keys(updateData).length > 0,
  { message: 'Provide at least one document field to update' },
);

export const DeleteDocumentInputSchema = z.object({
  doc_token: PathTokenSchema.describe('Unique token identifying the document to delete'),
}).strict();
