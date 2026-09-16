import { log } from './logger.js';

export type JsonRecord = Record<string, unknown>;

export interface AllowlistOptions {
  /** Include signer email for authenticated account owners (API token / OAuth). */
  includeEmail?: boolean;
  /** Include sign_url / signing_link — create responses only. */
  includeSignUrl?: boolean;
}

/** Explicitly never returned from MCP read or create projections. */
export const BANNED_SIGNER_KEYS = [
  'cpf',
  'cnpj',
  'selfie_photo_url',
  'selfie_photo_url2',
  'liveness_photo_url',
  'document_photo_url',
  'document_verse_photo_url',
  'selfie_validation_type',
  'signature_image',
  'geo_latitude',
  'geo_longitude',
  'ip',
  'digital_certificate',
  'uploaded_files',
  'delegator',
  'sent_sms_link',
  'resend_attempts',
  'visto_image',
  'phone',
  'phone_country',
  'phone_number',
] as const;

/** Document keys that must never appear in MCP responses. */
export const BANNED_DOCUMENT_KEYS = [
  'sandbox',
  'created_by',
  'external_id',
  'original_file_hash',
  'deleted_at',
  'open_id',
] as const;

const SIGNER_BASE_KEYS = [
  'token',
  'name',
  'status',
  'status_code',
  'signed_at',
  'qualification',
  'auth_mode',
] as const;

const DOCUMENT_BASE_KEYS = [
  'token',
  'name',
  'status',
  'created_at',
  'last_update_at',
] as const;

const TEMPLATE_BASE_KEYS = [
  'token',
  'name',
  'active',
  'template_type',
  'created_at',
  'last_update_at',
  'lang',
  'folder_path',
] as const;

const TEMPLATE_INPUT_KEYS = [
  'variable',
  'input_type',
  'label',
  'help_text',
  'options',
  'required',
  'order',
] as const;

const SIGN_URL_KEYS = ['sign_url', 'signing_link'] as const;

/**
 * Projects a ZapSign signer onto the OpenAI-safe allowlist.
 *
 * Email is included when `includeEmail` is true (authenticated API-token /
 * OAuth callers own the account data; no separate document-ownership check
 * exists in this MCP). `sign_url` / `signing_link` only when `includeSignUrl`.
 *
 * @param raw - Upstream signer payload
 * @param options - Allowlist toggles
 * @returns Allowlisted signer object, or the original non-object value
 */
export function filterSigner(raw: unknown, options: AllowlistOptions = {}): unknown {
  if (!isJsonRecord(raw)) {
    return raw;
  }

  const out = pickKeys(raw, SIGNER_BASE_KEYS);
  if (options.includeEmail === true && typeof raw.email === 'string') {
    out.email = raw.email;
  }
  if (options.includeSignUrl === true) {
    copySignUrlFields(raw, out);
  }

  logDroppedKeys('signer', raw, out);
  return out;
}

/**
 * Projects a ZapSign document onto the OpenAI-safe allowlist.
 * Replaces raw `answers` / `metadata` values with counts and filled flags.
 *
 * @param raw - Upstream document payload
 * @param options - Allowlist toggles (propagated to nested signers)
 * @returns Allowlisted document object, or the original non-object value
 */
export function filterDocument(raw: unknown, options: AllowlistOptions = {}): unknown {
  if (!isJsonRecord(raw)) {
    return raw;
  }

  const out = pickKeys(raw, DOCUMENT_BASE_KEYS);
  out.signed_count = computeSignedCount(raw.signers);
  out.signers = filterSignerList(raw.signers, options);
  assignAnswersSummary(raw, out);
  assignMetadataSummary(raw, out);

  logDroppedKeys('document', raw, out);
  return out;
}

/**
 * Projects a ZapSign template onto the OpenAI-safe allowlist.
 *
 * @param raw - Upstream template payload
 * @param options - Allowlist toggles (propagated to nested signers)
 * @returns Allowlisted template object, or the original non-object value
 */
export function filterTemplate(raw: unknown, options: AllowlistOptions = {}): unknown {
  if (!isJsonRecord(raw)) {
    return raw;
  }

  const out = pickKeys(raw, TEMPLATE_BASE_KEYS);
  out.inputs = filterTemplateInputs(raw.inputs);
  out.signers = filterTemplateSigners(raw.signers, options);

  logDroppedKeys('template', raw, out);
  return out;
}

/**
 * Filters a paginated document list (`results[]`).
 *
 * @param raw - Paginated ZapSign response
 * @param options - Allowlist toggles
 * @returns Allowlisted list payload
 */
export function filterDocumentList(raw: unknown, options: AllowlistOptions = {}): unknown {
  return filterPaginated(raw, (item) => filterDocument(item, options));
}

/**
 * Filters a paginated template list (`results[]`).
 *
 * @param raw - Paginated ZapSign response
 * @param options - Allowlist toggles
 * @returns Allowlisted list payload
 */
export function filterTemplateList(raw: unknown, options: AllowlistOptions = {}): unknown {
  return filterPaginated(raw, (item) => filterTemplate(item, options));
}

