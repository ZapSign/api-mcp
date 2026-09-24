import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  classifyToolCall,
  configureToolCallTelemetryRecorder,
  hashAccountToken,
  recordToolCallTelemetry,
} from '../../../src/telemetry/tool-call-recorder.js';

describe('classifyToolCall', () => {
  it('classifies list_* and get_* tools as reads', () => {
    expect(classifyToolCall('list_documents')).toBe('read');
    expect(classifyToolCall('get_document')).toBe('read');
  });

  it('classifies every other tool as a write', () => {
    expect(classifyToolCall('create_document')).toBe('write');
    expect(classifyToolCall('delete_signer')).toBe('write');
    expect(classifyToolCall('place_signatures')).toBe('write');
  });
});

describe('hashAccountToken', () => {
  it('returns a deterministic 64-character hex digest', async () => {
    const hash = await hashAccountToken('token-value');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashAccountToken('token-value')).toBe(hash);
  });

  it('never returns the raw token', async () => {
    const hash = await hashAccountToken('super-secret-token');
    expect(hash).not.toContain('super-secret-token');
  });
});

describe('recordToolCallTelemetry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    configureToolCallTelemetryRecorder(null);
  });

  it('emits exactly one JSON line with the required fields and no secrets', async () => {
    await recordToolCallTelemetry({
      tool: 'list_documents',
      resultClass: 'ok',
      durationMs: 42,
      rawToken: 'raw-zapsign-token',
    });

    expect(console.log).toHaveBeenCalledTimes(1);
    const line = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed).toMatchObject({
      event: 'mcp.tool_call',
      tool: 'list_documents',
      result_class: 'ok',
      duration_ms: 42,
    });
    expect(typeof parsed['account_hash']).toBe('string');
    expect(typeof parsed['timestamp']).toBe('string');
    expect(line).not.toContain('raw-zapsign-token');
    expect(parsed['error_code']).toBeUndefined();
  });

  it('includes error_code only for failed calls', async () => {
    await recordToolCallTelemetry({
      tool: 'create_document',
      resultClass: 'error',
      errorCode: 'validation_error',
      durationMs: 7,
      rawToken: 'raw-token',
    });

    const line = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed['error_code']).toBe('validation_error');
  });

  it('persists to the configured recorder', async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    configureToolCallTelemetryRecorder({ record });

    await recordToolCallTelemetry({
      tool: 'get_document',
      resultClass: 'ok',
      durationMs: 5,
      rawToken: 'raw-token',
    });

    expect(record).toHaveBeenCalledTimes(1);
    const event = record.mock.calls[0][0] as { tool: string; accountHash: string };
    expect(event.tool).toBe('get_document');
    expect(event.accountHash).not.toContain('raw-token');
  });

  it('is fail-soft when the recorder throws', async () => {
    const record = vi.fn().mockRejectedValue(new Error('dynamo unavailable'));
    configureToolCallTelemetryRecorder({ record });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(recordToolCallTelemetry({
      tool: 'list_documents',
      resultClass: 'ok',
      durationMs: 1,
      rawToken: 'raw-token',
    })).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalledTimes(1);
    const warnLine = (console.warn as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(JSON.parse(warnLine)).toMatchObject({ event: 'telemetry_drop' });
  });

  it('does not persist when no recorder is configured', async () => {
    await expect(recordToolCallTelemetry({
      tool: 'list_documents',
      resultClass: 'ok',
      durationMs: 1,
      rawToken: 'raw-token',
    })).resolves.toBeUndefined();
  });
});
