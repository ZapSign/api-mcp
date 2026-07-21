import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { DeleteWebhookHeaderInputSchema } from './schemas.js';

export function registerDeleteWebhookHeaderTool(server: McpServer): void {
  server.registerTool(
    'delete_webhook_header',
    {
      title: 'Delete Webhook Header',
      description:
        'Deletes a webhook header by numeric ID. Use when rotating credentials or removing obsolete headers.',
      inputSchema: DeleteWebhookHeaderInputSchema.shape,
      annotations: {
        title: 'Delete Webhook Header',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'delete_webhook_header',
        requiredScopes: ['webhooks:write'],
        args,
        schema: DeleteWebhookHeaderInputSchema,
        logEvent: 'webhook_header_deleted',
        execute: (client, parsed) => client.deleteWebhookHeader(parsed.header_id),
      }),
  );
}
