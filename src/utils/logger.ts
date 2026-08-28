import { ZapSignMcpError } from '../errors/base.js';

export const LogLevel = {
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
} as const;

const SENSITIVE_METADATA_KEY = /token|authorization|password|secret|name|email|phone|body|verifier|^state$|^code$/i;
const UNKNOWN_ERROR_CLASS = 'unknown_error';

type LogLevelValue = (typeof LogLevel)[keyof typeof LogLevel];
type LogValue = boolean | number | string | undefined;
type LogData = Record<string, LogValue>;

function sanitizeLogData(data: LogData): LogData {
  const entries = Object.entries(data).filter(
    ([key]) => !SENSITIVE_METADATA_KEY.test(key),
  );
  return Object.fromEntries(entries);
}

function serializeLog(
  event: string,
  level: LogLevelValue,
  data: LogData,
): string {
  return JSON.stringify({
    event,
    level,
    ...sanitizeLogData(data),
    ts: new Date().toISOString(),
  });
}

function getErrorClass(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }
  return UNKNOWN_ERROR_CLASS;
}

function getErrorStatusCode(error: unknown): number | undefined {
  if (error instanceof ZapSignMcpError) {
    return error.statusCode;
  }
  return undefined;
}

/**
 * Writes an informational structured log entry with PII-sensitive fields removed.
 * @param event - Snake-case event name.
 * @param data - Allowed structured metadata.
 * @returns Nothing.
 */
export function log(event: string, data: LogData = {}): void {
  console.log(serializeLog(event, LogLevel.Info, data));
}

/**
 * Writes a warning structured log entry with PII-sensitive fields removed.
 * @param event - Snake-case event name.
 * @param data - Allowed structured metadata.
 * @returns Nothing.
 */
export function logWarning(event: string, data: LogData = {}): void {
  console.warn(serializeLog(event, LogLevel.Warn, data));
}

/**
 * Writes an error structured log entry with PII-sensitive fields removed.
 * @param event - Snake-case event name.
 * @param data - Allowed structured metadata.
 * @returns Nothing.
 */
export function logError(event: string, data: LogData = {}): void {
  console.error(serializeLog(event, LogLevel.Error, data));
}

/**
 * Emits the standard MCP tool error event without serializing the error message.
 * @param tool - Registered MCP tool name.
 * @param error - Caught tool error.
 * @returns Correlation identifier recorded with the event.
 */
export function logToolError(tool: string, error: unknown): string {
  const errorId = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  logError('tool_error', {
    tool,
    error_class: getErrorClass(error),
    status_code: getErrorStatusCode(error),
    error_id: errorId,
  });
  return errorId;
}
