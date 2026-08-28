import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { IdOAuthScope } from '../constants.js';
import { runIdAuthenticatedTool } from './run-id-tool.js';
import { CreateCpfPhoneMatchValidationInputSchema } from './schemas.js';
import { splitIdempotencyKey } from './split-idempotency-key.js';

interface CreateCpfPhoneMatchValidationToolDeps {
  env: Env;
}

/**
 * Registers the create_cpf_phone_match_validation MCP tool on the ID server.
 *
 * @param server - MCP server instance
 * @param deps - Worker dependencies
 */
export function registerCreateCpfPhoneMatchValidationTool(
  server: McpServer,
  deps: CreateCpfPhoneMatchValidationToolDeps,
): void {
  server.registerTool(
    'create_cpf_phone_match_validation',
    {
      title: 'Create CPF Phone Match Validation',
      description:
        'Checks whether a Brazilian mobile phone belongs to the CPF holder. Synchronous: returns completed status with match, no_match, or unknown.',
      inputSchema: CreateCpfPhoneMatchValidationInputSchema.shape,
      annotations: {
        title: 'Create CPF Phone Match Validation',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runIdAuthenticatedTool({
        toolName: 'create_cpf_phone_match_validation',
        requiredScope: IdOAuthScope.ValidationsWrite,
        args,
        schema: CreateCpfPhoneMatchValidationInputSchema,
        logEvent: 'cpf_phone_match_created',
        env: deps.env,
        execute: async (client, parsed) => {
          const { body, idempotencyKey } = splitIdempotencyKey(parsed);
          return client.createCpfPhoneMatchValidation(body, { idempotencyKey });
        },
      }),
  );
}
