/**
 * Separates optional idempotency key from request body fields.
 *
 * @param input - Parsed tool input that may include idempotency_key
 * @returns Body payload and optional idempotency key
 */
export function splitIdempotencyKey<T extends { idempotency_key?: string }>(
  input: T,
): { body: Omit<T, 'idempotency_key'>; idempotencyKey?: string } {
  const { idempotency_key: idempotencyKey, ...body } = input;
  return { body, idempotencyKey };
}
