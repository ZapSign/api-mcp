import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { IdOAuthScope } from '../constants.js';
import { runIdAuthenticatedTool } from './run-id-tool.js';
import { GetValidationInputSchema } from './schemas.js';

interface GetValidationToolDeps {
  env: Env;
}

/**
 * Registers the get_validation MCP tool on the ID server.
 *
 * @param server - MCP server instance
 * @param deps - Worker dependencies
 */
export function registerGetValidationTool(server: McpServer, deps: GetValidationToolDeps): void {
  server.registerTool(
    'get_validation',
    {
      title: 'Get Validation',
      description:
        'Retrieves a ZapSign ID validation by id. Use after creating hosted validations (liveness_document_match) to poll until status is completed.',
      inputSchema: GetValidationInputSchema.shape,
      annotations: {
        title: 'Get Validation',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) =>
      runIdAuthenticatedTool({
        toolName: 'get_validation',
        requiredScope: IdOAuthScope.ValidationsRead,
        args,
        schema: GetValidationInputSchema,
        logEvent: 'validation_retrieved',
        env: deps.env,
        execute: async (client, parsed) => client.getValidation(parsed.id),
      }),
  );
}
