import { logWarning } from '../utils/logger.js';

export type ToolCallResultClass = 'ok' | 'error';
export type ToolCallClass = 'read' | 'write';

export interface ToolCallTelemetryEvent {
  readonly tool: string;
  readonly resultClass: ToolCallResultClass;
  readonly errorCode?: string;
  readonly durationMs: number;
  readonly accountHash: string;
}

export interface ToolCallTelemetryRecorder {
  record(event: ToolCallTelemetryEvent): Promise<void>;
}

let recorder: ToolCallTelemetryRecorder | null = null;

/**
 * Configures the process-wide telemetry sink. The Node/AWS entry point calls
 * this with a DynamoDB-backed recorder at boot; STDIO and unconfigured
 * transports (including Cloudflare Workers today) leave it null, so no
 * AWS dependency is ever pulled into those runtimes.
 * @param next - Recorder to activate, or null to disable persistence.
 */
export function configureToolCallTelemetryRecorder(next: ToolCallTelemetryRecorder | null): void {
  recorder = next;
}

const READ_PREFIXES = ['list_', 'get_'];

/**
 * Classifies a tool name as a read or write for weekly aggregation.
 * @param toolName - Registered MCP tool name.
 * @returns "read" for tools prefixed list_ or get_, "write" otherwise.
 */
export function classifyToolCall(toolName: string): ToolCallClass {
  return READ_PREFIXES.some((prefix) => toolName.startsWith(prefix)) ? 'read' : 'write';
}

/**
 * Hashes a caller's ZapSign API token so no reversible identifier is ever
 * persisted or logged.
 * @param token - Raw ZapSign API token.
 * @returns Lowercase SHA-256 hex digest.
 */
export async function hashAccountToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function emitToolCallEvent(event: ToolCallTelemetryEvent): void {
  console.log(JSON.stringify({
    event: 'mcp.tool_call',
    tool: event.tool,
    result_class: event.resultClass,
    ...(event.errorCode === undefined ? {} : { error_code: event.errorCode }),
    duration_ms: event.durationMs,
    account_hash: event.accountHash,
    timestamp: new Date().toISOString(),
  }));
}

async function persistToolCallEvent(event: ToolCallTelemetryEvent, tool: string): Promise<void> {
  if (!recorder) {
    return;
  }
  try {
    await recorder.record(event);
  } catch (error) {
    logWarning('telemetry_drop', {
      tool,
      error_class: error instanceof Error ? error.name : 'unknown_error',
    });
  }
}

/**
 * Emits the per-tool-call telemetry line and, if a recorder is configured,
 * best-effort persists it for the weekly aggregate. Never throws: a failed
 * write is logged and swallowed so the caller's tool result is unaffected.
 * @param input - Tool-call outcome plus the raw token to hash for account_hash.
 */
export async function recordToolCallTelemetry(input: {
  tool: string;
  resultClass: ToolCallResultClass;
  errorCode?: string;
  durationMs: number;
  rawToken: string;
}): Promise<void> {
  let accountHash: string;
  try {
    accountHash = await hashAccountToken(input.rawToken);
  } catch {
    accountHash = 'unknown';
  }

  const event: ToolCallTelemetryEvent = {
    tool: input.tool,
    resultClass: input.resultClass,
    ...(input.errorCode === undefined ? {} : { errorCode: input.errorCode }),
    durationMs: input.durationMs,
    accountHash,
  };

  emitToolCallEvent(event);
  await persistToolCallEvent(event, input.tool);
}
