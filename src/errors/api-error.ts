import { ZapSignMcpError } from './base.js';
import { AuthError } from './auth-error.js';

interface ApiErrorDefinition {
  code: string;
  message: string;
  retryable: boolean;
}

const STATUS_MAP: Record<number, ApiErrorDefinition> = {
  400: {
    code: 'bad_request',
    message: 'ZapSign could not process this request. Check the supplied fields and try again.',
    retryable: false,
  },
  403: {
    code: 'forbidden',
    message: 'ZapSign does not permit this action with the current authorization. Please reconnect the ZapSign integration and try again.',
    retryable: false,
  },
  404: {
    code: 'not_found',
    message: 'ZapSign could not find the requested resource. Verify its token and try again.',
    retryable: false,
  },
  429: {
    code: 'rate_limited',
    message: 'ZapSign is temporarily rate limiting requests.',
    retryable: true,
  },
};

const DEFAULT_SERVER_ERROR: ApiErrorDefinition = {
  code: 'upstream_error',
  message: 'ZapSign is temporarily unavailable.',
  retryable: true,
};

function resolveErrorDefinition(status: number): ApiErrorDefinition {
  if (status === 401) {
    return AuthError.apiTokenRejected();
  }

  return STATUS_MAP[status] ?? DEFAULT_SERVER_ERROR;
}

function formatRetryAfterWait(retryAfterSeconds: number): string {
  const unit = retryAfterSeconds === 1 ? 'second' : 'seconds';
  return ` This request is retryable. Wait ${retryAfterSeconds} ${unit} before trying again.`;
}

function formatActionableMessage(
  definition: ApiErrorDefinition,
  retryAfterSeconds: number | undefined,
): string {
  if (!definition.retryable) {
    return definition.message;
  }

  if (retryAfterSeconds !== undefined) {
    return `${definition.message}${formatRetryAfterWait(retryAfterSeconds)}`;
  }

  if (definition.code === 'rate_limited') {
    return `${definition.message} This request is retryable. Please wait a moment before trying again.`;
  }

  return `${definition.message} This request is retryable. Please try again.`;
}

export class ZapSignApiError extends ZapSignMcpError {
  constructor(
    message: string,
    code: string,
    statusCode: number,
    retryable: boolean,
  ) {
    super(message, code, statusCode, retryable);
    this.name = 'ZapSignApiError';
  }

  /**
   * Maps an HTTP response from ZapSign API into a typed error.
   *
   * @param status - Upstream HTTP response status
   * @param _body - Upstream response body, intentionally excluded from messages
   * @param retryAfterSeconds - Validated wait duration suggested by ZapSign
   * @returns Typed API error with actionable recovery guidance
   */
  static fromResponse(
    status: number,
    _body: unknown,
    retryAfterSeconds?: number,
  ): ZapSignApiError {
    const mapped = resolveErrorDefinition(status);
    return new ZapSignApiError(
      formatActionableMessage(mapped, retryAfterSeconds),
      mapped.code,
      status,
      mapped.retryable,
    );
  }
}
