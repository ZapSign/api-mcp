const PKCE_VERIFIER_MIN_LENGTH = 43;
const PKCE_VERIFIER_MAX_LENGTH = 128;
const UNRESERVED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

function randomUnreservedString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += UNRESERVED_CHARS[bytes[index] % UNRESERVED_CHARS.length];
  }
  return result;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Creates an S256 PKCE challenge from a verifier.
 *
 * @param verifier - PKCE code verifier
 * @returns Base64url-encoded SHA-256 challenge
 */
export async function createS256Challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

/**
 * Generates a PKCE verifier and S256 challenge pair.
 *
 * @returns RFC 7636 code verifier and S256 challenge
 */
export async function buildPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const length = PKCE_VERIFIER_MIN_LENGTH
    + Math.floor(Math.random() * (PKCE_VERIFIER_MAX_LENGTH - PKCE_VERIFIER_MIN_LENGTH + 1));
  const verifier = randomUnreservedString(length);
  const challenge = await createS256Challenge(verifier);
  return { verifier, challenge };
}
