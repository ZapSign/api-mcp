import { ZapSignMcpError } from './base.js';

export class AuthError extends ZapSignMcpError {
  constructor(message: string, code: string, statusCode: number, retryable: boolean) {
    super(message, code, statusCode, retryable);
    this.name = 'AuthError';
  }

  static apiTokenRejected(): AuthError {
    return new AuthError(
      'ZapSign rejected the current authorization. Please reconnect the ZapSign integration and try again.',
      'unauthorized',
      401,
      false,
    );
  }

  /** Granted OAuth scopes do not include the required scope. */
  static insufficientScope(required: string): AuthError {
    return new AuthError(
      `This action requires the "${required}" scope. Reconnect the ZapSign integration, grant that permission, and try again.`,
      'insufficient_scope',
      403,
      false,
    );
  }
}
