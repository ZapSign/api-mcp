import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runAuthenticatedTool } from '../run-authenticated-tool.js';
import { SignInBatchInputSchema } from './batch-schemas.js';

export function registerSignInBatchTool(server: McpServer): void {
  server.registerTool(
    'sign_in_batch',
    {
      title: 'Sign In Batch',
      description:
        'Signs multiple documents in one request using a user_token and signer_tokens list. This is an irreversible action; use only when the account is authorized for batch signing and the user has confirmed the documents.',
      inputSchema: SignInBatchInputSchema.shape,
      annotations: {
        title: 'Sign In Batch',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runAuthenticatedTool({
        toolName: 'sign_in_batch',
        requiredScopes: ['signers:write'],
        args,
        schema: SignInBatchInputSchema,
        logEvent: 'batch_signed',
        execute: (client, parsed) => client.signInBatch(parsed),
      }),
  );
}
