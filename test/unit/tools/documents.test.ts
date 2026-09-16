import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMcpAuthContext } from 'agents/mcp';
import { ZapSignClient } from '../../../src/api/client.js';
import { ZapSignMcpError } from '../../../src/errors/base.js';
import {
  MOCK_AUTH_PROPS,
  MOCK_DOCUMENT_LIST,
  MOCK_DOCUMENT,
  MOCK_CREATED_DOCUMENT,
  MOCK_UPDATED_DOCUMENT,
  MOCK_DELETE_RESPONSE,
} from '../../mocks/zapsign-responses.js';
import { registerListDocumentsTool } from '../../../src/tools/documents/list-documents.js';
import { registerGetDocumentTool } from '../../../src/tools/documents/get-document.js';
import { registerCreateDocumentTool } from '../../../src/tools/documents/create-document.js';
import { registerUpdateDocumentTool } from '../../../src/tools/documents/update-document.js';
import { registerDeleteDocumentTool } from '../../../src/tools/documents/delete-document.js';
import { sanitizeToolResult } from '../../../src/utils/tool-response.js';
import {
  filterDocument,
  filterDocumentList,
  OWNER_CREATE_OPTIONS,
  OWNER_READ_OPTIONS,
} from '../../../src/utils/response-filter.js';

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
// list_documents
// ---------------------------------------------------------------------------

describe('list_documents', () => {
  const handler = captureHandler(registerListDocumentsTool);

  it('should return paginated documents on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_DOCUMENT_LIST);
    withAuth({ listDocuments: mockFn });

    const result = await handler({ page: 1 });

    expect(mockFn).toHaveBeenCalledWith({ page: 1 });
    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify(
          sanitizeToolResult(filterDocumentList(MOCK_DOCUMENT_LIST, OWNER_READ_OPTIONS)),
        ),
      }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ page: 1 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when documents:read not granted', async () => {
    withScope('signers:read');

    const result = await handler({ page: 1 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('documents:read');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Rate limit exceeded', 'rate_limited', 429, true),
    );
    withAuth({ listDocuments: mockFn });

    const result = await handler({ page: 1 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Rate limit exceeded');
  });

  it('should return generic error on unknown error', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const unsafeMessage = 'network timeout for api-token-123 and Confidential Contract';
    const mockFn = vi.fn().mockRejectedValue(new Error(unsafeMessage));
    withAuth({ listDocuments: mockFn });

    const result = await handler({ page: 1 });

    expectUnexpectedError(result);

    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    const serialized = JSON.stringify(output);
    const correlationId = result.content[0].text.match(/\[([a-f0-9]{12})\]/)?.[1];

    expect(output).toMatchObject({
      event: 'tool_error',
      level: 'error',
      tool: 'list_documents',
      error_class: 'Error',
    });
    expect(output.error_id).toEqual(expect.any(String));
    expect(output.error_id).toBe(correlationId);
    expect(output.status_code).toBeUndefined();
    expect(serialized).not.toContain(unsafeMessage);
    expect(serialized).not.toContain(MOCK_AUTH_PROPS.zapSignApiToken);
  });
});

// ---------------------------------------------------------------------------
// get_document
// ---------------------------------------------------------------------------

