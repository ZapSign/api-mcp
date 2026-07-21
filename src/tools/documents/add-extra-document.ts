import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { AddExtraDocumentInputSchema } from './extended-schemas.js';

export function registerAddExtraDocumentTool(server: McpServer): void {
  server.registerTool(
    'add_extra_document',
    {
      title: 'Add Extra Document',
      description:
        'Uploads an extra PDF attachment to an existing document. Use when a signing package needs supporting files beyond the main PDF.',
      inputSchema: AddExtraDocumentInputSchema.shape,
      annotations: {
        title: 'Add Extra Document',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'add_extra_document',
        requiredScopes: ['documents:write'],
        args,
        schema: AddExtraDocumentInputSchema,
        logEvent: 'extra_document_added',
        execute: (client, parsed) => client.addExtraDocument(parsed),
      }),
  );
}
