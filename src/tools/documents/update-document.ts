import { getAuthProps } from '../../auth/get-auth-props.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZodError } from 'zod';

import { ZapSignClient } from '../../api/client.js';
import { ZapSignMcpError } from '../../errors/base.js';
import { ValidationError } from '../../errors/validation-error.js';
import { log, logToolError } from '../../utils/logger.js';
import { requireScope } from '../../utils/scope.js';
import {
  formatToolError,
  formatToolSuccess,
  formatUnexpectedToolError,
} from '../../utils/tool-response.js';
import {
  UpdateDocumentBaseSchema,
  UpdateDocumentInputSchema,
} from './schemas.js';

export function registerUpdateDocumentTool(server: McpServer): void {
  server.registerTool(
    'update_document',
    {
      title: 'Update Document',
      description:
        'Updates an in-progress document by doc_token: its name, signing deadline, folder, or existing extra-document names. If both folder_token and folder_path are supplied, folder_token takes precedence. Does not modify signers — use add_signer or update_signer for signer changes.',
      inputSchema: UpdateDocumentBaseSchema.shape,
      annotations: {
        title: 'Update Document',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      try {
        const props = getAuthProps();
        if (!props) {
          return formatToolError('Authentication required. Reconnect the ZapSign integration or set ZAPSIGN_API_KEY for local STDIO.');
        }
        requireScope(props.grantedScope, 'documents:write');

        const parsed = UpdateDocumentInputSchema.parse(args);
        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const { doc_token, ...updateData } = parsed;
        const result = await client.updateDocument(doc_token, updateData);
        log('document_updated');

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('update_document', error);
        if (error instanceof ZodError) {
          return formatToolError(ValidationError.fromZodError(error).message);
        }
        if (error instanceof ZapSignMcpError) {
          return formatToolError(error.message);
        }
        return formatUnexpectedToolError(errorId);
      }
    },
  );
}
