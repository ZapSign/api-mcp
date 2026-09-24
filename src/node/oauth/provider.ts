/**
 * NodeOAuthProvider — orchestrates authorize, token, registration, and metadata
 * endpoints using KvStore-backed storage.
 *
 * Exposes the same OAuthHelpers interface the auth handlers depend on so
 * oauth-handler.ts and id/auth-handler.ts work with minimal changes.
 */
import type { KvStore } from '../../store/kv-store.js';
import type { NodeOAuthConfig, OAuthHelpers } from './types.js';
import type { AuthRequest, ClientInfo } from '@cloudflare/workers-oauth-provider';
import { OAuthStore, generateOpaqueToken } from './store.js';
import { handleRegistration } from './registration.js';
import { handleTokenEndpoint } from './token-endpoint.js';
import {
  handleAuthorizationServerMetadata,
  handleProtectedResourceMetadata,
} from './metadata.js';
import { logError } from '../../utils/logger.js';

function parseAuthorizationRequest(url: URL): AuthRequest | null {
  const responseType = url.searchParams.get('response_type');
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state') ?? '';
  const scope = url.searchParams.get('scope')?.split(' ').filter(Boolean) ?? [];
  const codeChallenge = url.searchParams.get('code_challenge') ?? undefined;
  const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? undefined;
  const resource = url.searchParams.get('resource') ?? undefined;

  if (!responseType || !clientId || !redirectUri) {
    return null;
  }

  return {
    responseType,
    clientId,
    redirectUri,
    state,
    scope,
    codeChallenge,
    codeChallengeMethod,
    resource,
  };
}

async function parseAuthParams(request: Request): Promise<URLSearchParams> {
  const url = new URL(request.url);
  if (request.method !== 'POST') {
    return url.searchParams;
  }
  const body = await request.text();
  return new URLSearchParams(body);
}

/**
 * Creates OAuthHelpers bound to a specific KV store.
 *
 * The helpers are passed into the AuthHandler through NodeEnv so the auth
 * handler can call parseAuthRequest, lookupClient, and completeAuthorization
 * exactly as it did against the Workers OAuthProvider.
 */
export function createOAuthHelpers(kv: KvStore): OAuthHelpers {
  const store = new OAuthStore(kv);

  return {
    async parseAuthRequest(request: Request): Promise<AuthRequest> {
      const params = await parseAuthParams(request);
      const url = new URL(request.url);
      const syntheticUrl = new URL(`https://placeholder${url.pathname}`);
      for (const [k, v] of params.entries()) {
        syntheticUrl.searchParams.set(k, v);
      }
      const req = parseAuthorizationRequest(syntheticUrl);
      if (!req) {
        throw new Error('Invalid authorization request: missing required parameters.');
      }
      return req;
    },

    async lookupClient(clientId: string): Promise<ClientInfo | null> {
      const client = await store.getClient(clientId);
      if (!client) {
        return null;
      }
      return {
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        redirectUris: client.redirectUris,
        clientName: client.clientName,
        logoUri: client.logoUri,
        clientUri: client.clientUri,
        policyUri: client.policyUri,
        tosUri: client.tosUri,
        tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
        grantTypes: client.grantTypes,
        responseTypes: client.responseTypes,
        registrationDate: client.registrationDate,
      };
    },

    async completeAuthorization(options: {
      request: AuthRequest;
      userId: string;
      metadata: unknown;
      scope: string[];
      props: unknown;
    }): Promise<{ redirectTo: string }> {
      const code = generateOpaqueToken();
      const { redirectUri } = options.request;

      await store.putGrant(code, {
        clientId: options.request.clientId,
        userId: options.userId,
        redirectUri,
        scope: options.scope,
        codeChallenge: options.request.codeChallenge ?? '',
        codeChallengeMethod: options.request.codeChallengeMethod ?? 'S256',
        resource: options.request.resource,
        props: options.props,
        metadata: options.metadata,
        createdAt: Date.now(),
      });

      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (options.request.state) {
        redirectUrl.searchParams.set('state', options.request.state);
      }

      return { redirectTo: redirectUrl.toString() };
    },
  };
}

export interface NodeOAuthProviderOptions {
  readonly config: NodeOAuthConfig;
  readonly kv: KvStore;
  /** Handles auth UI (authorize page, docs, etc.) after OAuth routing. */
  readonly authHandler: (request: Request, env: import('../env.js').NodeEnv) => Promise<Response>;
  /** Handles MCP API requests (after auth check). */
  readonly apiHandler: (request: Request, env: import('../env.js').NodeEnv) => Promise<Response>;
}

/**
 * NodeOAuthProvider — top-level request router.
 *
 * Handles OAuth metadata, registration, token, and MCP API routes.
 * Delegates authorize UI and /docs /privacy to the provided authHandler.
 */
export class NodeOAuthProvider {
  private readonly config: NodeOAuthConfig;
  private readonly kv: KvStore;
  private readonly authHandlerFn: (request: Request, env: import('../env.js').NodeEnv) => Promise<Response>;
  private readonly apiHandlerFn: (request: Request, env: import('../env.js').NodeEnv) => Promise<Response>;

  constructor(options: NodeOAuthProviderOptions) {
    this.config = options.config;
    this.kv = options.kv;
    this.authHandlerFn = options.authHandler;
    this.apiHandlerFn = options.apiHandler;
  }

  async handle(request: Request, env: import('../env.js').NodeEnv): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const origin = url.origin;

    if (pathname === '/.well-known/oauth-protected-resource') {
      return handleProtectedResourceMetadata(this.config);
    }
    if (pathname === '/.well-known/oauth-authorization-server') {
      return handleAuthorizationServerMetadata(this.config, origin);
    }
    if (this.isRegistrationPath(pathname)) {
      return handleRegistration(request, this.kv, `${origin}${this.config.clientRegistrationEndpoint}`);
    }
    if (pathname === this.config.tokenEndpoint) {
      return handleTokenEndpoint(request, this.kv, this.config.refreshTokenTTL);
    }
    if (pathname === this.config.apiRoute || pathname.startsWith(`${this.config.apiRoute}/`)) {
      const authError = await this.validateBearer(request);
      if (authError) {
        return authError;
      }
      return this.apiHandlerFn(request, env);
    }
    return this.authHandlerFn(request, env);
  }

  private isRegistrationPath(pathname: string): boolean {
    return pathname === this.config.clientRegistrationEndpoint
      || pathname.startsWith(`${this.config.clientRegistrationEndpoint}/`);
  }

  private async validateBearer(request: Request): Promise<Response | null> {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
      return null;
    }
    if (!authorization.startsWith('Bearer ')) {
      return this.bearerError('invalid_token', 'Bearer token required.', request);
    }
    const token = authorization.slice('Bearer '.length);
    const store = new OAuthStore(this.kv);
    try {
      const stored = await store.getToken(token);
      if (!stored) {
        return this.bearerError('invalid_token', 'Token is invalid or expired.', request);
      }
    } catch (error) {
      logError('token_validate_failed', {
        error_class: error instanceof Error ? error.constructor.name : 'unknown',
      });
      return this.bearerError('server_error', 'Could not validate token.', request);
    }
    return null;
  }

  private bearerError(code: string, description: string, request: Request): Response {
    const origin = new URL(request.url).origin;
    return new Response(JSON.stringify({ error: code, error_description: description }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `Bearer realm="OAuth", resource_metadata="${origin}/.well-known/oauth-protected-resource", error="${code}", error_description="${description}"`,
      },
    });
  }
}
