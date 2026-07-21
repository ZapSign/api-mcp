import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { AddExtraDocumentFromTemplateInputSchema } from './extended-schemas.js';

export function registerAddExtraDocumentFromTemplateTool(server: McpServer): void {
  server.registerTool(
    'add_extra_document_from_template',
    {
      title: 'Add Extra Document From Template',
      description:
        'Adds an extra document generated from a template to an existing parent document. Provide doc_token, template_id, and de/para field data.',
      inputSchema: AddExtraDocumentFromTemplateInputSchema.shape,
      annotations: {
        title: 'Add Extra Document From Template',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'add_extra_document_from_template',
        requiredScopes: ['documents:write', 'templates:write'],
        args,
        schema: AddExtraDocumentFromTemplateInputSchema,
        logEvent: 'extra_doc_from_tpl_added',
        execute: (client, parsed) => client.addExtraDocumentFromTemplate(parsed),
      }),
  );
}
