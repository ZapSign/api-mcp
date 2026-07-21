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
import { ListTemplatesInputSchema } from './schemas.js';

export function registerListTemplatesTool(server: McpServer): void {
  server.registerTool(
    'list_templates',
    {
      title: 'List Templates',
      description:
        "Returns a paginated list of document templates from the user's ZapSign account. Use get_template to inspect a template's dynamic fields before creating a document from it.",
      inputSchema: ListTemplatesInputSchema.shape,
      annotations: {
        title: 'List Templates',
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

        const parsed = ListTemplatesInputSchema.parse(args);
        const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
        const result = await client.listTemplates({ page: parsed.page });
        log('templates_listed', { page: parsed.page });

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('list_templates', error);
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
