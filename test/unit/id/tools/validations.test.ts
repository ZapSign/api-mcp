import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdApiClient } from '../../../../src/id/api-client.js';
import { configureStdioIdAuth, clearStdioIdAuth } from '../../../../src/id/get-id-auth.js';
import { registerCreateCpfPhoneMatchValidationTool } from '../../../../src/id/tools/create-cpf-phone-match-validation.js';
import { registerCreateLivenessDocumentMatchValidationTool } from '../../../../src/id/tools/create-liveness-document-match-validation.js';
import { registerCreatePhoneOwnershipValidationTool } from '../../../../src/id/tools/create-phone-ownership-validation.js';
import { registerCreateSimSwapValidationTool } from '../../../../src/id/tools/create-sim-swap-validation.js';
import { registerGetValidationTool } from '../../../../src/id/tools/get-validation.js';
import { registerListValidationsTool } from '../../../../src/id/tools/list-validations.js';
import { registerVerifyValidationTool } from '../../../../src/id/tools/verify-validation.js';
import * as tokenService from '../../../../src/id/token-service.js';
import { createMockEnv } from '../test-helpers.js';

vi.mock('../../../../src/id/api-client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/id/api-client.js')>();
  return {
    ...actual,
    IdApiClient: vi.fn(),
  };
});

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

function captureHandler(
  registerFn: (server: unknown, deps: { env: ReturnType<typeof createMockEnv> }) => void,
): ToolHandler {
  let handler!: ToolHandler;
  const mockServer = {
    registerTool: (_name: string, _config: unknown, h: ToolHandler) => {
      handler = h;
    },
  };
  registerFn(mockServer, { env: createMockEnv() });
  return handler;
}

const MockIdApiClient = IdApiClient as unknown as ReturnType<typeof vi.fn>;

const MOCK_VALIDATION = {
  object: 'validation',
  id: 'val_1',
  type: 'cpf_phone_match',
  status: 'completed',
  result: 'match',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  configureStdioIdAuth({ userId: 'user-a', grantedScope: 'validations:read validations:write' });
  vi.spyOn(tokenService, 'getValidAccessToken').mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    scope: 'validations:read validations:write',
    expiresAt: Date.now() + 900_000,
  });
  MockIdApiClient.mockImplementation(() => ({
    listValidations: vi.fn().mockResolvedValue({ object: 'list', has_more: false, data: [MOCK_VALIDATION] }),
    getValidation: vi.fn().mockResolvedValue(MOCK_VALIDATION),
    createCpfPhoneMatchValidation: vi.fn().mockResolvedValue(MOCK_VALIDATION),
    createSimSwapValidation: vi.fn().mockResolvedValue({ ...MOCK_VALIDATION, type: 'sim_swap' }),
    createLivenessDocumentMatchValidation: vi.fn().mockResolvedValue({
      ...MOCK_VALIDATION,
      type: 'liveness_document_match',
      status: 'pending',
    }),
    createPhoneOwnershipValidation: vi.fn().mockResolvedValue({
      ...MOCK_VALIDATION,
      type: 'phone_ownership',
      status: 'pending',
    }),
    verifyValidation: vi.fn().mockResolvedValue({ ...MOCK_VALIDATION, type: 'phone_ownership', result: 'passed' }),
  }));
});

afterEach(() => {
  clearStdioIdAuth();
  vi.restoreAllMocks();
});

describe('ID validation tools', () => {
  it('should require authentication for list_validations', async () => {
    clearStdioIdAuth();
    const handler = captureHandler(registerListValidationsTool);
    const result = await handler({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should enforce validations:read for list_validations', async () => {
    configureStdioIdAuth({ userId: 'user-a', grantedScope: 'validations:write' });
    const handler = captureHandler(registerListValidationsTool);
    const result = await handler({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('validations:read');
  });

  it('should list validations on success', async () => {
    const handler = captureHandler(registerListValidationsTool);
    const result = await handler({ limit: 1 });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toMatchObject({ object: 'list' });
  });

  it('should get validation by id', async () => {
    const handler = captureHandler(registerGetValidationTool);
    const result = await handler({ id: 'val_1' });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toMatchObject({ id: 'val_1' });
  });

  it('should enforce validations:write for create_cpf_phone_match_validation', async () => {
    configureStdioIdAuth({ userId: 'user-a', grantedScope: 'validations:read' });
    const handler = captureHandler(registerCreateCpfPhoneMatchValidationTool);
    const result = await handler({
      cpf: '12345678909',
      phone: '+5511999998888',
      consent: true,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('validations:write');
  });

  it('should create cpf phone match validation', async () => {
    const handler = captureHandler(registerCreateCpfPhoneMatchValidationTool);
    const result = await handler({
      cpf: '12345678909',
      phone: '+5511999998888',
      consent: true,
    });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toMatchObject({ type: 'cpf_phone_match' });
  });

  it('should create sim swap validation', async () => {
    const handler = captureHandler(registerCreateSimSwapValidationTool);
    const result = await handler({ phone: '+5511999998888', consent: true });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toMatchObject({ type: 'sim_swap' });
  });

  it('should create liveness document match validation', async () => {
    const handler = captureHandler(registerCreateLivenessDocumentMatchValidationTool);
    const result = await handler({ consent: true });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toMatchObject({ type: 'liveness_document_match' });
  });

  it('should create phone ownership validation', async () => {
    const handler = captureHandler(registerCreatePhoneOwnershipValidationTool);
    const result = await handler({ phone: '+5511999998888', consent: true });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toMatchObject({ type: 'phone_ownership' });
  });

  it('should verify validation code', async () => {
    const handler = captureHandler(registerVerifyValidationTool);
    const result = await handler({ id: 'val_1', code: '483920' });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toMatchObject({ result: 'passed' });
  });

  it('should reject invalid verify code format', async () => {
    const handler = captureHandler(registerVerifyValidationTool);
    const result = await handler({ id: 'val_1', code: 'abc' });
    expect(result.isError).toBe(true);
  });
});
