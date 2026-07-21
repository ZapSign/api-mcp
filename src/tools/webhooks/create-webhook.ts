import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { CreateWebhookInputSchema } from './schemas.js';

export function registerCreateWebhookTool(server: McpServer): void {
  server.registerTool(
    'create_webhook',
    {
      title: 'Create Webhook',
      description:
        'Creates a company webhook that receives ZapSign event notifications at the given URL. Optionally attach custom headers.',
      inputSchema: CreateWebhookInputSchema.shape,
      annotations: {
        title: 'Create Webhook',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'create_webhook',
        requiredScopes: ['webhooks:write'],
        args,
        schema: CreateWebhookInputSchema,
        logEvent: 'webhook_created',
        execute: (client, parsed) => client.createWebhook(parsed),
      }),
  );
}
