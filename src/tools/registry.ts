import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerListDocumentsTool } from "./documents/list-documents.js";
import { registerGetDocumentTool } from "./documents/get-document.js";
import { registerCreateDocumentTool } from "./documents/create-document.js";
import { registerUpdateDocumentTool } from "./documents/update-document.js";
import { registerDeleteDocumentTool } from "./documents/delete-document.js";
import { registerPlaceSignaturesTool } from "./documents/place-signatures.js";
import { registerAddExtraDocumentTool } from "./documents/add-extra-document.js";
import { registerAddExtraDocumentFromTemplateTool } from "./documents/add-extra-document-from-template.js";
import { registerAddTimestampTool } from "./documents/add-timestamp.js";
import { registerReorderEnvelopeDocumentsTool } from "./documents/reorder-envelope-documents.js";

import { registerAddSignerTool } from "./signers/add-signer.js";
import { registerGetSignerTool } from "./signers/get-signer.js";
import { registerUpdateSignerTool } from "./signers/update-signer.js";
import { registerDeleteSignerTool } from "./signers/delete-signer.js";
import { registerSignInBatchTool } from "./signers/sign-in-batch.js";

import { registerListTemplatesTool } from "./templates/list-templates.js";
import { registerGetTemplateTool } from "./templates/get-template.js";
import { registerCreateFromTemplateTool } from "./templates/create-from-template.js";

import { registerCreateWebhookTool } from "./webhooks/create-webhook.js";
import { registerDeleteWebhookTool } from "./webhooks/delete-webhook.js";
import { registerCreateWebhookHeaderTool } from "./webhooks/create-webhook-header.js";
import { registerDeleteWebhookHeaderTool } from "./webhooks/delete-webhook-header.js";
import { registerReprocessDocumentsWebhooksTool } from "./webhooks/reprocess-documents-webhooks.js";

import { registerCreatePartnerAccountTool } from "./partner/create-partner-account.js";
import { registerUpdatePartnerPaymentStatusTool } from "./partner/update-partner-payment-status.js";

export function registerAllTools(server: McpServer): void {
  registerListDocumentsTool(server);
  registerGetDocumentTool(server);
  registerCreateDocumentTool(server);
  registerUpdateDocumentTool(server);
  registerDeleteDocumentTool(server);
  registerPlaceSignaturesTool(server);
  registerAddExtraDocumentTool(server);
  registerAddExtraDocumentFromTemplateTool(server);
  registerAddTimestampTool(server);
  registerReorderEnvelopeDocumentsTool(server);

  registerAddSignerTool(server);
  registerGetSignerTool(server);
  registerUpdateSignerTool(server);
  registerDeleteSignerTool(server);
  registerSignInBatchTool(server);

  registerListTemplatesTool(server);
  registerGetTemplateTool(server);
  registerCreateFromTemplateTool(server);

  registerCreateWebhookTool(server);
  registerDeleteWebhookTool(server);
  registerCreateWebhookHeaderTool(server);
  registerDeleteWebhookHeaderTool(server);
  registerReprocessDocumentsWebhooksTool(server);

  registerCreatePartnerAccountTool(server);
  registerUpdatePartnerPaymentStatusTool(server);
}
