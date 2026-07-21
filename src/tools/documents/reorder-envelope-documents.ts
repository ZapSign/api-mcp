import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { ReorderEnvelopeDocumentsInputSchema } from './extended-schemas.js';

export function registerReorderEnvelopeDocumentsTool(server: McpServer): void {
  server.registerTool(
    'reorder_envelope_documents',
    {
      title: 'Reorder Envelope Documents',
      description:
        'Changes the display order of documents inside an envelope. Pass documents_order as document tokens in the desired sequence.',
      inputSchema: ReorderEnvelopeDocumentsInputSchema.shape,
      annotations: {
        title: 'Reorder Envelope Documents',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'reorder_envelope_documents',
        requiredScopes: ['documents:write'],
        args,
        schema: ReorderEnvelopeDocumentsInputSchema,
        logEvent: 'envelope_docs_reordered',
        execute: (client, parsed) => client.reorderEnvelopeDocuments(parsed),
      }),
  );
}
