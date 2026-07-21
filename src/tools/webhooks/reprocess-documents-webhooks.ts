import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { ReprocessDocumentsWebhooksInputSchema } from './schemas.js';

export function registerReprocessDocumentsWebhooksTool(server: McpServer): void {
  server.registerTool(
    'reprocess_documents_webhooks',
    {
      title: 'Reprocess Documents Webhooks',
      description:
        'Reprocesses webhook deliveries for a document. Use after webhook failures or when downstream systems missed events.',
      inputSchema: ReprocessDocumentsWebhooksInputSchema.shape,
      annotations: {
        title: 'Reprocess Documents Webhooks',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'reprocess_documents_webhooks',
        requiredScopes: ['webhooks:write'],
        args,
        schema: ReprocessDocumentsWebhooksInputSchema,
        logEvent: 'webhooks_reprocessed',
        execute: (client, parsed) => client.reprocessDocumentsWebhooks(parsed),
      }),
  );
}
