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
import { UpdateSignerBaseSchema, UpdateSignerInputSchema } from './schemas.js';

export function registerUpdateSignerTool(server: McpServer): void {
  server.registerTool(
    'update_signer',
    {
      title: 'Update Signer',
      description:
        "Updates a signer's contact information (name, email, phone). Can only be modified before the signer has signed.",
      inputSchema: UpdateSignerBaseSchema.shape,
      annotations: {
        title: 'Update Signer',
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
        requireScope(props.grantedScope, 'signers:write');

        const parsed = UpdateSignerInputSchema.parse(args);
        const client = new ZapSignClient(
          props.zapSignApiUrl,
          props.zapSignApiToken,
        );

        const { signer_token, ...updateData } = parsed;
        const result = await client.updateSigner(signer_token, updateData);
        log('signer_updated');

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('update_signer', error);
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
