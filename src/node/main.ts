/**
 * Node HTTP entry point — ports the full external contract off Cloudflare Workers.
 *
 * OAuth library choice: narrow façade with KvStore (src/node/oauth/).
 * oidc-provider was evaluated and rejected — it cannot express Client ID
 * Metadata Documents (CIMD) required by MCP auth spec 2026-07-28. It also
 * requires a persistent session store and full OIDC stack we don't need.
 * The narrow façade replicates only what workers-oauth-provider does: DCR,
 * PKCE S256, CIMD, resource metadata, token exchange — nothing more.
 */
import * as http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { DynamoKvStore } from '../store/dynamo-kv-store.js';
import type { KvStore } from '../store/kv-store.js';
import { KvNamespaceAdapter } from './kv-namespace-adapter.js';
import { NodeOAuthProvider, createOAuthHelpers } from './oauth/provider.js';
import { buildNodeEnvFromProcess, type NodeEnv } from './env.js';
import { handleMcpRequest, handleIdMcpRequest } from './mcp-handler.js';
import {
  OAUTH_ROUTE_PATHS,
  SUPPORTED_OAUTH_ORIGINS,
  isSupportedOAuthOrigin,
  CANONICAL_MCP_RESOURCE,
  DEFAULT_OAUTH_SCOPES,
  CANONICAL_OAUTH_ORIGIN,
} from '../auth/types.js';
import { IdOAuthRoutePaths, IdOAuthTtl, IdMcpResource, IdOAuthScopes } from '../id/constants.js';
import { AuthHandler } from '../auth/oauth-handler.js';
import { IdAuthHandler } from '../id/auth-handler.js';
import { isIdBrowserLanding, handleIdBrowserLanding } from '../id/browser-landing.js';
import { handleIdOAuthCallback, isZapSignIdCallback } from '../id/oauth-callback.js';
import { isBrowserMcpNavigation, handleMcpBrowserLanding } from '../docs/mcp-browser-landing.js';
import { configureStdioAuth } from '../auth/get-auth-props.js';
import { configureStdioIdAuth } from '../id/get-id-auth.js';
import type { Env } from '../types/env.js';
import { OAuthStore } from './oauth/store.js';
import { log, logError } from '../utils/logger.js';
import { createIdServer } from '../id/server.js';

const VERSION = process.env['VERSION'] ?? 'dev';
const DEFAULT_PORT = parseInt(process.env['PORT'] ?? '8080', 10);
const REFRESH_TOKEN_TTL_SECONDS = 2_592_000; // 30 days

// ── KvStore initialization ─────────────────────────────────────────────────

function buildKvStore(): DynamoKvStore {
  const region = process.env['AWS_REGION'];
  const tableName = process.env['DYNAMO_TABLE_NAME'];
  if (!region || !tableName) {
    throw new Error('AWS_REGION and DYNAMO_TABLE_NAME env vars are required for DynamoDB KV store.');
  }
  return new DynamoKvStore({ region, tableName });
}

// ── OAuth providers ────────────────────────────────────────────────────────

function buildSigningOAuthProvider(kv: KvStore): NodeOAuthProvider {
  return new NodeOAuthProvider({
    config: {
      apiRoute: OAUTH_ROUTE_PATHS.Api,
      authorizeEndpoint: OAUTH_ROUTE_PATHS.Authorize,
      tokenEndpoint: OAUTH_ROUTE_PATHS.Token,
      clientRegistrationEndpoint: OAUTH_ROUTE_PATHS.Register,
      clientIdMetadataDocumentEnabled: true,
      allowPlainPKCE: false,
      scopesSupported: [...DEFAULT_OAUTH_SCOPES],
      refreshTokenTTL: REFRESH_TOKEN_TTL_SECONDS,
      resourceMetadata: {
        resource: CANONICAL_MCP_RESOURCE,
        authorization_servers: [...SUPPORTED_OAUTH_ORIGINS],
        scopes_supported: [...DEFAULT_OAUTH_SCOPES],
      },
      issuer: CANONICAL_OAUTH_ORIGIN,
    },
    kv,
    authHandler: (request: Request, nodeEnv: NodeEnv) =>
      AuthHandler.fetch!(request, nodeEnv as unknown as Env, {} as ExecutionContext),
    apiHandler: (request: Request, nodeEnv: NodeEnv) =>
      handleSigningMcpRequest(request, nodeEnv),
  });
}

