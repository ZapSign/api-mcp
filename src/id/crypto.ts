const AES_GCM_IV_BYTES = 12;
const AES_GCM_TAG_BITS = 128;

function decodeBase64Key(keyBase64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(keyBase64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

async function importAesKey(keyBase64: string): Promise<CryptoKey> {
  const keyBytes = decodeBase64Key(keyBase64);
  if (keyBytes.length !== 32) {
    throw new Error('ID_TOKEN_ENCRYPTION_KEY must decode to 32 bytes for AES-256-GCM.');
  }
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function concatBytes(iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return combined;
}

function splitIvAndCiphertext(payload: Uint8Array): { iv: Uint8Array; ciphertext: Uint8Array } {
  if (payload.length <= AES_GCM_IV_BYTES) {
    throw new Error('Encrypted payload is too short.');
  }
  return {
    iv: payload.slice(0, AES_GCM_IV_BYTES),
    ciphertext: payload.slice(AES_GCM_IV_BYTES),
  };
}

/**
 * Encrypts plaintext with AES-256-GCM using a base64-encoded 32-byte key.
 *
 * @param plaintext - UTF-8 string to encrypt
 * @param keyBase64 - Wrangler secret value
 * @returns Base64 payload containing IV + ciphertext
 */
export async function encryptSecret(plaintext: string, keyBase64: string): Promise<string> {
  const key = await importAesKey(keyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: AES_GCM_TAG_BITS },
    key,
    new TextEncoder().encode(plaintext),
  );
  return bytesToBase64(concatBytes(iv, new Uint8Array(ciphertext)));
}

/**
 * Decrypts an AES-256-GCM payload produced by encryptSecret.
 *
 * @param payloadBase64 - Base64 IV + ciphertext
 * @param keyBase64 - Wrangler secret value
 * @returns Decrypted UTF-8 string
 */
export async function decryptSecret(payloadBase64: string, keyBase64: string): Promise<string> {
  const key = await importAesKey(keyBase64);
  const binary = atob(payloadBase64);
  const payload = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    payload[index] = binary.charCodeAt(index);
  }
  const { iv, ciphertext } = splitIvAndCiphertext(payload);
  const ivBuffer = new Uint8Array(AES_GCM_IV_BYTES);
  ivBuffer.set(iv);
  const cipherBuffer = new Uint8Array(ciphertext.length);
  cipherBuffer.set(ciphertext);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer, tagLength: AES_GCM_TAG_BITS },
    key,
    cipherBuffer,
  );
  return new TextDecoder().decode(plaintext);
}
