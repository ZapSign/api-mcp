import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { ZapSignMcpError } from '../../src/errors/base.js';
import { ZapSignApiError } from '../../src/errors/api-error.js';
import { AuthError } from '../../src/errors/auth-error.js';
import { ValidationError } from '../../src/errors/validation-error.js';
import {
  MOCK_ERROR_400,
  MOCK_ERROR_401,
  MOCK_ERROR_403,
  MOCK_ERROR_404,
  MOCK_ERROR_429,
  MOCK_ERROR_500,
} from '../mocks/zapsign-responses.js';

// ---------------------------------------------------------------------------
// ZapSignMcpError (base)
// ---------------------------------------------------------------------------

describe('ZapSignMcpError', () => {
  it('should set all properties from constructor', () => {
    const error = new ZapSignMcpError('test message', 'test_code', 500, true);

    expect(error.message).toBe('test message');
    expect(error.code).toBe('test_code');
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(true);
  });

  it('should have name ZapSignMcpError', () => {
    const error = new ZapSignMcpError('msg', 'code', 400, false);
    expect(error.name).toBe('ZapSignMcpError');
  });

  it('should be an instance of Error', () => {
    const error = new ZapSignMcpError('msg', 'code', 400, false);
    expect(error).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// ZapSignApiError
// ---------------------------------------------------------------------------

describe('ZapSignApiError', () => {
  it('should have name ZapSignApiError', () => {
    const error = ZapSignApiError.fromResponse(400, MOCK_ERROR_400);
    expect(error.name).toBe('ZapSignApiError');
  });

  it('should inherit from ZapSignMcpError', () => {
    const error = ZapSignApiError.fromResponse(400, MOCK_ERROR_400);
    expect(error).toBeInstanceOf(ZapSignMcpError);
    expect(error).toBeInstanceOf(Error);
  });

  describe('fromResponse status mapping', () => {
    it('should map 400 to bad_request (not retryable)', () => {
      const error = ZapSignApiError.fromResponse(400, MOCK_ERROR_400);
      expect(error.code).toBe('bad_request');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
    });

    it('should map 401 to unauthorized (not retryable)', () => {
      const error = ZapSignApiError.fromResponse(401, MOCK_ERROR_401);
      expect(error.code).toBe('unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
    });

    it('should map 403 to forbidden (not retryable)', () => {
      const error = ZapSignApiError.fromResponse(403, MOCK_ERROR_403);
      expect(error.code).toBe('forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.retryable).toBe(false);
    });

    it('should map 404 to not_found (not retryable)', () => {
      const error = ZapSignApiError.fromResponse(404, MOCK_ERROR_404);
      expect(error.code).toBe('not_found');
      expect(error.statusCode).toBe(404);
      expect(error.retryable).toBe(false);
    });

    it('should map 429 to rate_limited (retryable)', () => {
      const error = ZapSignApiError.fromResponse(429, MOCK_ERROR_429);
      expect(error.code).toBe('rate_limited');
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
    });

    it('should map 500 to upstream_error (retryable)', () => {
      const error = ZapSignApiError.fromResponse(500, MOCK_ERROR_500);
      expect(error.code).toBe('upstream_error');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should map unknown 5xx to upstream_error (retryable)', () => {
      const error = ZapSignApiError.fromResponse(502, { detail: 'Bad Gateway' });
      expect(error.code).toBe('upstream_error');
      expect(error.statusCode).toBe(502);
      expect(error.retryable).toBe(true);
    });
  });

  describe('fromResponse messages', () => {
    it('should expose a rate-limit wait and retryable guidance', () => {
      const error = ZapSignApiError.fromResponse(
        429,
        { detail: 'Sensitive request detail' },
        12,
      );

      expect(error.message).toBe(
        'ZapSign is temporarily rate limiting requests. This request is retryable. Wait 12 seconds before trying again.',
      );
      expect(error.retryable).toBe(true);
      expect(error.message).not.toContain('Sensitive request detail');
    });

    it('should use the rejected API token recovery path for an upstream 401', () => {
      const expected = AuthError.apiTokenRejected();
      const recoveryPath = vi.spyOn(AuthError, 'apiTokenRejected');

      const error = ZapSignApiError.fromResponse(401, MOCK_ERROR_401);

      expect(recoveryPath).toHaveBeenCalledOnce();
      expect(error.message).toBe(expected.message);
      expect(error.code).toBe(expected.code);
    });

    it('should tell users to reconnect after an upstream 401 without exposing the response body', () => {
      const upstreamBody = { detail: 'Token secret-value for Ana Costa' };
      const error = ZapSignApiError.fromResponse(401, upstreamBody);

      expect(error.message).toContain('reconnect');
      expect(error.message).not.toContain(JSON.stringify(upstreamBody));
      expect(error.message).not.toContain('secret-value');
      expect(error.message).not.toContain('Ana Costa');
    });

    it('should tell users to reconnect after an upstream 403 without exposing the response body', () => {
      const upstreamBody = 'Forbidden for document token confidential-token';
      const error = ZapSignApiError.fromResponse(403, upstreamBody);

      expect(error.message).toContain('reconnect');
      expect(error.message).not.toContain(upstreamBody);
      expect(error.message).not.toContain('confidential-token');
    });
  });
});

// ---------------------------------------------------------------------------
// AuthError
// ---------------------------------------------------------------------------

describe('AuthError', () => {
  it('should inherit from ZapSignMcpError', () => {
    const error = AuthError.apiTokenRejected();
    expect(error).toBeInstanceOf(ZapSignMcpError);
    expect(error).toBeInstanceOf(Error);
  });

  describe('apiTokenRejected', () => {
    it('should return correct code and status', () => {
      const error = AuthError.apiTokenRejected();
      expect(error.name).toBe('AuthError');
      expect(error.code).toBe('unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
    });

    it('should have an actionable token recovery message', () => {
      const error = AuthError.apiTokenRejected();
      expect(error.message).toContain('reconnect');
      expect(error.message).not.toMatch(/email|password/i);
    });
  });

  describe('insufficientScope', () => {
    it('should return correct code and status', () => {
      const error = AuthError.insufficientScope('documents:read');
      expect(error.name).toBe('AuthError');
      expect(error.code).toBe('insufficient_scope');
      expect(error.statusCode).toBe(403);
      expect(error.retryable).toBe(false);
    });

    it('should include the required scope in the message', () => {
      const error = AuthError.insufficientScope('documents:write');
      expect(error.message).toContain('documents:write');
    });
  });
});

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  it('should inherit from ZapSignMcpError', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const error = ValidationError.fromZodError(result.error);
    expect(error).toBeInstanceOf(ZapSignMcpError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have fixed code and statusCode', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const error = ValidationError.fromZodError(result.error);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('validation_error');
    expect(error.statusCode).toBe(400);
    expect(error.retryable).toBe(false);
  });

  it('should extract field errors from Zod issues', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });
    const result = schema.safeParse({ name: 42, email: 'bad' });

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const error = ValidationError.fromZodError(result.error);
    expect(error.fieldErrors).toHaveProperty('name');
    expect(error.fieldErrors).toHaveProperty('email');
  });

  it('should use _root for root-level validation issues', () => {
    const schema = z.string().min(1);
    const result = schema.safeParse('');

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const error = ValidationError.fromZodError(result.error);
    expect(error.fieldErrors).toHaveProperty('_root');
  });

  it('should build a human-readable summary in message', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const error = ValidationError.fromZodError(result.error);
    expect(error.message).toContain('Validation failed');
    expect(error.message).toContain('name');
  });
});
