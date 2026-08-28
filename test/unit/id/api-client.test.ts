import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdApiClient } from '../../../src/id/api-client.js';

const MOCK_VALIDATION = {
  object: 'validation',
  id: 'val_1',
  type: 'cpf_phone_match',
  status: 'completed',
  result: 'match',
  reason_code: null,
  external_id: null,
  created_at: '2026-08-07T14:03:11Z',
  resolved_at: '2026-08-07T14:03:12Z',
  validation_url: null,
  expires_at: null,
  attempts_remaining: null,
  details: null,
};

describe('IdApiClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should map insufficient_scope without retry', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      error: { code: 'insufficient_scope', message: 'Missing scope' },
    }), { status: 403, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    await expect(client.listValidations({ limit: 1 })).rejects.toMatchObject({
      code: 'insufficient_scope',
      statusCode: 403,
      retryable: false,
    });
  });

  it('should map not_found for missing validation', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      error: { code: 'not_found', message: 'No such resource.' },
    }), { status: 404, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    await expect(client.getValidation('val_missing')).rejects.toMatchObject({
      statusCode: 404,
      retryable: false,
    });
  });

  it('should list validations on success', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      object: 'list',
      has_more: false,
      data: [{ object: 'validation', id: 'val_1' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    const result = await client.listValidations({ limit: 1 });
    expect(result.data).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/validations?limit=1');
  });

  it('should get validation by id', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(MOCK_VALIDATION), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = new IdApiClient('access-token');
    const result = await client.getValidation('val_1');
    expect(result.id).toBe('val_1');
    expect(fetchMock.mock.calls[0][0]).toContain('/validations/val_1');
  });

  it('should create cpf phone match validation with idempotency key', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(MOCK_VALIDATION), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const client = new IdApiClient('access-token');
    await client.createCpfPhoneMatchValidation(
      { cpf: '12345678909', phone: '+5511999998888', consent: true },
      { idempotencyKey: 'idem-1' },
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0][0]).toContain('/validations/cpf-phone-match');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer access-token',
      'Idempotency-Key': 'idem-1',
    });
  });

  it('should create sim swap validation', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      ...MOCK_VALIDATION,
      type: 'sim_swap',
      result: 'no_recent_swap',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    const result = await client.createSimSwapValidation({
      phone: '+5511999998888',
      consent: true,
      max_age_hours: 24,
    });
    expect(result.type).toBe('sim_swap');
    expect(fetchMock.mock.calls[0][0]).toContain('/validations/sim-swap');
  });

  it('should create liveness document match validation', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      ...MOCK_VALIDATION,
      type: 'liveness_document_match',
      status: 'pending',
      result: null,
      validation_url: 'https://id.zapsign.com.br/validate/val_1',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    const result = await client.createLivenessDocumentMatchValidation({ consent: true });
    expect(result.status).toBe('pending');
    expect(fetchMock.mock.calls[0][0]).toContain('/validations/liveness-document-match');
  });

  it('should create phone ownership validation', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      ...MOCK_VALIDATION,
      type: 'phone_ownership',
      status: 'pending',
      result: null,
      attempts_remaining: 3,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    const result = await client.createPhoneOwnershipValidation({
      phone: '+5511999998888',
      consent: true,
    });
    expect(result.type).toBe('phone_ownership');
    expect(fetchMock.mock.calls[0][0]).toContain('/validations/phone-ownership');
  });

  it('should verify validation code', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      ...MOCK_VALIDATION,
      type: 'phone_ownership',
      result: 'passed',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    const result = await client.verifyValidation('val_1', { code: '483920' });
    expect(result.result).toBe('passed');
    expect(fetchMock.mock.calls[0][0]).toContain('/validations/val_1/verify');
  });

  it('should call only validation endpoints', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      object: 'list',
      has_more: false,
      data: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const client = new IdApiClient('access-token');
    await client.listValidations({});
    const requestUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestUrl).toContain('/validations');
    expect(requestUrl).not.toContain('/api-keys');
  });
});
