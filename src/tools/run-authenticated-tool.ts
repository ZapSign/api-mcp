import { ZodError, type ZodType } from 'zod';

import { ZapSignClient } from '../api/client.js';
import { getAuthProps } from '../auth/get-auth-props.js';
import { ZapSignMcpError } from '../errors/base.js';
import { ValidationError } from '../errors/validation-error.js';
import { recordToolCallTelemetry } from '../telemetry/tool-call-recorder.js';
import { log, logToolError } from '../utils/logger.js';
import { requireScope } from '../utils/scope.js';
import {
  formatToolError,
  formatToolSuccess,
  formatUnexpectedToolError,
} from '../utils/tool-response.js';

type ToolContentResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

function errorCodeFor(error: unknown): string {
  if (error instanceof ZodError) {
    return 'ValidationError';
  }
  if (error instanceof ZapSignMcpError) {
    return error.code;
  }
  return 'unknown_error';
}

export async function runAuthenticatedTool<TArgs>(options: {
  toolName: string;
  requiredScopes: string[];
  args: unknown;
  schema: ZodType<TArgs>;
  logEvent: string;
  execute: (client: ZapSignClient, args: TArgs) => Promise<unknown>;
}): Promise<ToolContentResult> {
  const startedAt = Date.now();
  try {
    const props = getAuthProps();
    if (!props) {
      return formatToolError(
        'Authentication required. Reconnect the ZapSign integration or set ZAPSIGN_API_KEY for local STDIO.',
      );
    }

    for (const scope of options.requiredScopes) {
      requireScope(props.grantedScope, scope);
    }

    const parsed = options.schema.parse(options.args);
    const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
    const result = await options.execute(client, parsed);
    log(options.logEvent);
    await recordToolCallTelemetry({
      tool: options.toolName,
      resultClass: 'ok',
      durationMs: Date.now() - startedAt,
      rawToken: props.zapSignApiToken,
    });
    return formatToolSuccess(JSON.stringify(result));
  } catch (error) {
    const errorId = logToolError(options.toolName, error);
    const authProps = getAuthProps();
    if (authProps) {
      await recordToolCallTelemetry({
        tool: options.toolName,
        resultClass: 'error',
        errorCode: errorCodeFor(error),
        durationMs: Date.now() - startedAt,
        rawToken: authProps.zapSignApiToken,
      });
    }
    if (error instanceof ZodError) {
      return formatToolError(ValidationError.fromZodError(error).message);
    }
    if (error instanceof ZapSignMcpError) {
      return formatToolError(error.message);
    }
    return formatUnexpectedToolError(errorId);
  }
}
