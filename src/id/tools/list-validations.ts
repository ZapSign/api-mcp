import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { IdOAuthScope } from '../constants.js';
import { runIdAuthenticatedTool } from './run-id-tool.js';
import { ListValidationsInputSchema } from './schemas.js';

interface ListValidationsToolDeps {
  env: Env;
}

/**
 * Registers the list_validations MCP tool on the ID server.
 *
 * @param server - MCP server instance
 * @param deps - Worker dependencies
 */
export function registerListValidationsTool(server: McpServer, deps: ListValidationsToolDeps): void {
  server.registerTool(
    'list_validations',
    {
      title: 'List Validations',
      description:
        'Returns a paginated list of identity validations from ZapSign ID, newest first. Use limit, after, or before for cursor pagination.',
      inputSchema: ListValidationsInputSchema.shape,
      annotations: {
        title: 'List Validations',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) =>
      runIdAuthenticatedTool({
        toolName: 'list_validations',
        requiredScope: IdOAuthScope.ValidationsRead,
        args,
        schema: ListValidationsInputSchema,
        logEvent: 'validations_listed',
        env: deps.env,
        execute: async (client, parsed) => client.listValidations(parsed),
      }),
  );
}
