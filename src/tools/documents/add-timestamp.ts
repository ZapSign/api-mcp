import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { AddTimestampInputSchema } from './extended-schemas.js';

export function registerAddTimestampTool(server: McpServer): void {
  server.registerTool(
    'add_timestamp',
    {
      title: 'Add Timestamp',
      description:
        'Applies a cryptographic timestamp to a document available at a public URL. Use when auditability requires trusted time-stamping.',
      inputSchema: AddTimestampInputSchema.shape,
      annotations: {
        title: 'Add Timestamp',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'add_timestamp',
        requiredScopes: ['documents:write'],
        args,
        schema: AddTimestampInputSchema,
        logEvent: 'timestamp_added',
        execute: (client, parsed) => client.addTimestamp(parsed),
      }),
  );
}
