import { AuthError } from '../errors/auth-error.js';

/**
 * Verifies the granted OAuth scopes include the required scope.
 * Called by EVERY tool before executing — OAuthProvider does NOT enforce scopes automatically.
 *
 * @param grantedScope - Space-separated OAuth scopes from AuthProps
 * @param required - The scope string to check for (e.g. "documents:read")
 * @throws AuthError if the required scope is not granted
 */
export function requireScope(grantedScope: string | undefined, required: string): void {
  const granted = grantedScope?.split(' ') ?? [];
  if (granted.includes(required)) {
    return;
  }

  throw AuthError.insufficientScope(required);
}
