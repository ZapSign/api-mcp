import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { IdOAuthScope } from '../constants.js';
import { runIdAuthenticatedTool } from './run-id-tool.js';
import { CreateLivenessDocumentMatchValidationInputSchema } from './schemas.js';
import { splitIdempotencyKey } from './split-idempotency-key.js';

interface CreateLivenessDocumentMatchValidationToolDeps {
  env: Env;
}

/**
 * Registers the create_liveness_document_match_validation MCP tool on the ID server.
 *
 * @param server - MCP server instance
 * @param deps - Worker dependencies
 */
export function registerCreateLivenessDocumentMatchValidationTool(
  server: McpServer,
  deps: CreateLivenessDocumentMatchValidationToolDeps,
): void {
  server.registerTool(
    'create_liveness_document_match_validation',
    {
      title: 'Create Liveness Document Match Validation',
      description:
        'Starts a hosted liveness and document match session. Returns pending status with validation_url to redirect the subject; poll get_validation until completed.',
      inputSchema: CreateLivenessDocumentMatchValidationInputSchema.shape,
      annotations: {
        title: 'Create Liveness Document Match Validation',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) =>
      runIdAuthenticatedTool({
        toolName: 'create_liveness_document_match_validation',
        requiredScope: IdOAuthScope.ValidationsWrite,
        args,
        schema: CreateLivenessDocumentMatchValidationInputSchema,
        logEvent: 'liveness_document_match_created',
        env: deps.env,
        execute: async (client, parsed) => {
          const { body, idempotencyKey } = splitIdempotencyKey(parsed);
          return client.createLivenessDocumentMatchValidation(body, { idempotencyKey });
        },
      }),
  );
}
