import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { getMcpAuthContext } from 'agents/mcp';

import { ZapSignClient } from '../../../src/api/client.js';
import { MOCK_AUTH_PROPS } from '../../mocks/zapsign-responses.js';
import { registerPlaceSignaturesTool } from '../../../src/tools/documents/place-signatures.js';
import { registerCreateWebhookTool } from '../../../src/tools/webhooks/create-webhook.js';
import { registerCreatePartnerAccountTool } from '../../../src/tools/partner/create-partner-account.js';
import { registerSignInBatchTool } from '../../../src/tools/signers/sign-in-batch.js';

vi.mock('agents/mcp', () => ({
  getMcpAuthContext: vi.fn(),
}));

vi.mock('../../../src/api/client.js', () => ({
  ZapSignClient: vi.fn(),
}));

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};
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

function withAuth(methods: Record<string, ReturnType<typeof vi.fn>>): void {
  mockAuthContext.mockReturnValue({ props: MOCK_AUTH_PROPS });
  MockClient.mockImplementation(() => methods);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ported api-mcp tools', () => {
  it('should place signatures on a document', async () => {
    const handler = captureHandler(registerPlaceSignaturesTool);
    const mockFn = vi.fn().mockResolvedValue({ ok: true });
    withAuth({ placeSignatures: mockFn });

    const result = await handler({
      doc_token: 'doc-1',
      rubricas: [{ page: 1 }],
    });

    expect(mockFn).toHaveBeenCalledWith({
      doc_token: 'doc-1',
      rubricas: [{ page: 1 }],
    });
    expect(result.isError).toBeUndefined();
  });

  it('should create a webhook', async () => {
    const handler = captureHandler(registerCreateWebhookTool);
    const mockFn = vi.fn().mockResolvedValue({ id: 10 });
    withAuth({ createWebhook: mockFn });

    const result = await handler({
      url: 'https://example.com/hook',
      type: 'doc_signed',
    });

    expect(mockFn).toHaveBeenCalledWith({
      url: 'https://example.com/hook',
      type: 'doc_signed',
    });
    expect(result.content[0].text).toBe(JSON.stringify({ id: 10 }));
  });

  it('should reject partner tools without partner:write', async () => {
    const handler = captureHandler(registerCreatePartnerAccountTool);
    mockAuthContext.mockReturnValue({
      props: {
        ...MOCK_AUTH_PROPS,
        grantedScope: 'documents:read documents:write',
      },
    });

    const result = await handler({
      name: 'Partner',
      email: 'partner@example.com',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('partner:write');
  });

  it('should sign in batch', async () => {
    const handler = captureHandler(registerSignInBatchTool);
    const mockFn = vi.fn().mockResolvedValue({ signed: 2 });
    withAuth({ signInBatch: mockFn });

    const result = await handler({
      user_token: 'user-1',
      signer_tokens: ['signer-1', 'signer-2'],
    });

    expect(mockFn).toHaveBeenCalledWith({
      user_token: 'user-1',
      signer_tokens: ['signer-1', 'signer-2'],
    });
    expect(result.isError).toBeUndefined();
  });
});