describe('get_document', () => {
  const handler = captureHandler(registerGetDocumentTool);

  it('should return document details on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_DOCUMENT);
    withAuth({ getDocument: mockFn });

    const result = await handler({ doc_token: 'abc-token' });

    expect(mockFn).toHaveBeenCalledWith('abc-token');
    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify(
          sanitizeToolResult(filterDocument(MOCK_DOCUMENT, OWNER_READ_OPTIONS)),
        ),
      }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ doc_token: 'abc-token' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when documents:read not granted', async () => {
    withScope('signers:read');

    const result = await handler({ doc_token: 'abc-token' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('documents:read');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Not found', 'not_found', 404, false),
    );
    withAuth({ getDocument: mockFn });

    const result = await handler({ doc_token: 'bad-token' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Not found');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new TypeError('unexpected'));
    withAuth({ getDocument: mockFn });

    const result = await handler({ doc_token: 'abc-token' });

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// create_document
// ---------------------------------------------------------------------------

describe('create_document', () => {
  const handler = captureHandler(registerCreateDocumentTool);
  const createArgs = {
    name: 'Test Contract',
    url_pdf: 'https://example.com/test.pdf',
    signers: [{ name: 'Signer One' }],
  };

  it('should return created document on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_CREATED_DOCUMENT);
    withAuth({ createDocument: mockFn });

    const result = await handler(createArgs);

    expect(mockFn).toHaveBeenCalledWith(createArgs);
    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify(
          sanitizeToolResult(filterDocument(MOCK_CREATED_DOCUMENT, OWNER_CREATE_OPTIONS)),
        ),
      }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler(createArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when documents:write not granted', async () => {
    withScope('documents:read');

    const result = await handler(createArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('documents:write');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Invalid payload', 'bad_request', 400, false),
    );
    withAuth({ createDocument: mockFn });

    const result = await handler(createArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Invalid payload');
  });

  it('should identify invalid input fields without calling ZapSign', async () => {
    const mockFn = vi.fn();
    withAuth({ createDocument: mockFn });

    const result = await handler({
      url_pdf: 'https://example.com/test.pdf',
      signers: [{ name: 'Signer One' }],
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('name:');
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fetch failed'));
    withAuth({ createDocument: mockFn });

    const result = await handler(createArgs);

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// update_document
// ---------------------------------------------------------------------------

describe('update_document', () => {
  const handler = captureHandler(registerUpdateDocumentTool);

  it('should pass documented update fields separately to client', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_UPDATED_DOCUMENT);
    withAuth({ updateDocument: mockFn });

    const result = await handler({
      doc_token: 'abc-token',
      name: 'Updated Name',
      date_limit_to_sign: '2026-12-31',
      folder_path: '/contracts/2026/',
      folder_token: 'folder-123',
      extra_docs: [{ token: 'extra-123', name: 'Updated attachment' }],
    });

    expect(mockFn).toHaveBeenCalledWith('abc-token', {
      name: 'Updated Name',
      date_limit_to_sign: '2026-12-31',
      folder_path: '/contracts/2026/',
      folder_token: 'folder-123',
      extra_docs: [{ token: 'extra-123', name: 'Updated attachment' }],
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(sanitizeToolResult(MOCK_UPDATED_DOCUMENT)) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ doc_token: 'abc-token', name: 'Updated' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when documents:write not granted', async () => {
    withScope('documents:read');

    const result = await handler({ doc_token: 'abc-token', name: 'Updated' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('documents:write');
  });

  it('should reject undocumented update fields without calling ZapSign', async () => {
    const mockFn = vi.fn();
    withAuth({ updateDocument: mockFn });

    const result = await handler({
      doc_token: 'abc-token',
      name: 'Updated name',
      lang: 'en',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unrecognized key');
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Document not found', 'not_found', 404, false),
    );
    withAuth({ updateDocument: mockFn });

    const result = await handler({ doc_token: 'bad-token', name: 'Updated' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Document not found');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('crash'));
    withAuth({ updateDocument: mockFn });

    const result = await handler({ doc_token: 'abc-token', name: 'Updated' });

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// delete_document
// ---------------------------------------------------------------------------

describe('delete_document', () => {
  const handler = captureHandler(registerDeleteDocumentTool);

  it('should return delete confirmation on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_DELETE_RESPONSE);
    withAuth({ deleteDocument: mockFn });

    const result = await handler({ doc_token: 'abc-token' });

    expect(mockFn).toHaveBeenCalledWith('abc-token');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(sanitizeToolResult(MOCK_DELETE_RESPONSE)) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ doc_token: 'abc-token' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when documents:write not granted', async () => {
    withScope('documents:read');

    const result = await handler({ doc_token: 'abc-token' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('documents:write');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Forbidden', 'forbidden', 403, false),
    );
    withAuth({ deleteDocument: mockFn });

    const result = await handler({ doc_token: 'abc-token' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Forbidden');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('oops'));
    withAuth({ deleteDocument: mockFn });

    const result = await handler({ doc_token: 'abc-token' });

    expectUnexpectedError(result);
  });
});