function buildIdOAuthProvider(kv: KvStore): NodeOAuthProvider {
  return new NodeOAuthProvider({
    config: {
      apiRoute: IdOAuthRoutePaths.Api,
      authorizeEndpoint: IdOAuthRoutePaths.Authorize,
      tokenEndpoint: IdOAuthRoutePaths.Token,
      clientRegistrationEndpoint: IdOAuthRoutePaths.Register,
      clientIdMetadataDocumentEnabled: true,
      allowPlainPKCE: false,
      scopesSupported: [...IdOAuthScopes],
      refreshTokenTTL: IdOAuthTtl.RefreshTokenSeconds,
      resourceMetadata: {
        resource: IdMcpResource,
        authorization_servers: [CANONICAL_OAUTH_ORIGIN],
        scopes_supported: [...IdOAuthScopes],
      },
      issuer: CANONICAL_OAUTH_ORIGIN,
    },
    kv,
    authHandler: (request: Request, nodeEnv: NodeEnv) =>
      IdAuthHandler.fetch!(request, nodeEnv as unknown as Env, {} as ExecutionContext),
    apiHandler: (request: Request, nodeEnv: NodeEnv) =>
      handleIdMcpApiRequest(request, nodeEnv),
  });
}

// ── MCP API handlers ───────────────────────────────────────────────────────

function unauthorizedResponse(error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleSigningMcpRequest(request: Request, env: NodeEnv): Promise<Response> {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return unauthorizedResponse('unauthorized');
  }

  const token = authorization.slice('Bearer '.length);
  const store = new OAuthStore(env.OAUTH_KV);
  const storedToken = await store.getToken(token);

  if (!storedToken?.props) {
    return unauthorizedResponse('invalid_token');
  }

  const props = storedToken.props as import('../auth/types.js').AuthProps;
  configureStdioAuth(props);

  return requestToNodeBridge(request, (req, res) =>
    handleMcpRequest(req, res, props as unknown as Record<string, unknown>),
  );
}

async function handleIdMcpApiRequest(request: Request, env: NodeEnv): Promise<Response> {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return unauthorizedResponse('unauthorized');
  }

  const token = authorization.slice('Bearer '.length);
  const store = new OAuthStore(env.OAUTH_KV);
  const storedToken = await store.getToken(token);

  if (!storedToken?.props) {
    return unauthorizedResponse('invalid_token');
  }

  const idProps = storedToken.props as import('../id/types.js').IdAuthProps;
  configureStdioIdAuth(idProps);

  return requestToNodeBridge(request, (req, res) =>
    handleIdMcpRequest(req, res, () => createIdServer(env as unknown as Env)),
  );
}

// ── Web ↔ Node bridging ───────────────────────────────────────────────────

interface FakeResState {
  statusCode: number;
  headersSent: boolean;
  headers: Record<string, string | string[]>;
  chunks: Uint8Array[];
  resolved: boolean;
  resolve: (r: Response) => void;
}

function buildFakeHeaders(state: FakeResState): Headers {
  const headers = new Headers();
  for (const [k, v] of Object.entries(state.headers)) {
    if (Array.isArray(v)) {
      appendHeaderArray(headers, k, v);
    } else {
      headers.set(k, v);
    }
  }
  return headers;
}

function appendHeaderArray(headers: Headers, key: string, values: string[]): void {
  for (const val of values) {
    headers.append(key, val);
  }
}

function buildFakeRes(state: FakeResState): ServerResponse {
  return Object.assign(Object.create(http.ServerResponse.prototype), {
    statusCode: state.statusCode,
    headersSent: state.headersSent,
    writeHead(code: number, hdrs?: Record<string, string | string[]>) {
      state.statusCode = code;
      this.statusCode = code;
      if (hdrs) {
        Object.assign(state.headers, hdrs);
      }
      state.headersSent = true;
      this.headersSent = true;
      return this;
    },
    setHeader(name: string, value: string | string[]) {
      state.headers[name.toLowerCase()] = value;
      return this;
    },
    getHeader(name: string) {
      return state.headers[name.toLowerCase()];
    },
    write(chunk: Buffer | string) {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      state.chunks.push(new Uint8Array(buf));
      return true;
    },
    end(chunk?: Buffer | string) {
      if (chunk) {
        const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        state.chunks.push(new Uint8Array(buf));
      }
      if (!state.resolved) {
        state.resolved = true;
        const body = mergeChunks(state.chunks);
        state.resolve(new Response(body.length > 0 ? body : null, {
          status: state.statusCode,
          headers: buildFakeHeaders(state),
        }));
      }
    },
    flushHeaders() {},
    socket: { remoteAddress: '127.0.0.1' },
  }) as unknown as ServerResponse;
}

function mergeChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function readableStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }
  return mergeChunks(chunks);
}

/**
 * Converts a Fetch API Request to Node IncomingMessage + ServerResponse,
 * calls the Node handler, and converts the response back to a Fetch Response.
 */
async function requestToNodeBridge(
  request: Request,
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
): Promise<Response> {
  const url = new URL(request.url);
  const bodyBuf = request.body ? await readableStreamToBuffer(request.body) : new Uint8Array(0);

  const dataHandlers: Array<(chunk: Uint8Array) => void> = [];
  const endHandlers: Array<() => void> = [];

  const req = buildFakeReq(url, request, dataHandlers, endHandlers);

  return new Promise((resolve, reject) => {
    const state: FakeResState = {
      statusCode: 200,
      headersSent: false,
      headers: {},
      chunks: [],
      resolved: false,
      resolve,
    };
    const res = buildFakeRes(state);

    handler(req, res)
      .then(() => {
        fireBodyEvents(dataHandlers, endHandlers, bodyBuf);
        if (!state.resolved) {
          state.resolved = true;
          resolve(new Response(null, { status: 204 }));
        }
      })
      .catch(reject);
  });
}

function buildFakeReq(
  url: URL,
  request: Request,
  dataHandlers: Array<(chunk: Uint8Array) => void>,
  endHandlers: Array<() => void>,
): IncomingMessage {
  const req = Object.assign(Object.create(http.IncomingMessage.prototype), {
    method: request.method,
    url: `${url.pathname}${url.search}`,
    headers: Object.fromEntries(request.headers.entries()),
    socket: { remoteAddress: '127.0.0.1' },
  }) as IncomingMessage;

  const origOn = req.on.bind(req);
  (req as unknown as Record<string, unknown>).on = (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => {
    if (event === 'data') {
      dataHandlers.push(handler as (chunk: Uint8Array) => void);
      return req;
    }
    if (event === 'end') {
      endHandlers.push(handler as () => void);
      return req;
    }
    return origOn(event, handler);
  };

  return req;
}

function fireBodyEvents(
  dataHandlers: Array<(chunk: Uint8Array) => void>,
  endHandlers: Array<() => void>,
  bodyBuf: Uint8Array,
): void {
  for (const h of dataHandlers) {
    h(bodyBuf);
  }
  for (const h of endHandlers) {
    h();
  }
}

// ── Root audience check (mirrors src/index.ts:62-105) ─────────────────────

function isRootAudience(value: string): boolean {
  try {
    const aud = new URL(value);
    return isSupportedOAuthOrigin(aud.origin) && (aud.pathname === '' || aud.pathname === '/');
  } catch {
    return false;
  }
}

async function rejectRootAudience(request: Request, kv: KvStore): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isSupportedOAuthOrigin(url.origin) || url.pathname !== OAUTH_ROUTE_PATHS.Api) {
    return null;
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length);
  const storedToken = await new OAuthStore(kv).getToken(token);
  if (!storedToken) {
    return null;
  }

  const audiences = Array.isArray(storedToken.audience)
    ? storedToken.audience
    : storedToken.audience ? [storedToken.audience] : [];

  if (!audiences.some(isRootAudience)) {
    return null;
  }

  return new Response(JSON.stringify({
    error: 'invalid_token',
    error_description: 'Token audience does not match the MCP resource.',
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="OAuth", resource_metadata="${CANONICAL_OAUTH_ORIGIN}/.well-known/oauth-protected-resource", error="invalid_token", error_description="Invalid audience"`,
    },
  });
}

// ── Main request dispatcher ────────────────────────────────────────────────

function isIdRoute(pathname: string): boolean {
  return pathname === IdOAuthRoutePaths.Api
    || pathname.startsWith(`${IdOAuthRoutePaths.Api}/`)
    || pathname === IdOAuthRoutePaths.Authorize
    || pathname === IdOAuthRoutePaths.Token
    || pathname === IdOAuthRoutePaths.Disconnect
    || pathname === IdOAuthRoutePaths.Register
    || pathname.startsWith(`${IdOAuthRoutePaths.Register}/`);
}

async function dispatchIdRequest(
  request: Request,
  idProvider: NodeOAuthProvider,
  env: NodeEnv,
): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === IdOAuthRoutePaths.Api || pathname.startsWith(`${IdOAuthRoutePaths.Api}/`)) {
    if (isZapSignIdCallback(request)) {
      return handleIdOAuthCallback(request, env as unknown as Env);
    }
    if (isIdBrowserLanding(request)) {
      return handleIdBrowserLanding(request, env as unknown as Env);
    }
  }

  return idProvider.handle(request, env);
}

async function dispatch(
  request: Request,
  signingProvider: NodeOAuthProvider,
  idProvider: NodeOAuthProvider,
  signingEnv: NodeEnv,
  idEnv: NodeEnv,
  kv: KvStore,
): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === '/healthz' || pathname === '/health') {
    return Response.json({ status: 'ok', version: VERSION, timestamp: new Date().toISOString() });
  }
  if (pathname === '/version') {
    return Response.json({ version: VERSION });
  }
  if (isIdRoute(pathname)) {
    return dispatchIdRequest(request, idProvider, idEnv);
  }
  if (isBrowserMcpNavigation(request)) {
    return handleMcpBrowserLanding(request, signingEnv as unknown as Env);
  }
  const rootAudienceError = await rejectRootAudience(request, kv);
  if (rootAudienceError) {
    return rootAudienceError;
  }
  return signingProvider.handle(request, signingEnv);
}

// ── HTTP request adapter ───────────────────────────────────────────────────

function nodeRequestToWebRequest(req: IncomingMessage, bodyBuf: Uint8Array): Request {
  const host = req.headers['host'] ?? 'localhost';
  const proto = (req.socket as unknown as Record<string, unknown>)['encrypted'] ? 'https' : 'http';
  const url = `${proto}://${host}${req.url ?? '/'}`;

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') {
      headers.set(k, v);
    } else if (Array.isArray(v)) {
      appendHeaderArray(headers, k, v);
    }
  }

  return new Request(url, {
    method: req.method ?? 'GET',
    headers,
    body: bodyBuf.length > 0 ? bodyBuf : undefined,
  });
}

