import { z } from 'zod';

import { PathTokenSchema } from '../path-token-schema.js';

export const ListTemplatesInputSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(1)
    .describe("Page number for paginated results (starts at 1)"),
}).strict();

export const GetTemplateInputSchema = z.object({
  template_token: PathTokenSchema.describe(
    'Template token from list_templates results[].token identifying the template to retrieve',
  ),
}).strict();

export const CreateFromTemplateInputSchema = z.object({
  template_token: PathTokenSchema.describe(
    'Template token from list_templates results[].token. It is mapped to ZapSign template_id when creating the document',
  ),
  signer_name: z
    .string()
    .min(1, "Signer name is required")
    .describe("Full name of the signer for the generated document"),
  data: z
    .record(z.string(), z.string())
    .describe(
      "Key-value map of template values. Call get_template first and use the exact braced strings returned in inputs[].variable as keys (for example, {{nome_completo}})",
    ),
  send_automatic_email: z.boolean().optional()
    .describe('If true, ZapSign sends the signing link via email automatically'),
  send_automatic_whatsapp: z.boolean().optional()
    .describe('If true, ZapSign sends the signing link via WhatsApp automatically'),
  name: z
    .string()
    .trim()
    .min(1, 'Document name cannot be empty')
    .max(255, 'Document name must not exceed 255 characters')
    .optional()
    .describe('Optional name to apply to the generated document'),
  async: z
    .boolean()
    .optional()
    .describe('If true, create the document via the async template endpoint'),
}).strict();
