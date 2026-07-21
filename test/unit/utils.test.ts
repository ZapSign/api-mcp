import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from '../../src/utils/logger.js';
import { formatToolSuccess, formatToolError, MAX_RESPONSE_CHARS } from '../../src/utils/tool-response.js';
import { requireScope } from '../../src/utils/scope.js';
import { AuthError } from '../../src/errors/auth-error.js';
import { escapeAttr, escapeHtml } from '../../src/utils/html.js';

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

describe('HTML escaping', () => {
  const payload = `\"><img src=x onerror='alert(1)'>&`;

  it('should escape HTML text payloads', () => {
    expect(escapeHtml(payload)).toBe('&quot;&gt;&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;');
  });

  it('should escape quoted attribute payloads', () => {
    expect(escapeAttr(payload)).toBe('&quot;&gt;&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;');
  });
});

// ---------------------------------------------------------------------------
// log()
// ---------------------------------------------------------------------------

describe('log', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should output JSON with event and ts fields', () => {
    log('test_event');

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.event).toBe('test_event');
    expect(output.ts).toBeDefined();
  });

  it('should include additional data fields', () => {
    log('document_created', { docId: 'abc-123', userId: 42 });

    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.event).toBe('document_created');
    expect(output.docId).toBe('abc-123');
    expect(output.userId).toBe(42);
  });

  it('should output ts in ISO 8601 format', () => {
    log('some_event');

    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    const parsed = new Date(output.ts);
    expect(parsed.toISOString()).toBe(output.ts);
  });
});

// ---------------------------------------------------------------------------
// formatToolSuccess()
// ---------------------------------------------------------------------------

describe('formatToolSuccess', () => {
  it('should return MCP-compliant success content block', () => {
    const result = formatToolSuccess('{"id":1}');

    expect(result).toEqual({
      content: [{ type: 'text', text: '{"id":1}' }],
    });
  });

  it('should not have isError property', () => {
    const result = formatToolSuccess('ok');
    expect(result).not.toHaveProperty('isError');
  });

  it('should not truncate text under the limit', () => {
    const text = 'a'.repeat(MAX_RESPONSE_CHARS);
    const result = formatToolSuccess(text);
    expect(result.content[0].text).toBe(text);
  });

  it('should truncate text exceeding the limit', () => {
    const text = 'x'.repeat(MAX_RESPONSE_CHARS + 500);
    const result = formatToolSuccess(text);
    expect(result.content[0].text.length).toBeLessThan(text.length);
    expect(result.content[0].text.length).toBeLessThanOrEqual(MAX_RESPONSE_CHARS);
    expect(result.content[0].text).toContain('[Response truncated.');
  });

  it('should append truncation notice when truncated', () => {
    const text = 'z'.repeat(MAX_RESPONSE_CHARS + 1);
    const result = formatToolSuccess(text);
    expect(result.content[0].text).toContain('[Response truncated.');
  });

  it('should retain valid JSON and complete results when truncating a list response', () => {
    const response = {
      count: 500,
      next: 'https://sandbox.api.zapsign.com.br/api/v1/docs/?page=2',
      previous: null,
      results: Array.from({ length: 500 }, (_, index) => ({
        token: `token-${index}`,
        name: `Document ${index}`,
        description: 'x'.repeat(250),
      })),
    };
    const serialized = JSON.stringify(response);

    expect(serialized.length).toBeGreaterThan(MAX_RESPONSE_CHARS);

    const result = formatToolSuccess(serialized, {
      truncationNotice: 'Document results were truncated. Use page parameters to continue.',
    });
    const text = result.content[0].text;
    const parsed = JSON.parse(text);

    expect(text.length).toBeLessThanOrEqual(MAX_RESPONSE_CHARS);
    expect(parsed.results.length).toBeLessThan(response.results.length);
    expect(parsed.results.at(-1)).toEqual(response.results.at(parsed.results.length - 1));
    expect(parsed.truncation).toEqual({
      removedResults: response.results.length - parsed.results.length,
      notice: 'Document results were truncated. Use page parameters to continue.',
    });
  });

  it('should preserve pagination metadata when truncating a large paginated response', () => {
    const paginatedResponse = {
      count: 500,
      next: 'https://sandbox.api.zapsign.com.br/api/v1/docs/?page=2',
      previous: null,
      results: Array.from({ length: 300 }, (_, i) => ({
        open_id: i,
        token: `token-${i}-${'x'.repeat(200)}`,
        status: 'pending',
        name: `Document ${i}`,
      })),
    };

    const serialized = JSON.stringify(paginatedResponse);
    expect(serialized.length).toBeGreaterThan(MAX_RESPONSE_CHARS);

    const result = formatToolSuccess(serialized);
    const text = result.content[0].text;

    expect(text).toContain('[Response truncated.');
    expect(text).toContain('"count":500');
    expect(text).toContain('"next":"https://sandbox.api.zapsign.com.br/api/v1/docs/?page=2"');
    expect(text).toContain('"previous":null');
  });
});

// ---------------------------------------------------------------------------
// formatToolError()
// ---------------------------------------------------------------------------

describe('formatToolError', () => {
  it('should return MCP-compliant error content block', () => {
    const result = formatToolError('Something went wrong');

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Something went wrong' }],
      isError: true,
    });
  });

  it('should have isError set to true', () => {
    const result = formatToolError('error');
    expect(result.isError).toBe(true);
  });

  it('should include a bracketed correlation ID in unexpected-error guidance', () => {
    const result = formatToolError(
      'An unexpected error occurred. Please try again or contact support with error ID [a1b2c3d4e5f6].',
    );

    expect(result.content[0].text).toContain('[a1b2c3d4e5f6]');
  });
});

// ---------------------------------------------------------------------------
// requireScope()
// ---------------------------------------------------------------------------

describe('requireScope', () => {
  it('should not throw when required scope is present', () => {
    expect(() => requireScope('documents:read', 'documents:read')).not.toThrow();
  });

  it('should not throw when required scope is among multiple granted scopes', () => {
    const granted = 'documents:read documents:write signers:read';
    expect(() => requireScope(granted, 'documents:write')).not.toThrow();
  });

  it('should throw AuthError when scope is missing', () => {
    const granted = 'documents:read';

    expect(() => requireScope(granted, 'documents:write')).toThrow(AuthError);

    try {
      requireScope(granted, 'documents:write');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError);
      const authErr = error as AuthError;
      expect(authErr.code).toBe('insufficient_scope');
      expect(authErr.statusCode).toBe(403);
      expect(authErr.message).toContain('documents:write');
      expect(authErr.message).toContain('Reconnect the ZapSign integration');
      expect(authErr.message).toContain('grant');
    }
  });

  it('should throw when grantedScope is undefined', () => {
    expect(() => requireScope(undefined, 'documents:read')).toThrow(AuthError);
  });

  it('should throw when grantedScope is empty string', () => {
    expect(() => requireScope('', 'documents:read')).toThrow(AuthError);
  });
});
