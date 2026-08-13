import { ZapSignApiError } from '../errors/api-error.js';
import { logError, logWarning } from '../utils/logger.js';
import { withAgentDocumentMetadata } from './agent-document-metadata.js';
import { ZAPSIGN_ENDPOINTS } from './endpoints.js';
import type {
  AddExtraDocumentFromTemplateRequest,
  AddExtraDocumentRequest,
  AddTimestampRequest,
  CreateDocumentRequest,
  CreateFromTemplateApiBody,
  CreateFromTemplateRequest,
  CreatePartnerAccountRequest,
  CreateSignerInput,
  CreateWebhookHeaderRequest,
  CreateWebhookRequest,
  ListDocumentsParams,
  ListTemplatesParams,
  PlaceSignaturesRequest,
  ReorderEnvelopeDocumentsRequest,
  ReprocessDocumentsWebhooksRequest,
  SignInBatchRequest,
  UpdateDocumentRequest,
  UpdatePartnerPaymentStatusRequest,
  UpdateSignerRequest,
  ZapSignDocument,
  ZapSignPaginatedResponse,
  ZapSignSigner,
  ZapSignTemplate,
} from '../types/zapsign.js';

const RATE_LIMIT_DELAY_MS = 2000;
const SERVER_ERROR_DELAY_MS = 1000;
const UNKNOWN_ERROR_CLASS = 'unknown_error';
const RetryAfter = {
  Header: 'Retry-After',
  MaxSeconds: 60,
} as const;
const UpstreamTimeout = {
  DurationMs: 25_000,
  StatusCode: 504,
  Code: 'upstream_timeout',
  Message: 'ZapSign did not respond in time. Please try again.',
} as const;
const AbortErrorName = {
  Aborted: 'AbortError',
  TimedOut: 'TimeoutError',
} as const;
export const ZapSignSuccess = {
  Empty: { success: true, body: 'empty' },
  Unparsed: { success: true, body: 'unparsed' },
} as const;

type ZapSignSuccessResponse =
  (typeof ZapSignSuccess)[keyof typeof ZapSignSuccess];
