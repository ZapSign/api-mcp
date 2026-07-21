import { getAuthProps } from '../../auth/get-auth-props.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZodError } from 'zod';

import { ZapSignClient } from '../../api/client.js';
import { ZapSignMcpError } from '../../errors/base.js';
import { ValidationError } from '../../errors/validation-error.js';
import type { CreateSignerInput } from '../../types/zapsign.js';
import { log, logToolError } from '../../utils/logger.js';
import { requireScope } from '../../utils/scope.js';
import {
  formatToolError,
  formatToolSuccess,
  formatUnexpectedToolError,
} from '../../utils/tool-response.js';
import { AddSignerBaseSchema, AddSignerInputSchema } from './schemas.js';

export function registerAddSignerTool(server: McpServer): void {
  server.registerTool(
    'add_signer',
    {
      title: 'Add Signer',
      description:
        'Adds a new signer to an existing document by doc_token. Returns the signer token and a unique signing link (sign_url). To send automatic email, provide email; to send automatic WhatsApp, provide phone_country and phone_number.',
      inputSchema: AddSignerBaseSchema.shape,
      annotations: {
        title: 'Add Signer',
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
        requireScope(props.grantedScope, 'signers:write');

        const parsed = AddSignerInputSchema.parse(args);
        const client = new ZapSignClient(
          props.zapSignApiUrl,
          props.zapSignApiToken,
        );

        const { doc_token, ...signerData } = parsed;
        // Zod validates auth_mode against AuthMode values; cast is safe
        const result = await client.addSigner(
          doc_token,
          signerData as CreateSignerInput,
        );
        log('signer_added');

        return formatToolSuccess(JSON.stringify(result));
      } catch (error) {
        const errorId = logToolError('add_signer', error);
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
