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
import { DeleteSignerInputSchema } from './schemas.js';

export function registerDeleteSignerTool(server: McpServer): void {
  server.registerTool(
    'delete_signer',
    {
      title: 'Delete Signer',
      description:
        'Removes a signer from a document by signer_token. ZapSign rejects this action when the signer has already signed or is the document’s only signer; add another signer first when needed.',
      inputSchema: DeleteSignerInputSchema.shape,
      annotations: {
        title: 'Delete Signer',
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
        requireScope(props.grantedScope, 'signers:write');

        const parsed = DeleteSignerInputSchema.parse(args);
        const client = new ZapSignClient(
          props.zapSignApiUrl,
          props.zapSignApiToken,
        );

        const result = await client.deleteSigner(parsed.signer_token);
        log('signer_deleted');

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('delete_signer', error);
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
