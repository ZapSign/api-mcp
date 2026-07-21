import { z } from 'zod';

import { PathTokenSchema } from '../path-token-schema.js';

const HttpUrlSchema = z.string().url().refine((value) => {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}, { message: 'URL must use http or https' });

export const PlaceSignaturesInputSchema = z.object({
  doc_token: PathTokenSchema.describe('Document token to place signatures on'),
  rubricas: z
    .array(z.record(z.string(), z.unknown()))
    .min(1)
    .describe('Signature placement definitions (rubricas) for the document'),
}).strict();

export const AddExtraDocumentInputSchema = z.object({
  doc_token: PathTokenSchema.describe('Parent document token'),
  name: z.string().min(1).describe('Name of the extra document'),
  url_pdf: HttpUrlSchema.describe('Public HTTP(S) URL of the PDF extra document'),
}).strict();

export const AddExtraDocumentFromTemplateInputSchema = z.object({
  doc_token: PathTokenSchema.describe('Parent document token receiving the extra document'),
  template_id: PathTokenSchema.describe('Template token used to generate the extra document'),
  data: z
    .array(
      z.object({
        de: z.string().min(1).describe('Template field key'),
        para: z.string().describe('Value to fill in the template field'),
      }).strict(),
    )
    .min(1)
    .describe('Template field values as de/para pairs'),
}).strict();

export const AddTimestampInputSchema = z.object({
  url: HttpUrlSchema.describe('Public HTTP(S) URL of the document to timestamp'),
}).strict();

export const ReorderEnvelopeDocumentsInputSchema = z.object({
  envelope_token: PathTokenSchema.describe('Envelope token containing the documents'),
  documents_order: z
    .array(PathTokenSchema)
    .min(1)
    .describe('Document tokens in the desired display order'),
}).strict();
