import { getAuthProps } from '../../auth/get-auth-props.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZodError } from 'zod';

import { ZapSignClient } from '../../api/client.js';
import { ZapSignMcpError } from '../../errors/base.js';
import { ValidationError } from '../../errors/validation-error.js';
import type { CreateDocumentRequest } from '../../types/zapsign.js';
import { log, logToolError } from '../../utils/logger.js';
import { requireScope } from '../../utils/scope.js';
import {
  filterDocument,
  OWNER_CREATE_OPTIONS,
} from '../../utils/response-filter.js';
import {
  formatToolError,
  formatToolSuccess,
  formatUnexpectedToolError,
} from '../../utils/tool-response.js';
import { CreateDocumentBaseSchema, CreateDocumentInputSchema } from './schemas.js';

export function registerCreateDocumentTool(server: McpServer): void {
  server.registerTool(
    'create_document',
    {
      title: 'Create Document',
      description:
        'Creates a new document for electronic signature from exactly one of url_pdf, url_docx, or base64_pdf, with at least one signer. Set async=true for the async create endpoint. If automatic email is enabled, provide the signer email; if automatic WhatsApp is enabled, provide phone_country and phone_number. Returns the document token and signing links. To use dynamic fields, call create_from_template instead.',
      inputSchema: CreateDocumentBaseSchema.shape,
      annotations: {
        title: 'Create Document',
        readOnlyHint: false,
        destructiveHint: false,
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

        const parsed = CreateDocumentInputSchema.parse(args);

        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const result = await client.createDocument(parsed as unknown as CreateDocumentRequest);
        log('document_created');

        return formatToolSuccess(
          JSON.stringify(filterDocument(result, OWNER_CREATE_OPTIONS)),
        );
      } catch (error) {
        const errorId = logToolError('create_document', error);
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
