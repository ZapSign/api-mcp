import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { UpdatePartnerPaymentStatusInputSchema } from './schemas.js';

export function registerUpdatePartnerPaymentStatusTool(server: McpServer): void {
  server.registerTool(
    'update_partner_payment_status',
    {
      title: 'Update Partner Payment Status',
      description:
        'Updates a partner account payment status using a method category. Never provide card numbers, payment credentials, processor IDs, or free-form payment notes.',
      inputSchema: UpdatePartnerPaymentStatusInputSchema.shape,
      annotations: {
        title: 'Update Partner Payment Status',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'update_partner_payment_status',
        requiredScopes: ['partner:write'],
        args,
        schema: UpdatePartnerPaymentStatusInputSchema,
        logEvent: 'partner_payment_updated',
        execute: (client, parsed) => client.updatePartnerPaymentStatus(parsed),
      }),
  );
}