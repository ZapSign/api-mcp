import { describe, expect, it, vi } from 'vitest';

import type { KvStore } from '../../../src/store/kv-store.js';
import {
  DynamoToolCallTelemetryRecorder,
  buildWeeklyToolCallsResponse,
  formatIsoDate,
  isoMondayUtc,
  lastNWeekStarts,
} from '../../../src/telemetry/weekly-store.js';

function fakeKvStore(initial: Record<string, unknown> = {}): KvStore & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    async get(key: string) {
      const value = data.get(key);
      return typeof value === 'string' ? value : null;
    },
    async put(key: string, value: string) {
      data.set(key, value);
    },
    async delete(key: string) {
      data.delete(key);
    },
    async getJson(key: string) {
      return data.has(key) ? data.get(key) : null;
    },
    async putJson(key: string, value: unknown) {
      data.set(key, value);
    },
  };
}

describe('isoMondayUtc', () => {
  it('returns the same Monday for every day within that ISO week', () => {
    // 2026-09-24 is a Thursday.
    const thursday = new Date('2026-09-24T15:00:00.000Z');
    const monday = isoMondayUtc(thursday);
    expect(formatIsoDate(monday)).toBe('2026-09-21');
  });

  it('treats Sunday as the last day of the ISO week', () => {
    const sunday = new Date('2026-09-27T23:59:00.000Z');
    expect(formatIsoDate(isoMondayUtc(sunday))).toBe('2026-09-21');
  });

  it('rolls over correctly when Monday itself is given', () => {
    const monday = new Date('2026-09-21T00:00:00.000Z');
    expect(formatIsoDate(isoMondayUtc(monday))).toBe('2026-09-21');
  });
});

describe('lastNWeekStarts', () => {
  it('returns weeks oldest-first ending at the current ISO week', () => {
    const now = new Date('2026-09-24T12:00:00.000Z');
    const weeks = lastNWeekStarts(3, now);
    expect(weeks.map(formatIsoDate)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21']);
  });

  it('returns exactly the requested number of weeks', () => {
    const weeks = lastNWeekStarts(14, new Date('2026-09-24T12:00:00.000Z'));
    expect(weeks).toHaveLength(14);
  });
});

describe('DynamoToolCallTelemetryRecorder', () => {
  it('increments reads and writes and tracks distinct accounts for the current week', async () => {
    const kv = fakeKvStore();
    const recorder = new DynamoToolCallTelemetryRecorder(kv);

    await recorder.record({ tool: 'list_documents', resultClass: 'ok', durationMs: 1, accountHash: 'acct-a' });
    await recorder.record({ tool: 'create_document', resultClass: 'ok', durationMs: 1, accountHash: 'acct-a' });
    await recorder.record({ tool: 'get_document', resultClass: 'error', durationMs: 1, accountHash: 'acct-b' });

    const response = await buildWeeklyToolCallsResponse(kv, new Date(), 1);
    expect(response.weeks).toHaveLength(1);
    expect(response.weeks[0]).toMatchObject({ reads: 2, writes: 1, distinctAccounts: 2 });
  });

  it('counts a repeated account only once per week', async () => {
    const kv = fakeKvStore();
    const recorder = new DynamoToolCallTelemetryRecorder(kv);

    await recorder.record({ tool: 'list_documents', resultClass: 'ok', durationMs: 1, accountHash: 'acct-a' });
    await recorder.record({ tool: 'list_documents', resultClass: 'ok', durationMs: 1, accountHash: 'acct-a' });

    const response = await buildWeeklyToolCallsResponse(kv, new Date(), 1);
    expect(response.weeks[0].distinctAccounts).toBe(1);
    expect(response.weeks[0].reads).toBe(2);
  });
});

describe('buildWeeklyToolCallsResponse', () => {
  it('returns exactly the gepeto consumer contract shape for empty history', async () => {
    const kv = fakeKvStore();
    const response = await buildWeeklyToolCallsResponse(kv, new Date('2026-09-24T12:00:00.000Z'), 2);

    expect(response).toEqual({
      weeks: [
        { week: '2026-09-14', reads: 0, writes: 0, distinctAccounts: 0 },
        { week: '2026-09-21', reads: 0, writes: 0, distinctAccounts: 0 },
      ],
    });
  });

  it('is fail-soft and zero-fills a week when the store read throws', async () => {
    const kv: KvStore = {
      async get() { return null; },
      async put() {},
      async delete() {},
      async getJson() { throw new Error('dynamo unavailable'); },
      async putJson() {},
    };
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await buildWeeklyToolCallsResponse(kv, new Date('2026-09-24T12:00:00.000Z'), 1);

    expect(response.weeks).toEqual([
      { week: '2026-09-21', reads: 0, writes: 0, distinctAccounts: 0 },
    ]);
    vi.restoreAllMocks();
  });
});
