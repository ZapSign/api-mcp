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
import { GetTemplateInputSchema } from './schemas.js';

export function registerGetTemplateTool(server: McpServer): void {
  server.registerTool(
    'get_template',
    {
      title: 'Get Template',
      description:
        'Retrieves a template definition including dynamic fields (inputs) and their configuration. Use this to discover which variables need to be filled when creating a document; participant contact and internal identifier fields are omitted.',
      inputSchema: GetTemplateInputSchema.shape,
      annotations: {
        title: 'Get Template',
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
        requireScope(props.grantedScope, 'templates:read');

        const parsed = GetTemplateInputSchema.parse(args);
        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const result = await client.getTemplate(parsed.template_token);
        log('template_retrieved');

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('get_template', error);
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
