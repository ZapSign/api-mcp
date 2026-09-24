import type { KvStore } from '../store/kv-store.js';
import { logWarning } from '../utils/logger.js';
import { classifyToolCall, type ToolCallTelemetryEvent, type ToolCallTelemetryRecorder } from './tool-call-recorder.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1_000;
const KEY_PREFIX = 'telemetry:week:';
// Headroom past the 14-week response window so DynamoDB TTL cleanup never
// races the read path; TTL is cleanup-only, not correctness-critical here.
const RETENTION_SECONDS = 26 * 7 * 24 * 60 * 60;
const DEFAULT_WEEK_COUNT = 14;

interface WeeklyCounters {
  reads: number;
  writes: number;
  accounts: string[];
}

const EMPTY_COUNTERS: WeeklyCounters = { reads: 0, writes: 0, accounts: [] };

export interface WeeklyToolCallsResponse {
  weeks: Array<{
    week: string;
    reads: number;
    writes: number;
    distinctAccounts: number;
  }>;
}

/**
 * Returns the UTC midnight of the ISO-Monday that starts the week containing `date`.
 * @param date - Any instant.
 * @returns Monday 00:00:00 UTC of that ISO week.
 */
export function isoMondayUtc(date: Date): Date {
  const utcMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const isoDay = utcMidnight.getUTCDay() === 0 ? 7 : utcMidnight.getUTCDay();
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - (isoDay - 1));
  return utcMidnight;
}

/**
 * Formats a date as YYYY-MM-DD, matching gepeto's Go layout "2006-01-02".
 * @param date - Date to format.
 * @returns ISO calendar date string.
 */
export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Computes `count` consecutive ISO-Monday-UTC week starts ending at the
 * current week, oldest first.
 * @param count - Number of weeks to return.
 * @param now - Reference instant (injectable for tests).
 * @returns Ascending array of week-start dates.
 */
export function lastNWeekStarts(count: number, now: Date): Date[] {
  const currentWeekStart = isoMondayUtc(now);
  const weeks: Date[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    weeks.push(new Date(currentWeekStart.getTime() - i * WEEK_MS));
  }
  return weeks;
}

function weekKey(weekStart: Date): string {
  return `${KEY_PREFIX}${formatIsoDate(weekStart)}`;
}

function incrementCounters(base: WeeklyCounters, event: ToolCallTelemetryEvent): WeeklyCounters {
  const toolClass = classifyToolCall(event.tool);
  const accounts = base.accounts.includes(event.accountHash)
    ? base.accounts
    : [...base.accounts, event.accountHash];
  return {
    reads: base.reads + (toolClass === 'read' ? 1 : 0),
    writes: base.writes + (toolClass === 'write' ? 1 : 0),
    accounts,
  };
}

/**
 * Best-effort weekly counter persisted via the shared KvStore interface.
 * This is a non-atomic read-modify-write: under concurrent Fargate tasks it
 * can undercount on rare races. Acceptable for approximate adoption
 * analytics; not used for billing or security decisions.
 */
export class DynamoToolCallTelemetryRecorder implements ToolCallTelemetryRecorder {
  constructor(private readonly kv: KvStore) {}

  async record(event: ToolCallTelemetryEvent): Promise<void> {
    const key = weekKey(isoMondayUtc(new Date()));
    const existing = (await this.kv.getJson(key)) as WeeklyCounters | null;
    const updated = incrementCounters(existing ?? EMPTY_COUNTERS, event);
    await this.kv.putJson(key, updated, { ttlSeconds: RETENTION_SECONDS });
  }
}

async function readWeekCounters(kv: KvStore, weekStart: Date): Promise<WeeklyCounters> {
  try {
    const stored = (await kv.getJson(weekKey(weekStart))) as WeeklyCounters | null;
    return stored ?? EMPTY_COUNTERS;
  } catch (error) {
    logWarning('telemetry_drop', {
      phase: 'read',
      error_class: error instanceof Error ? error.name : 'unknown_error',
    });
    return EMPTY_COUNTERS;
  }
}

/**
 * Builds the public weekly aggregate matching gepeto's
 * internal/okrsmetrics/tool_calls.go consumer contract exactly. Fail-soft:
 * a DynamoDB read failure for any week returns zero-filled counts for that
 * week rather than failing the whole response.
 * @param kv - KvStore backing the weekly counters.
 * @param now - Reference instant (injectable for tests).
 * @param weekCount - Number of trailing weeks to include.
 * @returns `{ weeks: [{ week, reads, writes, distinctAccounts }, ...] }`, oldest first.
 */
export async function buildWeeklyToolCallsResponse(
  kv: KvStore,
  now: Date = new Date(),
  weekCount: number = DEFAULT_WEEK_COUNT,
): Promise<WeeklyToolCallsResponse> {
  const weekStarts = lastNWeekStarts(weekCount, now);
  const weeks = await Promise.all(weekStarts.map(async (weekStart) => {
    const counters = await readWeekCounters(kv, weekStart);
    return {
      week: formatIsoDate(weekStart),
      reads: counters.reads,
      writes: counters.writes,
      distinctAccounts: counters.accounts.length,
    };
  }));
  return { weeks };
}
