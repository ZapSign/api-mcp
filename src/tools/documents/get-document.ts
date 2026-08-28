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
import { GetDocumentInputSchema } from './schemas.js';

export function registerGetDocumentTool(server: McpServer): void {
  server.registerTool(
    'get_document',
    {
      title: 'Get Document',
      description:
        'Retrieves workflow details of a single document by doc_token, including signer names and signing status. File URLs in the response expire after 60 minutes; unnecessary contact and internal identifier fields are omitted.',
      inputSchema: GetDocumentInputSchema.shape,
      annotations: {
        title: 'Get Document',
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

        const parsed = GetDocumentInputSchema.parse(args);
        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const result = await client.getDocument(parsed.doc_token);
        log('document_retrieved');

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('get_document', error);
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
