import { vi } from 'vitest';

import type { Env } from '../../../src/types/env.js';

export const TEST_ENCRYPTION_KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));

type StoredValue = {
  value: string;
};

export function createMockKv(initial: Record<string, string> = {}): KVNamespace {
  const store = new Map<string, StoredValue>(
    Object.entries(initial).map(([key, value]) => [key, { value }]),
  );

  return {
    get: vi.fn(async (key: string, options?: { type?: string }) => {
      const value = store.get(key)?.value;
      if (value === undefined) {
        return null;
      }
      return options?.type === 'json' ? JSON.parse(value) : value;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, { value });
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}

export function createMockEnv(overrides?: Partial<Env>): Env {
  return {
    OAUTH_KV: createMockKv(),
    ZAPSIGN_API_URL: 'https://sandbox.api.zapsign.com.br',
    COOKIE_ENCRYPTION_KEY: 'cookie-key',
    ID_TOKEN_ENCRYPTION_KEY: TEST_ENCRYPTION_KEY,
    ENVIRONMENT: 'sandbox',
    GA4_MEASUREMENT_ID: '',
    CLARITY_PROJECT_ID: '',
    OAUTH_PROVIDER: {
      parseAuthRequest: vi.fn(),
      completeAuthorization: vi.fn(async () => ({ redirectTo: 'https://client.example/callback' })),
      lookupClient: vi.fn(),
    } as unknown as Env['OAUTH_PROVIDER'],
    ...overrides,
  };
}

export function createMockJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.sig`;
}

export function mockTokenResponse(
  overrides?: Partial<{
    access_token: string;
    refresh_token: string;
    scope: string;
    expires_in: number;
    error: string;
    error_description: string;
  }>,
): Response {
  return new Response(JSON.stringify({
    access_token: createMockJwt({ sub: 'user-a', exp: Math.floor(Date.now() / 1000) + 900 }),
    refresh_token: 'refresh-token-a',
    scope: 'validations:read validations:write',
    expires_in: 900,
    ...overrides,
  }), {
    status: overrides?.error ? 400 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
