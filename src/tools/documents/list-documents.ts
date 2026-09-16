import { getAuthProps } from '../../auth/get-auth-props.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZodError } from 'zod';

import { ZapSignClient } from '../../api/client.js';
import { ZapSignMcpError } from '../../errors/base.js';
import { ValidationError } from '../../errors/validation-error.js';
import type { ListDocumentsParams } from '../../types/zapsign.js';
import { log, logToolError } from '../../utils/logger.js';
import { requireScope } from '../../utils/scope.js';
import {
  filterDocumentList,
  OWNER_READ_OPTIONS,
} from '../../utils/response-filter.js';
import {
  formatToolError,
  formatToolSuccess,
  formatUnexpectedToolError,
} from '../../utils/tool-response.js';
import { ListDocumentsInputSchema } from './schemas.js';

export function registerListDocumentsTool(server: McpServer): void {
  server.registerTool(
    'list_documents',
    {
      title: 'List Documents',
      description:
        "Returns a paginated list of documents from the user's ZapSign account. Supports filtering by status (pending, signed, refused), date range, and folder path. Use the page parameter to navigate pages.",
      inputSchema: ListDocumentsInputSchema.shape,
      annotations: {
        title: 'List Documents',
        readOnlyHint: true,
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
        requireScope(props.grantedScope, 'documents:read');

        const parsed = ListDocumentsInputSchema.parse(args);
        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const result = await client.listDocuments(parsed as unknown as ListDocumentsParams);
        log('documents_listed', { page: parsed.page });

        return formatToolSuccess(
          JSON.stringify(filterDocumentList(result, OWNER_READ_OPTIONS)),
        );
      } catch (error) {
        const errorId = logToolError('list_documents', error);
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
