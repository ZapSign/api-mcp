import { ZapSignMcpError } from '../errors/base.js';
import { IdApiBaseUrl, IdApiPaths } from './constants.js';
import type {
  CpfPhoneMatchValidationInput,
  IdApiErrorBody,
  IdRequestOptions,
  LivenessDocumentMatchValidationInput,
  ListValidationsParams,
  PhoneOwnershipValidationInput,
  SimSwapValidationInput,
  ValidationListResponse,
  ValidationResponse,
  ValidationVerificationInput,
} from './types.js';

const IdApiErrorCode = {
  InvalidToken: 'invalid_token',
  InsufficientScope: 'insufficient_scope',
  IdempotencyInProgress: 'idempotency_in_progress',
} as const;

export class IdApiError extends ZapSignMcpError {
  constructor(message: string, code: string, statusCode: number, retryable: boolean) {
    super(message, code, statusCode, retryable);
    this.name = 'IdApiError';
  }

  static fromResponse(status: number, body: IdApiErrorBody): IdApiError {
    const code = body.error?.code ?? 'api_error';
    const message = body.error?.message ?? 'ZapSign ID request failed.';
    const mapped = mapStatusError(status, code, message);
    if (mapped) {
      return mapped;
    }
    if (status >= 500) {
      return new IdApiError(message, code, status, true);
    }
    return new IdApiError(message, code, status, false);
  }
}

function mapStatusError(status: number, code: string, message: string): IdApiError | null {
  if (status === 401 && code === IdApiErrorCode.InvalidToken) {
    return new IdApiError(
      'Your ZapSign ID access token is invalid. Reconnect the ZapSign ID integration and try again.',
      code,
      status,
      false,
    );
  }
  if (status === 403 && code === IdApiErrorCode.InsufficientScope) {
    return new IdApiError(
      'This action requires additional ZapSign ID permissions. Reconnect and grant validations access.',
      code,
      status,
      false,
    );
  }
  if (status === 402) {
    return new IdApiError(
      'Your ZapSign ID account has insufficient balance for this validation.',
      code,
      status,
      false,
    );
  }
  if (status === 404) {
    return new IdApiError(
      'The validation was not found. Check the validation id and try again.',
      code,
      status,
      false,
    );
  }
  if (status === 409 && code === IdApiErrorCode.IdempotencyInProgress) {
    return new IdApiError(
      'A request with the same idempotency key is still in progress. Wait and retry with the same key.',
      code,
      status,
      true,
    );
  }
  if (status === 429) {
    return new IdApiError(message, code, status, true);
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseErrorBody(value: unknown): IdApiErrorBody {
  if (!isRecord(value)) {
    return {};
  }
  return value as IdApiErrorBody;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return '';
  }
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return `?${search.toString()}`;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  return JSON.parse(text);
}

function buildHeaders(accessToken: string, idempotencyKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return headers;
}

/**
 * ZapSign ID API client for validation operations.
 */
export class IdApiClient {
  constructor(private readonly accessToken: string) {}

  /**
   * Lists validations from the ZapSign ID API.
   *
   * @param params - Pagination query parameters
   * @returns Validation list page
   */
  async listValidations(params: ListValidationsParams = {}): Promise<ValidationListResponse> {
    const queryParams: Record<string, string | number | undefined> = {
      limit: params.limit,
      after: params.after,
      before: params.before,
    };
    return this.request<ValidationListResponse>('GET', `${IdApiPaths.Validations}${buildQuery(queryParams)}`);
  }

  /**
   * Retrieves a validation by id.
   *
   * @param id - Validation identifier
   * @returns Validation resource
   */
  async getValidation(id: string): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('GET', IdApiPaths.validationById(id));
  }

  /**
   * Creates a CPF and phone match validation.
   *
   * @param input - Validation payload
   * @param options - Optional idempotency key
   * @returns Completed validation
   */
  async createCpfPhoneMatchValidation(
    input: CpfPhoneMatchValidationInput,
    options: IdRequestOptions = {},
  ): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('POST', IdApiPaths.CpfPhoneMatch, input, options);
  }

  /**
   * Creates a SIM swap validation.
   *
   * @param input - Validation payload
   * @param options - Optional idempotency key
   * @returns Completed validation
   */
  async createSimSwapValidation(
    input: SimSwapValidationInput,
    options: IdRequestOptions = {},
  ): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('POST', IdApiPaths.SimSwap, input, options);
  }

  /**
   * Creates a hosted liveness and document match validation.
   *
   * @param input - Validation payload
   * @param options - Optional idempotency key
   * @returns Pending validation with validation_url
   */
  async createLivenessDocumentMatchValidation(
    input: LivenessDocumentMatchValidationInput,
    options: IdRequestOptions = {},
  ): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('POST', IdApiPaths.LivenessDocumentMatch, input, options);
  }

  /**
   * Creates a phone ownership validation that sends a WhatsApp code.
   *
   * @param input - Validation payload
   * @param options - Optional idempotency key
   * @returns Pending validation awaiting verification
   */
  async createPhoneOwnershipValidation(
    input: PhoneOwnershipValidationInput,
    options: IdRequestOptions = {},
  ): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('POST', IdApiPaths.PhoneOwnership, input, options);
  }

  /**
   * Verifies a phone ownership validation code.
   *
   * @param id - Validation identifier
   * @param input - Verification code payload
   * @param options - Optional idempotency key
   * @returns Validation after verification attempt
   */
  async verifyValidation(
    id: string,
    input: ValidationVerificationInput,
    options: IdRequestOptions = {},
  ): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('POST', IdApiPaths.validationVerify(id), input, options);
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    options: IdRequestOptions = {},
  ): Promise<T> {
    const headers = buildHeaders(this.accessToken, options.idempotencyKey);
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(`${IdApiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
    const parsedBody = await parseJsonResponse(response);
    if (!response.ok) {
      throw IdApiError.fromResponse(response.status, parseErrorBody(parsedBody));
    }
    return parsedBody as T;
  }
}

/**
 * Executes an API call with one refresh retry on invalid_token.
 *
 * @param accessToken - Current OAuth access token
 * @param execute - API operation using the access token
 * @param refresh - Refreshes tokens and returns a new access token
 */
export async function withAccessTokenRetry<T>(
  accessToken: string,
  execute: (token: string) => Promise<T>,
  refresh: () => Promise<string>,
): Promise<T> {
  try {
    return await execute(accessToken);
  } catch (error) {
    if (!(error instanceof IdApiError) || error.statusCode !== 401 || error.code !== IdApiErrorCode.InvalidToken) {
      throw error;
    }
  }

  const refreshedToken = await refresh();
  return execute(refreshedToken);
}