/** Default options for authenticated MCP tool handlers (account owners). */
export const OWNER_READ_OPTIONS: AllowlistOptions = {
  includeEmail: true,
  includeSignUrl: false,
};

/** Default options for create/add responses that may expose signing links once. */
export const OWNER_CREATE_OPTIONS: AllowlistOptions = {
  includeEmail: true,
  includeSignUrl: true,
};

function filterSignerList(signers: unknown, options: AllowlistOptions): unknown[] {
  if (!Array.isArray(signers)) {
    return [];
  }

  return signers.map((signer) => filterSigner(signer, options));
}

function filterTemplateSigners(signers: unknown, options: AllowlistOptions): unknown[] {
  if (!Array.isArray(signers)) {
    return [];
  }

  return signers.map((signer) => {
    if (!isJsonRecord(signer)) {
      return signer;
    }

    const out: JsonRecord = {};
    copyIfPresent(signer, out, 'name');
    copyIfPresent(signer, out, 'auth_mode');
    copyIfPresent(signer, out, 'qualification');
    if (options.includeEmail === true && typeof signer.email === 'string' && signer.email.length > 0) {
      out.email = signer.email;
    }
    return out;
  });
}

function filterTemplateInputs(inputs: unknown): unknown[] {
  if (!Array.isArray(inputs)) {
    return [];
  }

  return inputs.map((input) => {
    if (!isJsonRecord(input)) {
      return input;
    }
    return pickKeys(input, TEMPLATE_INPUT_KEYS);
  });
}

function filterPaginated(
  raw: unknown,
  mapItem: (item: unknown) => unknown,
): unknown {
  if (!isJsonRecord(raw)) {
    return raw;
  }

  const results = Array.isArray(raw.results) ? raw.results.map(mapItem) : [];
  return {
    count: raw.count,
    next: raw.next ?? null,
    previous: raw.previous ?? null,
    results,
  };
}

function assignAnswersSummary(raw: JsonRecord, out: JsonRecord): void {
  if (!Object.prototype.hasOwnProperty.call(raw, 'answers')) {
    return;
  }

  out.answers_count = countEntries(raw.answers);
  out.answers_filled = buildFilledFlags(raw.answers);
}

function assignMetadataSummary(raw: JsonRecord, out: JsonRecord): void {
  if (!Object.prototype.hasOwnProperty.call(raw, 'metadata')) {
    return;
  }

  out.metadata_count = countEntries(raw.metadata);
  out.metadata_filled = buildFilledFlags(raw.metadata);
}

function countEntries(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (isJsonRecord(value)) {
    return Object.keys(value).length;
  }
  return 0;
}

function buildFilledFlags(value: unknown): Array<{ name: string; filled: boolean }> {
  if (Array.isArray(value)) {
    return value.map((entry, index) => filledFlagFromEntry(entry, index));
  }
  if (isJsonRecord(value)) {
    return Object.entries(value).map(([key, entryValue]) => ({
      name: key,
      filled: isFilledValue(entryValue),
    }));
  }
  return [];
}

function filledFlagFromEntry(entry: unknown, index: number): { name: string; filled: boolean } {
  if (!isJsonRecord(entry)) {
    return { name: `item_${index}`, filled: isFilledValue(entry) };
  }

  const name = resolveEntryName(entry, index);
  const filled = isFilledValue(entry.value) || isFilledValue(entry.answer);
  return { name, filled };
}

function resolveEntryName(entry: JsonRecord, index: number): string {
  if (typeof entry.name === 'string' && entry.name.length > 0) {
    return entry.name;
  }
  if (typeof entry.key === 'string' && entry.key.length > 0) {
    return entry.key;
  }
  if (typeof entry.variable === 'string' && entry.variable.length > 0) {
    return entry.variable;
  }
  return `item_${index}`;
}

function isFilledValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.length > 0;
  }
  return true;
}

function computeSignedCount(signers: unknown): number {
  if (!Array.isArray(signers)) {
    return 0;
  }

  return signers.filter((signer) => isJsonRecord(signer) && signer.status === 'signed').length;
}

function copySignUrlFields(raw: JsonRecord, out: JsonRecord): void {
  for (const key of SIGN_URL_KEYS) {
    copyIfPresent(raw, out, key);
  }
}

function pickKeys(raw: JsonRecord, keys: readonly string[]): JsonRecord {
  const out: JsonRecord = {};
  for (const key of keys) {
    copyIfPresent(raw, out, key);
  }
  return out;
}

function copyIfPresent(raw: JsonRecord, out: JsonRecord, key: string): void {
  if (!Object.prototype.hasOwnProperty.call(raw, key)) {
    return;
  }
  out[key] = raw[key];
}

function logDroppedKeys(objectType: string, raw: JsonRecord, out: JsonRecord): void {
  const droppedCount = Object.keys(raw).filter((key) => !Object.prototype.hasOwnProperty.call(out, key)).length;
  if (droppedCount === 0) {
    return;
  }

  log('response_fields_redacted', { object_type: objectType, dropped_count: droppedCount });
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
