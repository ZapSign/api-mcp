import type { ZodType } from 'zod';
import { ZodError } from 'zod';

import { ZapSignMcpError } from '../../errors/base.js';
import { ValidationError } from '../../errors/validation-error.js';
import { log, logToolError } from '../../utils/logger.js';
import { requireScope } from '../../utils/scope.js';
import {
  formatToolError,
  formatToolSuccess,
  formatUnexpectedToolError,
} from '../../utils/tool-response.js';
import type { Env } from '../../types/env.js';
import { IdApiClient, IdApiError, withAccessTokenRetry } from '../api-client.js';
import { getIdAuthProps } from '../get-id-auth.js';
import { IdTokenError, getValidAccessToken } from '../token-service.js';

type ToolContentResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

/**
 * Runs an authenticated ID MCP tool with token refresh retry.
 *
 * @param options - Tool execution configuration
 * @returns MCP tool response content
 */
export async function runIdAuthenticatedTool<TArgs>(options: {
  toolName: string;
  requiredScope: string;
  args: unknown;
  schema: ZodType<TArgs>;
  logEvent: string;
  env: Env;
  execute: (client: IdApiClient, args: TArgs) => Promise<unknown>;
}): Promise<ToolContentResult> {
  try {
    const props = getIdAuthProps();
    if (!props) {
      return formatToolError('Authentication required. Reconnect the ZapSign ID integration.');
    }
    requireScope(props.grantedScope, options.requiredScope);

    const parsed = options.schema.parse(options.args);
    const tokenResult = await getValidAccessToken(
      options.env.OAUTH_KV,
      options.env.ID_TOKEN_ENCRYPTION_KEY,
      props.userId,
    );
    const executeWithToken = async (accessToken: string) => {
      const client = new IdApiClient(accessToken);
      return options.execute(client, parsed);
    };
    const refresh = async () => {
      const refreshed = await getValidAccessToken(
        options.env.OAUTH_KV,
        options.env.ID_TOKEN_ENCRYPTION_KEY,
        props.userId,
      );
      return refreshed.accessToken;
    };
    const result = await withAccessTokenRetry(tokenResult.accessToken, executeWithToken, refresh);
    log(options.logEvent);
    return formatToolSuccess(JSON.stringify(result));
  } catch (error) {
    const errorId = logToolError(options.toolName, error);
    if (error instanceof ZodError) {
      return formatToolError(ValidationError.fromZodError(error).message);
    }
    if (error instanceof IdTokenError || error instanceof IdApiError || error instanceof ZapSignMcpError) {
      return formatToolError(error.message);
    }
    return formatUnexpectedToolError(errorId);
  }
}