async function readBody(req: IncomingMessage): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(new Uint8Array(chunk)));
    req.on('end', () => resolve(mergeChunks(chunks)));
    req.on('error', reject);
  });
}

function pumpResponseStream(reader: ReadableStreamDefaultReader<Uint8Array>, res: ServerResponse): void {
  reader.read().then(({ done, value }) => {
    if (done) {
      res.end();
      return;
    }
    res.write(value);
    pumpResponseStream(reader, res);
  }).catch((err: unknown) => {
    logError('response_stream_failed', {
      error_class: err instanceof Error ? err.constructor.name : 'unknown',
    });
    res.end();
  });
}

function sendWebResponse(webRes: Response, res: ServerResponse): void {
  const headers: Record<string, string> = {};
  webRes.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.writeHead(webRes.status, headers);

  if (webRes.body) {
    pumpResponseStream(webRes.body.getReader(), res);
  } else {
    res.end();
  }
}

// ── Server factory ─────────────────────────────────────────────────────────

export function createNodeServer(): http.Server {
  const dynamoKv = buildKvStore();
  const kvAdapter = new KvNamespaceAdapter(dynamoKv);
  const kvAdapterAsKvStore = kvAdapter as unknown as KvStore;

  const oauthHelpers = createOAuthHelpers(dynamoKv);
  const signingEnv = buildNodeEnvFromProcess(oauthHelpers, kvAdapterAsKvStore);

  const idOauthHelpers = createOAuthHelpers(dynamoKv);
  const idEnv: NodeEnv = { ...signingEnv, OAUTH_PROVIDER: idOauthHelpers };

  const signingProvider = buildSigningOAuthProvider(dynamoKv);
  const idProvider = buildIdOAuthProvider(dynamoKv);

  return http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const bodyBuf = await readBody(req);
      const webRequest = nodeRequestToWebRequest(req, bodyBuf);
      const webResponse = await dispatch(webRequest, signingProvider, idProvider, signingEnv, idEnv, dynamoKv);
      sendWebResponse(webResponse, res);
    } catch (error) {
      logError('request_dispatch_failed', {
        error_class: error instanceof Error ? error.constructor.name : 'unknown',
      });
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal_server_error' }));
      }
    }
  });
}

// ── Entry point ────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = DEFAULT_PORT;
  const server = createNodeServer();
  server.listen(port, () => {
    log('server_started', { port, version: VERSION });
    console.log(`[mcp-server-zapsign] listening on http://localhost:${port}`);
  });
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}
