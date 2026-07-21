import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { DeleteWebhookInputSchema } from './schemas.js';

export function registerDeleteWebhookTool(server: McpServer): void {
  server.registerTool(
    'delete_webhook',
    {
      title: 'Delete Webhook',
      description:
        'Deletes a company webhook by numeric ID. This stops future event deliveries to that webhook URL.',
      inputSchema: DeleteWebhookInputSchema.shape,
      annotations: {
        title: 'Delete Webhook',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'delete_webhook',
        requiredScopes: ['webhooks:write'],
        args,
        schema: DeleteWebhookInputSchema,
        logEvent: 'webhook_deleted',
        execute: (client, parsed) => client.deleteWebhook(parsed.webhook_id),
      }),
  );
}
