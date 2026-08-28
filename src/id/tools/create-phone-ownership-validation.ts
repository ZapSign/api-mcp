import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { IdOAuthScope } from '../constants.js';
import { runIdAuthenticatedTool } from './run-id-tool.js';
import { CreatePhoneOwnershipValidationInputSchema } from './schemas.js';
import { splitIdempotencyKey } from './split-idempotency-key.js';

interface CreatePhoneOwnershipValidationToolDeps {
  env: Env;
}

/**
 * Registers the create_phone_ownership_validation MCP tool on the ID server.
 *
 * @param server - MCP server instance
 * @param deps - Worker dependencies
 */
export function registerCreatePhoneOwnershipValidationTool(
  server: McpServer,
  deps: CreatePhoneOwnershipValidationToolDeps,
): void {
  server.registerTool(
    'create_phone_ownership_validation',
    {
      title: 'Create Phone Ownership Validation',
      description:
        'Sends a WhatsApp verification code to confirm phone possession. Returns pending status; call verify_validation with the code the subject receives.',
      inputSchema: CreatePhoneOwnershipValidationInputSchema.shape,
      annotations: {
        title: 'Create Phone Ownership Validation',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runIdAuthenticatedTool({
        toolName: 'create_phone_ownership_validation',
        requiredScope: IdOAuthScope.ValidationsWrite,
        args,
        schema: CreatePhoneOwnershipValidationInputSchema,
        logEvent: 'phone_ownership_created',
        env: deps.env,
        execute: async (client, parsed) => {
          const { body, idempotencyKey } = splitIdempotencyKey(parsed);
          return client.createPhoneOwnershipValidation(body, { idempotencyKey });
        },
      }),
  );
}
