import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZapSignClient, ZapSignSuccess } from '../../../src/api/client.js';
import { ZapSignApiError } from '../../../src/errors/api-error.js';
import {
  MOCK_DOCUMENT,
  MOCK_DOCUMENT_LIST,
  MOCK_CREATED_DOCUMENT,
  MOCK_UPDATED_DOCUMENT,
  MOCK_DELETE_RESPONSE,
  MOCK_ADDED_SIGNER,
  MOCK_SIGNER,
  MOCK_UPDATED_SIGNER,
  MOCK_TEMPLATE,
  MOCK_TEMPLATE_LIST,
  MOCK_ERROR_400,
  MOCK_ERROR_401,
  MOCK_ERROR_403,
  MOCK_ERROR_404,
} from '../../mocks/zapsign-responses.js';

const BASE_URL = 'https://sandbox.api.zapsign.com.br';
const ACCESS_TOKEN = 'test-access-token-abc123';

function mockResponse(
  status: number,
  body: unknown,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

function textResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Headers & URL construction
// ---------------------------------------------------------------------------

describe('ZapSignClient request basics', () => {
  it('should attach a 25-second timeout signal to upstream requests', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await client.listDocuments({});

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(timeoutSpy).toHaveBeenCalledWith(25_000);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('should send Authorization Bearer header on every request', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await client.listDocuments({});

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it('should send Content-Type application/json header', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await client.listDocuments({});

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should build URL as baseUrl + endpoint path', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await client.getDocument('abc-token');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${BASE_URL}/api/v1/docs/abc-token/`);
  });
});

// ---------------------------------------------------------------------------
// Successful response parsing
// ---------------------------------------------------------------------------

describe('ZapSignClient successful response parsing', () => {
  it('should reject an empty success response when a document is required', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(200));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await expect(client.createDocument({
      name: 'Test document',
      url_pdf: 'https://example.com/test.pdf',
      signers: [],
    })).rejects.toMatchObject({
      code: 'invalid_response',
      statusCode: 200,
      retryable: true,
    });
  });

  it('should reject a non-JSON success response when document details are required', async () => {
    fetchMock.mockResolvedValueOnce(textResponse(200, 'document created'));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await expect(client.getDocument('doc-token-1')).rejects.toMatchObject({
      code: 'invalid_response',
      statusCode: 200,
      retryable: true,
    });
  });

  it('should return an empty success sentinel for a 204 response', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(204));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    const result = await client.deleteDocument('doc-token-1');

    expect(result).toEqual(ZapSignSuccess.Empty);
  });

  it('should return an empty success sentinel for an empty 200 response', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(200));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    const result = await client.deleteDocument('doc-token-1');

    expect(result).toEqual(ZapSignSuccess.Empty);
  });

  it('should return an unparsed success sentinel and log PII-safe metadata for non-JSON bodies', async () => {
    const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sensitiveBody = 'Signed contract for Ana Costa: test-access-token-abc123';
    fetchMock.mockResolvedValueOnce(textResponse(200, sensitiveBody));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    const result = await client.deleteDocument('doc-token-1');

    expect(result).toEqual(ZapSignSuccess.Unparsed);
    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    const serialized = JSON.stringify(output);

    expect(output).toMatchObject({
      event: 'client_response_parse_failed',
      level: 'warn',
      method: 'DELETE',
      status_code: 200,
    });
    expect(serialized).not.toContain(sensitiveBody);
    expect(serialized).not.toContain(ACCESS_TOKEN);
  });
});

// ---------------------------------------------------------------------------
// Query string building
// ---------------------------------------------------------------------------

