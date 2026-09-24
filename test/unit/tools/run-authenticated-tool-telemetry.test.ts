import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMcpAuthContext } from 'agents/mcp';

import { ZapSignClient } from '../../../src/api/client.js';
import { MOCK_AUTH_PROPS } from '../../mocks/zapsign-responses.js';
import { registerPlaceSignaturesTool } from '../../../src/tools/documents/place-signatures.js';
import { registerCreateWebhookTool } from '../../../src/tools/webhooks/create-webhook.js';
import { configureToolCallTelemetryRecorder } from '../../../src/telemetry/tool-call-recorder.js';

vi.mock('agents/mcp', () => ({
  getMcpAuthContext: vi.fn(),
}));

vi.mock('../../../src/api/client.js', () => ({
  ZapSignClient: vi.fn(),
}));

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

function captureHandler(registerFn: (server: unknown) => void): ToolHandler {
  let handler!: ToolHandler;
  const mockServer = {
    registerTool: (_name: string, _config: unknown, h: ToolHandler) => {
      handler = h;
    },
  };
  registerFn(mockServer);
  return handler;
}

const mockAuthContext = getMcpAuthContext as unknown as ReturnType<typeof vi.fn>;
const MockClient = ZapSignClient as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  configureToolCallTelemetryRecorder(null);
});

function toolCallEvents(): Array<Record<string, unknown>> {
  const calls = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls;
  return calls
    .map((call) => JSON.parse(call[0] as string) as Record<string, unknown>)
    .filter((line) => line['event'] === 'mcp.tool_call');
}

describe('runAuthenticatedTool telemetry', () => {
  it('records a read/write-neutral success event via the real tool choke point', async () => {
    mockAuthContext.mockReturnValue({ props: MOCK_AUTH_PROPS });
    MockClient.mockImplementation(() => ({ placeSignatures: vi.fn().mockResolvedValue({ ok: true }) }));

    const handler = captureHandler(registerPlaceSignaturesTool);
    await handler({ doc_token: 'doc-1', rubricas: [{ page: 1 }] });

    const events = toolCallEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ tool: 'place_signatures', result_class: 'ok' });
    expect(JSON.stringify(events[0])).not.toContain(MOCK_AUTH_PROPS.zapSignApiToken);
  });

  it('records an error event with an error_code when the tool call throws', async () => {
    mockAuthContext.mockReturnValue({
      props: { ...MOCK_AUTH_PROPS, grantedScope: 'documents:read documents:write' },
    });

    const handler = captureHandler(registerCreateWebhookTool);
    await handler({ url: 'not-a-url', type: 'doc_signed' });

    const events = toolCallEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ tool: 'create_webhook', result_class: 'error' });
    expect(events[0]['error_code']).toBeDefined();
  });

  it('does not emit telemetry when authentication is missing', async () => {
    mockAuthContext.mockReturnValue({ props: null });

    const handler = captureHandler(registerPlaceSignaturesTool);
    const result = await handler({ doc_token: 'doc-1', rubricas: [{ page: 1 }] });

    expect(result.isError).toBe(true);
    expect(toolCallEvents()).toHaveLength(0);
  });

  it('still returns the tool result when the telemetry recorder fails', async () => {
    configureToolCallTelemetryRecorder({ record: vi.fn().mockRejectedValue(new Error('dynamo down')) });
    mockAuthContext.mockReturnValue({ props: MOCK_AUTH_PROPS });
    MockClient.mockImplementation(() => ({ placeSignatures: vi.fn().mockResolvedValue({ ok: true }) }));

    const handler = captureHandler(registerPlaceSignaturesTool);
    const result = await handler({ doc_token: 'doc-1', rubricas: [{ page: 1 }] });

    expect(result.isError).toBeUndefined();
    expect(toolCallEvents()).toHaveLength(1);
  });
});
