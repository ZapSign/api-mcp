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
import { DeleteDocumentInputSchema } from './schemas.js';

export function registerDeleteDocumentTool(server: McpServer): void {
  server.registerTool(
    'delete_document',
    {
      title: 'Delete Document',
      description:
        'Removes a document from the ZapSign account by doc_token. Use this only when the document should no longer remain available for the signing workflow; ZapSign may reject removal for documents in an unsupported state.',
      inputSchema: DeleteDocumentInputSchema.shape,
      annotations: {
        title: 'Delete Document',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
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

        const parsed = DeleteDocumentInputSchema.parse(args);
        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const result = await client.deleteDocument(parsed.doc_token);
        log('document_deleted');

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('delete_document', error);
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
