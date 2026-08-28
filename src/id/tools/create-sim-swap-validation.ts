import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { IdOAuthScope } from '../constants.js';
import { runIdAuthenticatedTool } from './run-id-tool.js';
import { CreateSimSwapValidationInputSchema } from './schemas.js';
import { splitIdempotencyKey } from './split-idempotency-key.js';

interface CreateSimSwapValidationToolDeps {
  env: Env;
}

/**
 * Registers the create_sim_swap_validation MCP tool on the ID server.
 *
 * @param server - MCP server instance
 * @param deps - Worker dependencies
 */
export function registerCreateSimSwapValidationTool(
  server: McpServer,
  deps: CreateSimSwapValidationToolDeps,
): void {
  server.registerTool(
    'create_sim_swap_validation',
    {
      title: 'Create SIM Swap Validation',
      description:
        'Detects recent SIM swap on a Brazilian mobile number. Synchronous: returns completed status with recent_swap or no_recent_swap.',
      inputSchema: CreateSimSwapValidationInputSchema.shape,
      annotations: {
        title: 'Create SIM Swap Validation',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runIdAuthenticatedTool({
        toolName: 'create_sim_swap_validation',
        requiredScope: IdOAuthScope.ValidationsWrite,
        args,
        schema: CreateSimSwapValidationInputSchema,
        logEvent: 'sim_swap_created',
        env: deps.env,
        execute: async (client, parsed) => {
          const { body, idempotencyKey } = splitIdempotencyKey(parsed);
          return client.createSimSwapValidation(body, { idempotencyKey });
        },
      }),
  );
}
