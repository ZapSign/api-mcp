import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { IdOAuthScope } from '../constants.js';
import { runIdAuthenticatedTool } from './run-id-tool.js';
import { VerifyValidationInputSchema } from './schemas.js';

interface VerifyValidationToolDeps {
  env: Env;
}

/**
 * Registers the verify_validation MCP tool on the ID server.
 *
 * @param server - MCP server instance
 * @param deps - Worker dependencies
 */
export function registerVerifyValidationTool(server: McpServer, deps: VerifyValidationToolDeps): void {
  server.registerTool(
    'verify_validation',
    {
      title: 'Verify Validation',
      description:
        'Submits the WhatsApp code for a phone_ownership validation. Returns updated validation status after each attempt.',
      inputSchema: VerifyValidationInputSchema.shape,
      annotations: {
        title: 'Verify Validation',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runIdAuthenticatedTool({
        toolName: 'verify_validation',
        requiredScope: IdOAuthScope.ValidationsWrite,
        args,
        schema: VerifyValidationInputSchema,
        logEvent: 'validation_verified',
        env: deps.env,
        execute: async (client, parsed) => {
          const { id, code, idempotency_key: idempotencyKey } = parsed;
          return client.verifyValidation(id, { code }, { idempotencyKey });
        },
      }),
  );
}