describe('ZapSignClient query string', () => {
  it('should append query params for listDocuments', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await client.listDocuments({ page: 2, status: 'pending' });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('page=2');
    expect(url).toContain('status=pending');
  });

  it('should skip undefined/null params', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await client.listDocuments({ page: 1, status: undefined });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('page=1');
    expect(url).not.toContain('status');
  });

  it('should not append ? when no params provided', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await client.listDocuments({});

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${BASE_URL}/api/v1/docs/`);
  });
});

// ---------------------------------------------------------------------------
// Retry on 429
// ---------------------------------------------------------------------------

describe('ZapSignClient 429 retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should log PII-safe metadata when retrying a rate-limited request', async () => {
    const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, { token: ACCESS_TOKEN, body: 'Sensitive document body' }))
      .mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const result = client.listDocuments({ folder_path: 'Sensitive document folder' });
    await vi.runAllTimersAsync();
    await result;

    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    const serialized = JSON.stringify(output);

    expect(output).toMatchObject({
      event: 'client_retry_429',
      level: 'warn',
      method: 'GET',
      status_code: 429,
    });
    expect(output.error_id).toEqual(expect.any(String));
    expect(serialized).not.toContain(ACCESS_TOKEN);
    expect(serialized).not.toContain('Sensitive document body');
    expect(serialized).not.toContain('Sensitive document folder');
  });

  it('should retry GET once on 429 and return data on success', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, { detail: 'throttled' }))
      .mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const resultPromise = client.listDocuments({});
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(MOCK_DOCUMENT_LIST);
  });

  it('should honor Retry-After seconds before retrying a GET', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockResponse(
          429,
          { detail: 'throttled' },
          { 'Retry-After': '5' },
        ),
      )
      .mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const resultPromise = client.listDocuments({});
    await vi.advanceTimersByTimeAsync(4_999);

    expect(fetchMock).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1);
    await expect(resultPromise).resolves.toEqual(MOCK_DOCUMENT_LIST);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should throw ZapSignApiError with rate_limited after two 429s', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, { detail: 'throttled' }))
      .mockResolvedValueOnce(mockResponse(429, { detail: 'throttled' }));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const result = client.listDocuments({});
    const rateLimitError = expect(result).rejects.toMatchObject({
      code: 'rate_limited',
      statusCode: 429,
      retryable: true,
    });
    await vi.runAllTimersAsync();

    await rateLimitError;
  });

  it('should surface a capped Retry-After wait and retryable guidance for a write', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        429,
        { detail: 'throttled' },
        { 'Retry-After': '9999' },
      ),
    );
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    const result = client.createDocument({
      name: 'Test',
      url_pdf: 'https://example.com/test.pdf',
      signers: [],
    });

    await expect(result).rejects.toThrow(
      'ZapSign is temporarily rate limiting requests. This request is retryable. Wait 60 seconds before trying again.',
    );
    await expect(result).rejects.toMatchObject({ retryable: true });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should parse an HTTP-date Retry-After wait safely', async () => {
    vi.setSystemTime(new Date('2026-07-13T00:00:00.000Z'));
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        429,
        { detail: 'throttled' },
        { 'Retry-After': 'Mon, 13 Jul 2026 00:00:05 GMT' },
      ),
    );
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    const result = client.createDocument({
      name: 'Test',
      url_pdf: 'https://example.com/test.pdf',
      signers: [],
    });

    await expect(result).rejects.toThrow(
      'ZapSign is temporarily rate limiting requests. This request is retryable. Wait 5 seconds before trying again.',
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should not retry POST on 429', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, { detail: 'throttled' }))
      .mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const result = client.createDocument({
      name: 'Test',
      url_pdf: 'https://example.com/test.pdf',
      signers: [],
    });
    const rateLimitError = expect(result).rejects.toMatchObject({
      code: 'rate_limited',
      statusCode: 429,
    });
    await vi.runAllTimersAsync();

    await rateLimitError;
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should not retry PUT on 429', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, { detail: 'throttled' }))
      .mockResolvedValueOnce(mockResponse(200, MOCK_UPDATED_DOCUMENT));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const result = client.updateDocument('doc-token-1', { name: 'Updated Doc' });
    const rateLimitError = expect(result).rejects.toMatchObject({
      code: 'rate_limited',
      statusCode: 429,
    });
    await vi.runAllTimersAsync();

    await rateLimitError;
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should not retry DELETE on 429', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, { detail: 'throttled' }))
      .mockResolvedValueOnce(mockResponse(200, MOCK_DELETE_RESPONSE));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const result = client.deleteDocument('doc-token-1');
    const rateLimitError = expect(result).rejects.toMatchObject({
      code: 'rate_limited',
      statusCode: 429,
    });
    await vi.runAllTimersAsync();

    await rateLimitError;
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Retry on 5xx (GET only)
// ---------------------------------------------------------------------------

describe('ZapSignClient 5xx retry', () => {
  it('should retry GET on 500 and return data on success', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(500, { detail: 'server error' }))
      .mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
    const result = await client.getDocument('token-1');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(MOCK_DOCUMENT);
  });

  it('should NOT retry POST on 500 — throw immediately', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(500, { detail: 'server error' }));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await expect(
      client.createDocument({
        name: 'Test',
        url_pdf: 'https://example.com/test.pdf',
        signers: [],
      }),
    ).rejects.toThrow(ZapSignApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should surface retryable guidance for a 5xx write failure', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(503, { detail: 'unavailable' }));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    const result = client.createDocument({
      name: 'Test',
      url_pdf: 'https://example.com/test.pdf',
      signers: [],
    });

    await expect(result).rejects.toThrow(
      'ZapSign is temporarily unavailable. This request is retryable. Please try again.',
    );
    await expect(result).rejects.toMatchObject({ retryable: true });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should throw on second 5xx for GET', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(502, { detail: 'bad gateway' }))
      .mockResolvedValueOnce(mockResponse(503, { detail: 'unavailable' }));

    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await expect(client.getDocument('token-1')).rejects.toThrow(ZapSignApiError);
  });
});

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

describe('ZapSignClient error mapping', () => {
  it('should map an upstream timeout to a typed actionable error', async () => {
    const timeoutError = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValueOnce(timeoutError);
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await expect(client.listDocuments({})).rejects.toMatchObject({
      name: 'ZapSignApiError',
      code: 'upstream_timeout',
      statusCode: 504,
      retryable: true,
      message: 'ZapSign did not respond in time. Please try again.',
    });
  });

  it('should log a PII-safe upstream error for an unretryable response', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const documentBody = 'Confidential contract for Ana Costa';
    fetchMock.mockResolvedValueOnce(
      mockResponse(400, { token: ACCESS_TOKEN, detail: documentBody }),
    );
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    await expect(
      client.createDocument({
        name: documentBody,
        url_pdf: 'https://example.com/test.pdf',
        signers: [],
      }),
    ).rejects.toThrow(ZapSignApiError);

    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    const serialized = JSON.stringify(output);

    expect(output).toMatchObject({
      event: 'client_upstream_error',
      level: 'error',
      error_class: 'ZapSignApiError',
      method: 'POST',
      status_code: 400,
    });
    expect(output.error_id).toEqual(expect.any(String));
    expect(serialized).not.toContain(ACCESS_TOKEN);
    expect(serialized).not.toContain(documentBody);
  });

  it('should throw bad_request on 400', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(400, MOCK_ERROR_400));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    try {
      await client.createDocument({ name: '', url_pdf: '', signers: [] });
    } catch (error) {
      expect(error).toBeInstanceOf(ZapSignApiError);
      const apiErr = error as ZapSignApiError;
      expect(apiErr.code).toBe('bad_request');
      expect(apiErr.statusCode).toBe(400);
      expect(apiErr.retryable).toBe(false);
    }
  });

  it('should throw unauthorized on 401', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(401, MOCK_ERROR_401));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    try {
      await client.listDocuments({});
    } catch (error) {
      expect(error).toBeInstanceOf(ZapSignApiError);
      const apiErr = error as ZapSignApiError;
      expect(apiErr.code).toBe('unauthorized');
      expect(apiErr.statusCode).toBe(401);
    }
  });

  it('should throw forbidden on 403', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(403, MOCK_ERROR_403));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    try {
      await client.listDocuments({});
    } catch (error) {
      expect(error).toBeInstanceOf(ZapSignApiError);
      const apiErr = error as ZapSignApiError;
      expect(apiErr.code).toBe('forbidden');
      expect(apiErr.statusCode).toBe(403);
    }
  });

  it('should throw not_found on 404', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(404, MOCK_ERROR_404));
    const client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);

    try {
      await client.getDocument('nonexistent');
    } catch (error) {
      expect(error).toBeInstanceOf(ZapSignApiError);
      const apiErr = error as ZapSignApiError;
      expect(apiErr.code).toBe('not_found');
      expect(apiErr.statusCode).toBe(404);
    }
  });
});

// ---------------------------------------------------------------------------
// Document methods
// ---------------------------------------------------------------------------

describe('ZapSignClient document methods', () => {
  let client: ZapSignClient;

  beforeEach(() => {
    client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
  });

  it('listDocuments should GET /api/v1/docs/', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT_LIST));
    const result = await client.listDocuments({ page: 1 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');
    expect(url).toContain('/api/v1/docs/');
    expect(result).toEqual(MOCK_DOCUMENT_LIST);
  });

  it('getDocument should GET /api/v1/docs/:token/', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DOCUMENT));
    const result = await client.getDocument('doc-token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');
    expect(url).toBe(`${BASE_URL}/api/v1/docs/doc-token-1/`);
    expect(result).toEqual(MOCK_DOCUMENT);
  });

  it('createDocument should POST /api/v1/docs/ with body', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    const body = { name: 'New Doc', url_pdf: 'https://example.com/test.pdf', signers: [] };
    const result = await client.createDocument(body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(url).toBe(`${BASE_URL}/api/v1/docs/`);
    expect(JSON.parse(init.body as string)).toEqual({
      ...body,
      metadata: [{ key: 'origin', value: 'mcp' }],
    });
    expect(result).toEqual(MOCK_CREATED_DOCUMENT);
  });

  it('createDocument should POST metadata origin mcp', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createDocument({
      name: 'New Doc',
      url_pdf: 'https://example.com/test.pdf',
      signers: [],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.metadata).toEqual([{ key: 'origin', value: 'mcp' }]);
  });

  it('createDocument should keep origin mcp when request already has metadata', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createDocument({
      name: 'New Doc',
      url_pdf: 'https://example.com/test.pdf',
      signers: [],
      metadata: [
        { key: 'campaign', value: 'q3' },
        { key: 'origin', value: 'web' },
      ],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.metadata).toEqual([
      { key: 'campaign', value: 'q3' },
      { key: 'origin', value: 'mcp' },
    ]);
  });

  it('updateDocument should PUT /api/v1/docs/:token/ with body', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_UPDATED_DOCUMENT));
    const body = {
      name: 'Updated Doc',
      date_limit_to_sign: '2026-12-31',
      folder_path: '/contracts/2026/',
      folder_token: 'folder-123',
      extra_docs: [{ token: 'extra-123', name: 'Updated attachment' }],
    };
    const result = await client.updateDocument('doc-token-1', body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    expect(url).toBe(`${BASE_URL}/api/v1/docs/doc-token-1/`);
    expect(JSON.parse(init.body as string)).toEqual(body);
    expect(result).toEqual(MOCK_UPDATED_DOCUMENT);
  });

  it('deleteDocument should DELETE /api/v1/docs/:token/', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DELETE_RESPONSE));
    const result = await client.deleteDocument('doc-token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('DELETE');
    expect(url).toBe(`${BASE_URL}/api/v1/docs/doc-token-1/`);
    expect(result).toEqual(MOCK_DELETE_RESPONSE);
  });
});

// ---------------------------------------------------------------------------
// Signer methods
// ---------------------------------------------------------------------------

describe('ZapSignClient signer methods', () => {
  let client: ZapSignClient;

  beforeEach(() => {
    client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
  });

  it('addSigner should POST /api/v1/docs/:docToken/add-signer/ with body', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_ADDED_SIGNER));
    const body = { name: 'Ana Costa', email: 'ana@example.com', auth_mode: 'assinaturaTela' as const };
    const result = await client.addSigner('doc-token-1', body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(url).toBe(`${BASE_URL}/api/v1/docs/doc-token-1/add-signer/`);
    expect(JSON.parse(init.body as string)).toEqual(body);
    expect(result).toEqual(MOCK_ADDED_SIGNER);
  });

  it('getSigner should GET /api/v1/signers/:token/', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_SIGNER));
    const result = await client.getSigner('signer-token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');
    expect(url).toBe(`${BASE_URL}/api/v1/signers/signer-token-1/`);
    expect(result).toEqual(MOCK_SIGNER);
  });

  it('updateSigner should POST /api/v1/signers/:token/ with body', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_UPDATED_SIGNER));
    const body = { name: 'Maria Santos' };
    const result = await client.updateSigner('signer-token-1', body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(url).toBe(`${BASE_URL}/api/v1/signers/signer-token-1/`);
    expect(JSON.parse(init.body as string)).toEqual(body);
    expect(result).toEqual(MOCK_UPDATED_SIGNER);
  });

  it('deleteSigner should DELETE /api/v1/signer/:token/remove/', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_DELETE_RESPONSE));
    const result = await client.deleteSigner('signer-token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('DELETE');
    expect(url).toBe(`${BASE_URL}/api/v1/signer/signer-token-1/remove/`);
    expect(result).toEqual(MOCK_DELETE_RESPONSE);
  });
});

// ---------------------------------------------------------------------------
// Template methods
// ---------------------------------------------------------------------------

describe('ZapSignClient template methods', () => {
  let client: ZapSignClient;

  beforeEach(() => {
    client = new ZapSignClient(BASE_URL, ACCESS_TOKEN);
  });

  it('listTemplates should GET /api/v1/templates/ with query params', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_TEMPLATE_LIST));
    const result = await client.listTemplates({ page: 1 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');
    expect(url).toContain('/api/v1/templates/');
    expect(url).toContain('page=1');
    expect(result).toEqual(MOCK_TEMPLATE_LIST);
  });

  it('getTemplate should GET /api/v1/templates/:token/', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_TEMPLATE));
    const result = await client.getTemplate('tpl-token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');
    expect(url).toBe(`${BASE_URL}/api/v1/templates/tpl-token-1/`);
    expect(result).toEqual(MOCK_TEMPLATE);
  });

  it('createFromTemplate should map template_token to the template_id API body field', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    const request = {
      template_token: 'tpl-token-1',
      signer_name: 'Test Signer',
      data: { '{{nome_completo}}': 'Maria Silva', '{{endereco}}': 'Rua A 123' },
    };
    const result = await client.createFromTemplate(request);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(url).toBe(`${BASE_URL}/api/v1/models/create-doc/`);
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.template_id).toBe('tpl-token-1');
    expect(sentBody.signer_name).toBe('Test Signer');
    expect(sentBody.data).toEqual([
      { de: '{{nome_completo}}', para: 'Maria Silva' },
      { de: '{{endereco}}', para: 'Rua A 123' },
    ]);
    expect(result).toEqual(MOCK_CREATED_DOCUMENT);
  });

  it('createFromTemplate should send empty data array when data record is empty', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createFromTemplate({
      template_token: 'tpl-token-1',
      signer_name: 'Test Signer',
      data: {},
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.data).toEqual([]);
  });

  it('createFromTemplate should transform single data entry to de/para array', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createFromTemplate({
      template_token: 'tpl-token-1',
      signer_name: 'Test Signer',
      data: { '{{name}}': 'John' },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.data).toEqual([{ de: '{{name}}', para: 'John' }]);
  });

  it('createFromTemplate should include send_automatic_email in body when provided', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createFromTemplate({
      template_token: 'tpl-token-1',
      signer_name: 'Test Signer',
      data: {},
      send_automatic_email: true,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.send_automatic_email).toBe(true);
  });

  it('createFromTemplate should include send_automatic_whatsapp in body when provided', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createFromTemplate({
      template_token: 'tpl-token-1',
      signer_name: 'Test Signer',
      data: {},
      send_automatic_whatsapp: true,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.send_automatic_whatsapp).toBe(true);
  });

  it('createFromTemplate should omit notification fields when not provided', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createFromTemplate({
      template_token: 'tpl-token-1',
      signer_name: 'Test Signer',
      data: {},
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.send_automatic_email).toBeUndefined();
    expect(sentBody.send_automatic_whatsapp).toBeUndefined();
  });

  it('createFromTemplate should POST metadata origin mcp', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, MOCK_CREATED_DOCUMENT));
    await client.createFromTemplate({
      template_token: 'tpl-token-1',
      signer_name: 'Test Signer',
      data: {},
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.metadata).toEqual([{ key: 'origin', value: 'mcp' }]);
  });
});
