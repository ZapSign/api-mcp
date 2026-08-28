import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { CreatePartnerAccountInputSchema } from './schemas.js';

export function registerCreatePartnerAccountTool(server: McpServer): void {
  server.registerTool(
    'create_partner_account',
    {
      title: 'Create Partner Account',
      description:
        'Creates a ZapSign partner account using name and contact details. Use only with partner-management privileges; never send government identifiers or payment credentials.',
      inputSchema: CreatePartnerAccountInputSchema.shape,
      annotations: {
        title: 'Create Partner Account',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'create_partner_account',
        requiredScopes: ['partner:write'],
        args,
        schema: CreatePartnerAccountInputSchema,
        logEvent: 'partner_account_created',
        execute: (client, parsed) => client.createPartnerAccount(parsed),
      }),
  );
}
