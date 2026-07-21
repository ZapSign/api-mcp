import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { CreateWebhookHeaderInputSchema } from './schemas.js';

export function registerCreateWebhookHeaderTool(server: McpServer): void {
  server.registerTool(
    'create_webhook_header',
    {
      title: 'Create Webhook Header',
      description:
        'Attaches custom HTTP headers to an existing webhook. Provide webhook_id and one or more name/value headers.',
      inputSchema: CreateWebhookHeaderInputSchema.shape,
      annotations: {
        title: 'Create Webhook Header',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'create_webhook_header',
        requiredScopes: ['webhooks:write'],
        args,
        schema: CreateWebhookHeaderInputSchema,
        logEvent: 'webhook_header_created',
        execute: (client, parsed) => client.createWebhookHeader(parsed),
      }),
  );
}