const SuccessResponseContract = {
  Json: 'json',
  EmptyAllowed: 'empty_allowed',
} as const;
type SuccessResponseContract =
  (typeof SuccessResponseContract)[keyof typeof SuccessResponseContract];

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) {
    return '';
  }
  const searchParams = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  );
  return `?${searchParams.toString()}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}

function parseRetryAfterSeconds(value: string): number | undefined {
  const normalized = value.trim().replace(/^0+/, '');
  if (!/^\d+$/.test(normalized)) {
    return undefined;
  }

  if (normalized.length > String(RetryAfter.MaxSeconds).length) {
    return RetryAfter.MaxSeconds;
  }

  const seconds = Number(normalized);
  if (seconds <= 0) {
    return undefined;
  }

  return Math.min(seconds, RetryAfter.MaxSeconds);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const seconds = parseRetryAfterSeconds(value);
  if (seconds !== undefined) {
    return seconds;
  }

  const retryDate = Date.parse(value);
  if (Number.isNaN(retryDate)) {
    return undefined;
  }

  const remainingSeconds = Math.ceil((retryDate - Date.now()) / 1000);
  if (remainingSeconds <= 0) {
    return undefined;
  }

  return Math.min(remainingSeconds, RetryAfter.MaxSeconds);
}

function getRateLimitDelayMs(retryAfterSeconds: number | undefined): number {
  if (retryAfterSeconds === undefined) {
    return RATE_LIMIT_DELAY_MS;
  }

  return retryAfterSeconds * 1000;
}

function getErrorClass(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }
  return UNKNOWN_ERROR_CLASS;
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.name === AbortErrorName.Aborted ||
    error.name === AbortErrorName.TimedOut
  );
}

function createTimeoutError(): ZapSignApiError {
  return new ZapSignApiError(
    UpstreamTimeout.Message,
    UpstreamTimeout.Code,
    UpstreamTimeout.StatusCode,
    true,
  );
}

function preserveResponseContract<T>(response: ZapSignSuccessResponse): T {
  // ZapSign response bodies are untyped at the network boundary.
  return response as unknown as T;
}

function createInvalidResponseError(statusCode: number): ZapSignApiError {
  return new ZapSignApiError(
    'ZapSign returned an invalid success response. Please try again.',
    'invalid_response',
    statusCode,
    true,
  );
}

async function parseErrorBody(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class ZapSignClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  /**
   * Core HTTP method with retry logic for 429 and 5xx (GET only).
   * @param method - HTTP verb
   * @param path - API path (from ZAPSIGN_ENDPOINTS)
   * @param body - Optional request body
   * @returns Parsed JSON response, or an explicit delete sentinel when the endpoint allows a non-JSON success body.
   * @throws ZapSignApiError on non-retryable or exhausted-retry failures
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    responseContract: SuccessResponseContract = SuccessResponseContract.Json,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.executeFetch(url, method, body);

    if (response.ok) {
      return this.parseSuccessfulResponse<T>(response, method, responseContract);
    }

    if (response.status === 429 && method === 'GET') {
      const retryAfterSeconds = parseRetryAfter(
        response.headers.get(RetryAfter.Header),
      );
      return this.retryRateLimit<T>(url, method, body, retryAfterSeconds, responseContract);
    }

    if (isServerError(response.status) && method === 'GET') {
      return this.retryServerError<T>(url, method, response.status, responseContract);
    }

    throw await this.createUpstreamError(response, method);
  }

  private async retryRateLimit<T>(
    url: string,
    method: string,
    body?: unknown,
    retryAfterSeconds?: number,
    responseContract: SuccessResponseContract = SuccessResponseContract.Json,
  ): Promise<T> {
    this.logRetry('client_retry_429', method, 429);
    await delay(getRateLimitDelayMs(retryAfterSeconds));
    const retryResponse = await this.executeFetch(url, method, body);

    if (retryResponse.ok) {
      return this.parseSuccessfulResponse<T>(retryResponse, method, responseContract);
    }

    throw await this.createUpstreamError(
      retryResponse,
      method,
      retryAfterSeconds,
    );
  }

  private async retryServerError<T>(
    url: string,
    method: string,
    statusCode: number,
    responseContract: SuccessResponseContract = SuccessResponseContract.Json,
  ): Promise<T> {
    this.logRetry('client_retry_5xx', method, statusCode);
    await delay(SERVER_ERROR_DELAY_MS);
    const retryResponse = await this.executeFetch(url, method);

    if (retryResponse.ok) {
      return this.parseSuccessfulResponse<T>(retryResponse, method, responseContract);
    }

    throw await this.createUpstreamError(retryResponse, method);
  }

  private logRetry(
    event: 'client_retry_429' | 'client_retry_5xx',
    method: string,
    statusCode: number,
  ): void {
    logWarning(event, {
      method,
      status_code: statusCode,
      error_id: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
    });
  }

  private logUpstreamError(
    method: string,
    statusCode: number | undefined,
    errorClass: string,
  ): void {
    logError('client_upstream_error', {
      method,
      status_code: statusCode,
      error_class: errorClass,
      error_id: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
    });
  }

  private async parseSuccessfulResponse<T>(
    response: Response,
    method: string,
    responseContract: SuccessResponseContract,
  ): Promise<T> {
    const text = await response.text();
    if (response.status === 204 || text.trim().length === 0) {
      if (responseContract === SuccessResponseContract.EmptyAllowed) {
        return preserveResponseContract<T>(ZapSignSuccess.Empty);
      }

      const error = createInvalidResponseError(response.status);
      this.logUpstreamError(method, response.status, error.name);
      throw error;
    }

    try {
      // ZapSign response bodies are untyped at the network boundary.
      return JSON.parse(text) as T;
    } catch (error) {
      this.logResponseParseFailure(method, response.status, error);
      if (responseContract === SuccessResponseContract.EmptyAllowed) {
        return preserveResponseContract<T>(ZapSignSuccess.Unparsed);
      }

      const invalidResponseError = createInvalidResponseError(response.status);
      this.logUpstreamError(method, response.status, invalidResponseError.name);
      throw invalidResponseError;
    }
  }

  private logResponseParseFailure(
    method: string,
    statusCode: number,
    error: unknown,
  ): void {
    logWarning('client_response_parse_failed', {
      method,
      status_code: statusCode,
      error_class: getErrorClass(error),
      error_id: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
    });
  }

  private async createUpstreamError(
    response: Response,
    method: string,
    fallbackRetryAfterSeconds?: number,
  ): Promise<ZapSignApiError> {
    const errorBody = await parseErrorBody(response);
    const retryAfterSeconds =
      parseRetryAfter(response.headers.get(RetryAfter.Header)) ??
      fallbackRetryAfterSeconds;
    const error = ZapSignApiError.fromResponse(
      response.status,
      errorBody,
      retryAfterSeconds,
    );
    this.logUpstreamError(method, response.status, error.name);
    return error;
  }

  private async executeFetch(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<Response> {
    const signal = AbortSignal.timeout(UpstreamTimeout.DurationMs);
    try {
      return await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (error) {
      if (isTimeoutError(error)) {
        const timeoutError = createTimeoutError();
        this.logUpstreamError(
          method,
          timeoutError.statusCode,
          timeoutError.name,
        );
        throw timeoutError;
      }
      this.logUpstreamError(method, undefined, getErrorClass(error));
      throw error;
    }
  }

  // -- Documents --------------------------------------------------------------

  /** @returns Paginated list of documents matching the given filters. */
  listDocuments(
    params: ListDocumentsParams,
  ): Promise<ZapSignPaginatedResponse<ZapSignDocument>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    return this.request('GET', `${ZAPSIGN_ENDPOINTS.documents}${qs}`);
  }

  /** @returns Full document details including signers. */
  getDocument(token: string): Promise<ZapSignDocument> {
    return this.request('GET', ZAPSIGN_ENDPOINTS.documentDetail(token));
  }

  /** @returns The newly created document. */
  createDocument(data: CreateDocumentRequest): Promise<ZapSignDocument> {
    const { async: useAsync, ...body } = data;
    const path = useAsync
      ? ZAPSIGN_ENDPOINTS.documentsAsync
      : ZAPSIGN_ENDPOINTS.documents;
    return this.request('POST', path, {
      ...body,
      metadata: withAgentDocumentMetadata(body.metadata),
    });
  }

  /** @returns The updated document. */
  updateDocument(
    token: string,
    data: UpdateDocumentRequest,
  ): Promise<ZapSignDocument> {
    return this.request(
      'PUT',
      ZAPSIGN_ENDPOINTS.documentDetail(token),
      data,
    );
  }

  /** @returns Deletion confirmation from ZapSign. */
  deleteDocument(token: string): Promise<unknown> {
    return this.request(
      'DELETE',
      ZAPSIGN_ENDPOINTS.documentDetail(token),
      undefined,
      SuccessResponseContract.EmptyAllowed,
    );
  }

  // -- Signers ----------------------------------------------------------------

  /** @returns The newly added signer. */
  addSigner(docToken: string, data: CreateSignerInput): Promise<ZapSignSigner> {
    return this.request(
      'POST',
      ZAPSIGN_ENDPOINTS.documentAddSigner(docToken),
      data,
    );
  }

  /** @returns Signer details. */
  getSigner(token: string): Promise<ZapSignSigner> {
    return this.request('GET', ZAPSIGN_ENDPOINTS.signerDetail(token));
  }

  /** @returns The updated signer. */
  updateSigner(
    token: string,
    data: UpdateSignerRequest,
  ): Promise<ZapSignSigner> {
    return this.request('POST', ZAPSIGN_ENDPOINTS.signerDetail(token), data);
  }

  /** @returns Deletion confirmation from ZapSign. */
  deleteSigner(token: string): Promise<unknown> {
    return this.request(
      'DELETE',
      ZAPSIGN_ENDPOINTS.signerRemove(token),
      undefined,
      SuccessResponseContract.EmptyAllowed,
    );
  }

  // -- Templates --------------------------------------------------------------

  /** @returns Paginated list of templates. */
  listTemplates(
    params: ListTemplatesParams,
  ): Promise<ZapSignPaginatedResponse<ZapSignTemplate>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    return this.request('GET', `${ZAPSIGN_ENDPOINTS.templates}${qs}`);
  }

  /** @returns Template details including signers and inputs. */
  getTemplate(token: string): Promise<ZapSignTemplate> {
    return this.request('GET', ZAPSIGN_ENDPOINTS.templateDetail(token));
  }

  /** @returns The document created from the template. */
  createFromTemplate(
    request: CreateFromTemplateRequest,
  ): Promise<ZapSignDocument> {
    const body: CreateFromTemplateApiBody = {
      template_id: request.template_token,
      signer_name: request.signer_name,
      data: Object.entries(request.data).map(([de, para]) => ({ de, para })),
      send_automatic_email: request.send_automatic_email,
      send_automatic_whatsapp: request.send_automatic_whatsapp,
      metadata: withAgentDocumentMetadata(),
    };
    const path = request.async
      ? ZAPSIGN_ENDPOINTS.templateCreateDocAsync
      : ZAPSIGN_ENDPOINTS.templateCreateDoc;
    return this.request('POST', path, body);
  }

  placeSignatures(request: PlaceSignaturesRequest): Promise<unknown> {
    const { doc_token: docToken, rubricas } = request;
    return this.request(
      'POST',
      ZAPSIGN_ENDPOINTS.documentPlaceSignatures(docToken),
      { rubricas },
    );
  }

  addExtraDocument(request: AddExtraDocumentRequest): Promise<unknown> {
    const { doc_token: docToken, name, url_pdf: urlPdf } = request;
    return this.request(
      'POST',
      ZAPSIGN_ENDPOINTS.documentUploadExtraDoc(docToken),
      { name, url_pdf: urlPdf },
    );
  }

  addExtraDocumentFromTemplate(
    request: AddExtraDocumentFromTemplateRequest,
  ): Promise<unknown> {
    const { doc_token: docToken, template_id: templateId, data } = request;
    return this.request(
      'POST',
      ZAPSIGN_ENDPOINTS.templateUploadExtraDoc(docToken),
      { template_id: templateId, data },
    );
  }

  signInBatch(request: SignInBatchRequest): Promise<unknown> {
    return this.request('POST', ZAPSIGN_ENDPOINTS.signBatch, request);
  }

  createWebhook(request: CreateWebhookRequest): Promise<unknown> {
    return this.request('POST', ZAPSIGN_ENDPOINTS.webhooks, request);
  }

  deleteWebhook(webhookId: number): Promise<unknown> {
    return this.request(
      'DELETE',
      ZAPSIGN_ENDPOINTS.webhookDelete,
      { id: webhookId },
      SuccessResponseContract.EmptyAllowed,
    );
  }

  createWebhookHeader(request: CreateWebhookHeaderRequest): Promise<unknown> {
    return this.request('POST', ZAPSIGN_ENDPOINTS.webhookHeaders, {
      id: request.webhook_id,
      headers: request.headers,
    });
  }

  deleteWebhookHeader(headerId: number): Promise<unknown> {
    return this.request(
      'DELETE',
      ZAPSIGN_ENDPOINTS.webhookHeaderDelete,
      { id: headerId },
      SuccessResponseContract.EmptyAllowed,
    );
  }

  addTimestamp(request: AddTimestampRequest): Promise<unknown> {
    return this.request('POST', ZAPSIGN_ENDPOINTS.timestamp, request);
  }

  reorderEnvelopeDocuments(
    request: ReorderEnvelopeDocumentsRequest,
  ): Promise<unknown> {
    const { envelope_token: envelopeToken, documents_order: documentsOrder } =
      request;
    return this.request(
      'PUT',
      ZAPSIGN_ENDPOINTS.envelopeReorder(envelopeToken),
      { documents_order: documentsOrder },
    );
  }

  reprocessDocumentsWebhooks(
    request: ReprocessDocumentsWebhooksRequest,
  ): Promise<unknown> {
    return this.request('POST', ZAPSIGN_ENDPOINTS.reprocess, request);
  }

  createPartnerAccount(
    request: CreatePartnerAccountRequest,
  ): Promise<unknown> {
    return this.request('POST', ZAPSIGN_ENDPOINTS.partners, request);
  }

  updatePartnerPaymentStatus(
    request: UpdatePartnerPaymentStatusRequest,
  ): Promise<unknown> {
    const { partner_token: partnerToken, ...body } = request;
    return this.request(
      'PUT',
      ZAPSIGN_ENDPOINTS.partnerPaymentStatus(partnerToken),
      body,
    );
  }
}
