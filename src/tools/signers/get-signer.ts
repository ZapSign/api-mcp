import { getAuthProps } from '../../auth/get-auth-props.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZodError } from 'zod';

import { ZapSignClient } from '../../api/client.js';
import { ZapSignMcpError } from '../../errors/base.js';
import { ValidationError } from '../../errors/validation-error.js';
import { log, logToolError } from '../../utils/logger.js';
import { requireScope } from '../../utils/scope.js';
import {
  filterSigner,
  OWNER_READ_OPTIONS,
} from '../../utils/response-filter.js';
import {
  formatToolError,
  formatToolSuccess,
  formatUnexpectedToolError,
} from '../../utils/tool-response.js';
import { GetSignerInputSchema } from './schemas.js';

export function registerGetSignerTool(server: McpServer): void {
  server.registerTool(
    'get_signer',
    {
      title: 'Get Signer',
      description:
        'Retrieves workflow information about a specific signer, including signing status, authentication mode, number of views, and signing link when available. Contact and geographic fields are omitted.',
      inputSchema: GetSignerInputSchema.shape,
      annotations: {
        title: 'Get Signer',
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
        requireScope(props.grantedScope, 'signers:read');

        const parsed = GetSignerInputSchema.parse(args);
        const client = new ZapSignClient(
          props.zapSignApiUrl,
          props.zapSignApiToken,
        );

        const result = await client.getSigner(parsed.signer_token);
        log('signer_retrieved');

        return formatToolSuccess(
          JSON.stringify(filterSigner(result, OWNER_READ_OPTIONS)),
        );
      } catch (error) {
        const errorId = logToolError('get_signer', error);
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
