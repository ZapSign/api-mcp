/**
 * OAuth registration endpoint — Dynamic Client Registration (RFC 7591).
 *
 * POST /register → 201 { client_id, client_secret, ... }
 * GET  /register/<clientId>  (CIMD) → 200 client metadata doc
 */
import type { KvStore } from '../../store/kv-store.js';
import type { StoredClient } from './types.js';
import { OAuthStore } from './store.js';
import { logError } from '../../utils/logger.js';

const CLIENT_REGISTRATION_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

function generateClientId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseOptionalString(body: Record<string, unknown>, key: string): string | undefined {
  return typeof body[key] === 'string' ? (body[key] as string) : undefined;
}

function parseRegistrationBody(body: unknown): Partial<StoredClient> {
  if (!isRecord(body)) {
    return {};
  }

  const redirectUris = isStringArray(body['redirect_uris']) ? body['redirect_uris'] : [];
  const grantTypes = isStringArray(body['grant_types'])
    ? body['grant_types']
    : ['authorization_code', 'refresh_token'];
  const responseTypes = isStringArray(body['response_types']) ? body['response_types'] : ['code'];

  return {
    redirectUris,
    grantTypes,
    responseTypes,
    clientName: parseOptionalString(body, 'client_name'),
    logoUri: parseOptionalString(body, 'logo_uri'),
    clientUri: parseOptionalString(body, 'client_uri'),
    policyUri: parseOptionalString(body, 'policy_uri'),
    tosUri: parseOptionalString(body, 'tos_uri'),
  };
}

function toClientMetadataDoc(client: StoredClient, registrationEndpoint: string): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    client_id: client.clientId,
    redirect_uris: client.redirectUris,
    token_endpoint_auth_method: client.tokenEndpointAuthMethod,
    grant_types: client.grantTypes,
    response_types: client.responseTypes,
    registration_client_uri: `${registrationEndpoint}/${encodeURIComponent(client.clientId)}`,
    client_id_issued_at: Math.floor(client.registrationDate / 1_000),
  };

  const optionals: Array<[keyof StoredClient, string]> = [
    ['clientName', 'client_name'],
    ['logoUri', 'logo_uri'],
    ['clientUri', 'client_uri'],
    ['policyUri', 'policy_uri'],
    ['tosUri', 'tos_uri'],
  ];
  for (const [field, key] of optionals) {
    if (client[field]) {
      doc[key] = client[field];
    }
  }

  return doc;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGet(
  url: URL,
  store: OAuthStore,
  registrationEndpoint: string,
): Promise<Response> {
  const parts = url.pathname.split('/');
  const clientId = parts.at(-1);
  if (!clientId) {
    return jsonResponse({ error: 'invalid_request', error_description: 'Missing client_id.' }, 400);
  }
  const client = await store.getClient(decodeURIComponent(clientId));
  if (!client) {
    return jsonResponse({ error: 'invalid_client', error_description: 'Unknown client.' }, 404);
  }
  return jsonResponse(toClientMetadataDoc(client, registrationEndpoint), 200);
}

async function handlePost(request: Request, store: OAuthStore, registrationEndpoint: string): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_request', error_description: 'Invalid JSON body.' }, 400);
  }

  const parsed = parseRegistrationBody(body);
  if (!parsed.redirectUris || parsed.redirectUris.length === 0) {
    return jsonResponse({ error: 'invalid_client_metadata', error_description: 'redirect_uris is required.' }, 400);
  }

  const clientId = generateClientId();
  const client: StoredClient = {
    clientId,
    clientSecret: undefined,
    redirectUris: parsed.redirectUris,
    clientName: parsed.clientName,
    logoUri: parsed.logoUri,
    clientUri: parsed.clientUri,
    policyUri: parsed.policyUri,
    tosUri: parsed.tosUri,
    tokenEndpointAuthMethod: 'none',
    grantTypes: parsed.grantTypes ?? ['authorization_code', 'refresh_token'],
    responseTypes: parsed.responseTypes ?? ['code'],
    registrationDate: Date.now(),
  };

  try {
    await store.putClient(client, CLIENT_REGISTRATION_TTL_SECONDS);
  } catch (error) {
    logError('dcr_store_failed', { error_class: error instanceof Error ? error.constructor.name : 'unknown' });
    return jsonResponse({ error: 'server_error', error_description: 'Failed to register client.' }, 500);
  }

  const responseDoc = toClientMetadataDoc(client, registrationEndpoint);
  responseDoc['client_id_issued_at'] = Math.floor(client.registrationDate / 1_000);
  return jsonResponse(responseDoc, 201);
}

/**
 * Handles POST /register (DCR) and GET /register/<clientId> (CIMD).
 */
export async function handleRegistration(
  request: Request,
  kv: KvStore,
  registrationEndpoint: string,
): Promise<Response> {
  const url = new URL(request.url);
  const store = new OAuthStore(kv);

  if (request.method === 'GET') {
    return handleGet(url, store, registrationEndpoint);
  }
  if (request.method === 'POST') {
    return handlePost(request, store, registrationEndpoint);
  }
  return jsonResponse({ error: 'invalid_request', error_description: 'Method not allowed.' }, 405);
}
