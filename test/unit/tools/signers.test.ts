import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMcpAuthContext } from 'agents/mcp';
import { ZapSignClient } from '../../../src/api/client.js';
import { ZapSignMcpError } from '../../../src/errors/base.js';
import {
  MOCK_AUTH_PROPS,
  MOCK_ADDED_SIGNER,
  MOCK_SIGNER,
  MOCK_UPDATED_SIGNER,
  MOCK_DELETE_RESPONSE,
} from '../../mocks/zapsign-responses.js';
import { registerAddSignerTool } from '../../../src/tools/signers/add-signer.js';
import { registerGetSignerTool } from '../../../src/tools/signers/get-signer.js';
import { registerUpdateSignerTool } from '../../../src/tools/signers/update-signer.js';
import { registerDeleteSignerTool } from '../../../src/tools/signers/delete-signer.js';

vi.mock('agents/mcp', () => ({
  getMcpAuthContext: vi.fn(),
}));

vi.mock('../../../src/api/client.js', () => ({
  ZapSignClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

function expectUnexpectedError(result: ToolResult): void {
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toMatch(
    /An unexpected error occurred\. Please try again or contact support with error ID \[([a-f0-9]{12})\]\./,
  );
}

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

function withNoAuth(): void {
  mockAuthContext.mockReturnValue(null);
}

function withScope(scope: string): void {
  mockAuthContext.mockReturnValue({
    props: { ...MOCK_AUTH_PROPS, grantedScope: scope },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// add_signer
// ---------------------------------------------------------------------------

describe('add_signer', () => {
  const handler = captureHandler(registerAddSignerTool);
  const addArgs = {
    doc_token: 'doc-tk',
    name: 'Ana Costa',
    email: 'ana@example.com',
  };

  it('should pass doc_token and signer data separately to client', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_ADDED_SIGNER);
    withAuth({ addSigner: mockFn });

    const result = await handler(addArgs);

    expect(mockFn).toHaveBeenCalledWith('doc-tk', {
      name: 'Ana Costa',
      email: 'ana@example.com',
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_ADDED_SIGNER) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler(addArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when signers:write not granted', async () => {
    withScope('signers:read');

    const result = await handler(addArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('signers:write');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Document not found', 'not_found', 404, false),
    );
    withAuth({ addSigner: mockFn });

    const result = await handler(addArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Document not found');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('connection lost'));
    withAuth({ addSigner: mockFn });

    const result = await handler(addArgs);

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// get_signer
// ---------------------------------------------------------------------------

describe('get_signer', () => {
  const handler = captureHandler(registerGetSignerTool);

  it('should return signer details on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_SIGNER);
    withAuth({ getSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk' });

    expect(mockFn).toHaveBeenCalledWith('sig-tk');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_SIGNER) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ signer_token: 'sig-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when signers:read not granted', async () => {
    withScope('documents:read');

    const result = await handler({ signer_token: 'sig-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('signers:read');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Not found', 'not_found', 404, false),
    );
    withAuth({ getSigner: mockFn });

    const result = await handler({ signer_token: 'bad-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Not found');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new TypeError('unexpected'));
    withAuth({ getSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk' });

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// update_signer
// ---------------------------------------------------------------------------

describe('update_signer', () => {
  const handler = captureHandler(registerUpdateSignerTool);

  it('should pass signer_token and update data separately to client', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_UPDATED_SIGNER);
    withAuth({ updateSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk', name: 'Maria Santos' });

    expect(mockFn).toHaveBeenCalledWith('sig-tk', { name: 'Maria Santos' });
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_UPDATED_SIGNER) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ signer_token: 'sig-tk', name: 'Updated' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when signers:write not granted', async () => {
    withScope('signers:read');

    const result = await handler({ signer_token: 'sig-tk', name: 'Updated' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('signers:write');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Signer already signed', 'bad_request', 400, false),
    );
    withAuth({ updateSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk', name: 'Updated' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Signer already signed');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('timeout'));
    withAuth({ updateSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk', name: 'Updated' });

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// delete_signer
// ---------------------------------------------------------------------------

describe('delete_signer', () => {
  const handler = captureHandler(registerDeleteSignerTool);

  it('should return delete confirmation on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_DELETE_RESPONSE);
    withAuth({ deleteSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk' });

    expect(mockFn).toHaveBeenCalledWith('sig-tk');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_DELETE_RESPONSE) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ signer_token: 'sig-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when signers:write not granted', async () => {
    withScope('signers:read');

    const result = await handler({ signer_token: 'sig-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('signers:write');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Forbidden', 'forbidden', 403, false),
    );
    withAuth({ deleteSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Forbidden');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('oops'));
    withAuth({ deleteSigner: mockFn });

    const result = await handler({ signer_token: 'sig-tk' });

    expectUnexpectedError(result);
  });
});
