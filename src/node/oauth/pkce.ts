/**
 * PKCE helpers — S256 only (allowPlainPKCE: false).
 */

const BASE64URL_PATTERN = /^[A-Za-z0-9\-_]+$/;

/**
 * Computes the S256 PKCE challenge for a verifier.
 *
 * @param verifier - Code verifier string
 * @returns Base64url-encoded SHA-256 challenge
 */
export async function computeS256Challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Verifies a PKCE S256 challenge against the verifier.
 *
 * @param verifier - Code verifier from the token request
 * @param challenge - Code challenge stored at authorize time
 * @returns true when verifier hashes match challenge
 */
export async function verifyS256(verifier: string, challenge: string): Promise<boolean> {
  if (!BASE64URL_PATTERN.test(challenge) || !verifier) {
    return false;
  }
  const expected = await computeS256Challenge(verifier);
  return expected === challenge;
}
