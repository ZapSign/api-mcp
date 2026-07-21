import { z } from 'zod';

export const WebhookHeaderSchema = z.object({
  name: z.string().min(1).describe('HTTP header name'),
  value: z.string().min(1).describe('HTTP header value'),
}).strict();

export const CreateWebhookInputSchema = z.object({
  url: z.string().url().describe('HTTPS URL that receives webhook notifications'),
  type: z.string().min(1).describe('Webhook event type configured in ZapSign'),
  headers: z
    .array(WebhookHeaderSchema)
    .optional()
    .describe('Optional custom headers sent with each webhook delivery'),
}).strict();

export const DeleteWebhookInputSchema = z.object({
  webhook_id: z.number().int().positive().describe('Numeric webhook ID to delete'),
}).strict();

export const CreateWebhookHeaderInputSchema = z.object({
  webhook_id: z.number().int().positive().describe('Numeric webhook ID receiving the headers'),
  headers: z
    .array(WebhookHeaderSchema)
    .min(1)
    .describe('Headers to attach to the webhook'),
}).strict();

export const DeleteWebhookHeaderInputSchema = z.object({
  header_id: z.number().int().positive().describe('Numeric webhook header ID to delete'),
}).strict();

export const ReprocessDocumentsWebhooksInputSchema = z.object({
  document_token: z.string().min(1).describe('Document token to reprocess'),
  webhook_tokens: z
    .array(z.string().min(1))
    .optional()
    .describe('Optional webhook tokens to reprocess'),
  reason: z.string().optional().describe('Optional reason for reprocessing'),
  force_reprocess: z
    .boolean()
    .optional()
    .describe('When true, force reprocessing even if already processed'),
}).strict();
