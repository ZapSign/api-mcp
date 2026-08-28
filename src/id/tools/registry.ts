import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Env } from '../../types/env.js';
import { registerCreateCpfPhoneMatchValidationTool } from './create-cpf-phone-match-validation.js';
import { registerCreateLivenessDocumentMatchValidationTool } from './create-liveness-document-match-validation.js';
import { registerCreatePhoneOwnershipValidationTool } from './create-phone-ownership-validation.js';
import { registerCreateSimSwapValidationTool } from './create-sim-swap-validation.js';
import { registerGetValidationTool } from './get-validation.js';
import { registerListValidationsTool } from './list-validations.js';
import { registerVerifyValidationTool } from './verify-validation.js';

/**
 * Registers all ZapSign ID MCP tools on the server instance.
 *
 * @param server - MCP server instance
 * @param env - Worker environment bindings
 */
export function registerIdTools(server: McpServer, env: Env): void {
  registerListValidationsTool(server, { env });
  registerGetValidationTool(server, { env });
  registerCreateCpfPhoneMatchValidationTool(server, { env });
  registerCreateSimSwapValidationTool(server, { env });
  registerCreateLivenessDocumentMatchValidationTool(server, { env });
  registerCreatePhoneOwnershipValidationTool(server, { env });
  registerVerifyValidationTool(server, { env });
}
