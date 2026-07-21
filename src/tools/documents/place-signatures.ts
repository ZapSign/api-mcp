import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { PlaceSignaturesInputSchema } from './extended-schemas.js';

export function registerPlaceSignaturesTool(server: McpServer): void {
  server.registerTool(
    'place_signatures',
    {
      title: 'Place Signatures',
      description:
        'Places signature fields (rubricas) on an existing document. Use after create_document when signers need positioned signature boxes.',
      inputSchema: PlaceSignaturesInputSchema.shape,
      annotations: {
        title: 'Place Signatures',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'place_signatures',
        requiredScopes: ['documents:write'],
        args,
        schema: PlaceSignaturesInputSchema,
        logEvent: 'signatures_placed',
        execute: (client, parsed) => client.placeSignatures(parsed),
      }),
  );
}
