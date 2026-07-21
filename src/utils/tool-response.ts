/** Conservative character limit (~15K tokens) to stay under Anthropic's 25K token cap per tool result. */
export const MAX_RESPONSE_CHARS = 60_000;

const DEFAULT_TRUNCATION_NOTICE =
  '[Response truncated. Use pagination or more specific queries to see remaining data.]';
const MAX_TRUNCATION_NOTICE_CHARS = 500;

type JsonRecord = Record<string, unknown>;

type JsonListResponse = JsonRecord & {
  results: unknown[];
};

export interface ToolResponseOptions {
  truncationNotice?: string;
}

/**
 * Formats a successful MCP tool response, truncating it within the response budget.
 *
 * @param text - The response body (typically compact JSON via JSON.stringify)
 * @param options - Optional tool-specific presentation details
 * @returns MCP-compliant success content block
 */
export function formatToolSuccess(text: string, options: ToolResponseOptions = {}) {
  if (text.length <= MAX_RESPONSE_CHARS) {
    return { content: [{ type: 'text' as const, text }] };
  }

  const notice = getTruncationNotice(options.truncationNotice);
  const truncatedJson = truncateJsonListResponse(text, notice);
  const responseText = truncatedJson ?? truncatePlainText(text, notice);

  return { content: [{ type: 'text' as const, text: responseText }] };
}

function getTruncationNotice(notice: string | undefined): string {
  if (!notice) {
    return DEFAULT_TRUNCATION_NOTICE;
  }

  return notice.slice(0, MAX_TRUNCATION_NOTICE_CHARS);
}

function truncateJsonListResponse(text: string, notice: string): string | undefined {
  const value = parseJson(text);
  if (value instanceof Error || !isJsonListResponse(value)) {
    return undefined;
  }

  return fitJsonListResponse(value, notice);
}

function parseJson(text: string): unknown | Error {
  try {
    return JSON.parse(text);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to parse JSON tool response.');
  }
}

function isJsonListResponse(value: unknown): value is JsonListResponse {
  if (!isJsonRecord(value)) {
    return false;
  }

  return Array.isArray(value.results);
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fitJsonListResponse(response: JsonListResponse, notice: string): string {
  const retainedResults = findRetainedResults(response, notice);
  const truncated = serializeListResponse(response, retainedResults, notice);
  if (truncated.length <= MAX_RESPONSE_CHARS) {
    return truncated;
  }

  return JSON.stringify({
    results: [],
    truncation: { removedResults: response.results.length, notice },
  });
}

function findRetainedResults(response: JsonListResponse, notice: string): unknown[] {
  let minimum = 0;
  let maximum = response.results.length;

  while (minimum < maximum) {
    const candidate = Math.ceil((minimum + maximum) / 2);
    const results = response.results.slice(0, candidate);
    if (serializeListResponse(response, results, notice).length <= MAX_RESPONSE_CHARS) {
      minimum = candidate;
      continue;
    }

    maximum = candidate - 1;
  }

  return response.results.slice(0, minimum);
}

function serializeListResponse(response: JsonListResponse, results: unknown[], notice: string): string {
  const removedResults = response.results.length - results.length;
  return JSON.stringify({
    ...response,
    results,
    truncation: { removedResults, notice },
  });
}

function truncatePlainText(text: string, notice: string): string {
  const suffix = `\n\n${notice}`;
  return `${text.slice(0, MAX_RESPONSE_CHARS - suffix.length)}${suffix}`;
}

/**
 * Formats an error MCP tool response with actionable message for Claude.
 *
 * @param message - Human-readable error description explaining how to recover
 * @returns MCP-compliant error content block
 */
export function formatToolError(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true as const };
}

/**
 * Formats an unexpected tool failure without exposing internal error details.
 *
 * @param errorId - Correlation identifier emitted in the structured error log
 * @returns MCP-compliant error content block with support guidance
 */
export function formatUnexpectedToolError(errorId: string) {
  return formatToolError(
    `An unexpected error occurred. Please try again or contact support with error ID [${errorId}].`,
  );
}
