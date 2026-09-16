import { getAuthProps } from '../../auth/get-auth-props.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZodError } from 'zod';

import { ZapSignClient } from '../../api/client.js';
import { ZapSignMcpError } from '../../errors/base.js';
import { ValidationError } from '../../errors/validation-error.js';
import type { CreateFromTemplateRequest } from '../../types/zapsign.js';
import { log, logError, logToolError } from '../../utils/logger.js';
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
import { CreateFromTemplateInputSchema } from './schemas.js';

const UNKNOWN_ERROR_CLASS = 'unknown_error';

function getRenameFailureLogData(error: unknown): {
  error_class: string;
  status_code?: number;
} {
  if (error instanceof ZapSignMcpError) {
    return { error_class: error.name, status_code: error.statusCode };
  }

  if (error instanceof Error) {
    return { error_class: error.name };
  }

  return { error_class: UNKNOWN_ERROR_CLASS };
}

async function updateCreatedDocumentName(
  client: ZapSignClient,
  token: string,
  name: string,
) {
  try {
    return await client.updateDocument(token, { name });
  } catch (error) {
    logError('document_from_template_name_failed', getRenameFailureLogData(error));
    return undefined;
  }
}

export function registerCreateFromTemplateTool(server: McpServer): void {
  server.registerTool(
    'create_from_template',
    {
      title: 'Create Document from Template',
      description:
        'Creates a new document from a DOCX template by filling dynamic field values. Requires template_token from list_templates results[].token, signer_name, and a data object mapping the exact braced strings from get_template inputs[].variable to values (for example, {{nome_completo}}). Set async=true for the async template endpoint. Optionally provide name to rename the document after it is created. For automatic email or WhatsApp, include the signer contact value in the template data and set the corresponding send_automatic_* flag to true.',
      inputSchema: CreateFromTemplateInputSchema.shape,
      annotations: {
        title: 'Create Document from Template',
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
        requireScope(props.grantedScope, 'templates:write');
        const parsed = CreateFromTemplateInputSchema.parse(args);
        const { name, ...createData } = parsed;
        if (name) {
          requireScope(props.grantedScope, 'documents:write');
        }

        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const result = await client.createFromTemplate(
          createData as unknown as CreateFromTemplateRequest,
        );
        log('document_from_template_created');
        if (!name) {
          return formatToolSuccess(
            JSON.stringify(filterDocument(result, OWNER_CREATE_OPTIONS)),
          );
        }

        const updatedDocument = await updateCreatedDocumentName(client, result.token, name);
        if (updatedDocument) {
          return formatToolSuccess(
            JSON.stringify(filterDocument(updatedDocument, OWNER_CREATE_OPTIONS)),
          );
        }

        return formatToolError(
          `Document created with token ${result.token}, but setting its name failed. Retry update_document with this token.`,
        );
      } catch (error) {
        const errorId = logToolError('create_from_template', error);
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
