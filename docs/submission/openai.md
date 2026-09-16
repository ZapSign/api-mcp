# OpenAI ChatGPT Apps / Plugins Directory — Frozen Submission Copy

**Decision:** Submit truthful **25-tool** inventory (do not gate to 12 until both listings are Live).  
**Public MCP URL:** `https://mcp.zapsign.com.br/mcp`  
**Portal:** https://platform.openai.com/plugins  
**Track:** CAO-148 · `LAUNCH_STATE.md`

Do **not** use `mcp.zapsign.co` or any legacy/`fabricio` repository URLs in the listing.

---

## Listing fields

| Field | Value |
|---|---|
| Name | ZapSign |
| Short description | Create, send, and track e-signatures in ChatGPT. |
| Long description | Bring ZapSign’s e-signature workflow into ChatGPT. Create signing requests from a PDF URL or reusable template, add signers, deliver signing links by email or WhatsApp, track document status, configure webhooks, and manage partner accounts without leaving the conversation. MCP tool responses use a privacy allowlist: government IDs, biometrics, ID photos, geolocation, IP, certificates, and signing links on reads are never returned. |
| Category | Productivity / Business |
| Website | `https://zapsign.com.br` |
| Documentation | `https://mcp.zapsign.com.br/docs` |
| Support | support@zapsign.com.br |
| Privacy Policy | `https://mcp.zapsign.com.br/privacy` |
| Terms of Use | `https://zapsign.com.br/termos-de-uso` (or current ZapSign legal terms URL) |
| Public MCP URL | `https://mcp.zapsign.com.br/mcp` |
| Logo | `icon.svg` / hosted favicon on `mcp.zapsign.com.br` |
| Distribution countries | BR, MX, CO, US, PT, ES |

## Tool inventory (25) — human titles from tool annotations

Same registry as Anthropic (`src/tools/registry.ts`):

| Domain | Tool | Title |
|---|---|---|
| Documents | `list_documents` | List Documents |
| Documents | `get_document` | Get Document |
| Documents | `create_document` | Create Document |
| Documents | `update_document` | Update Document |
| Documents | `delete_document` | Delete Document |
| Documents | `place_signatures` | Place Signatures |
| Documents | `add_extra_document` | Add Extra Document |
| Documents | `add_extra_document_from_template` | Add Extra Document From Template |
| Documents | `add_timestamp` | Add Timestamp |
| Documents | `reorder_envelope_documents` | Reorder Envelope Documents |
| Signers | `add_signer` | Add Signer |
| Signers | `get_signer` | Get Signer |
| Signers | `update_signer` | Update Signer |
| Signers | `delete_signer` | Delete Signer |
| Signers | `sign_in_batch` | Sign In Batch |
| Templates | `list_templates` | List Templates |
| Templates | `get_template` | Get Template |
| Templates | `create_from_template` | Create Document from Template |
| Webhooks | `create_webhook` | Create Webhook |
| Webhooks | `delete_webhook` | Delete Webhook |
| Webhooks | `create_webhook_header` | Create Webhook Header |
| Webhooks | `delete_webhook_header` | Delete Webhook Header |
| Webhooks | `reprocess_documents_webhooks` | Reprocess Documents Webhooks |
| Partner | `create_partner_account` | Create Partner Account |
| Partner | `update_partner_payment_status` | Update Partner Payment Status |

Partner tools require partner privileges; non-partner tokens get actionable API errors.

The Platform draft requires a written justification for each tool's `readOnlyHint`, `openWorldHint`,
and `destructiveHint` (75 fields for 25 tools). Frozen text lives in
`openai-tool-annotations.md`; `scripts/submission/openai-fill-tool-justifications.js` re-applies it
in the browser if the draft is reset.

## Starter prompts (3–5)

1. “List my ZapSign documents that are still pending signature.”
2. “Create a document from this PDF URL and add me as the first signer.”
3. “Show my available templates and create a contract from the first one for client ACME.”
4. “What webhooks are configured for my company, and create one that posts to https://example.com/hooks/zapsign when a document is signed.”
5. “Summarize the signing status of document \<token\> and remind me who still needs to sign.”

## Test cases

### Positive (5)

1. OAuth connect → `list_documents` returns paginated results.
2. `create_document` with a public PDF URL + one signer returns document token and signing link.
3. `get_template` then `create_from_template` with exact `{{variable}}` keys succeeds.
4. `add_signer` on an existing pending document returns a new signer token.
5. `create_webhook` with a valid HTTPS URL returns webhook configuration.

### Negative (3)

1. Call any tool without completing OAuth → authentication error instructing reconnect.
2. `get_document` with a fabricated token → actionable not-found / API error.
3. Partner tool (`create_partner_account`) with a non-partner demo token → actionable privilege error (not a crash).

### Expected response contract for resubmission (allowlist)

The MCP server uses a **response allowlist** (not a blocklist). Only explicitly permitted fields
reach ChatGPT. Document, signer, and template tokens remain opaque identifiers.

Canonical published disclosure (field-level table + withheld list):
[`docs/PRIVACY_POLICY.md`](../PRIVACY_POLICY.md) → live at `https://mcp.zapsign.com.br/privacy`.

#### Document allowlist (`get_document`, `list_documents` items)

| Allowed | Notes |
|---|---|
| `token` | Opaque document identifier |
| `name` / `title` | Workflow label |
| `status` | Signing lifecycle |
| `created_at` / `created_date` | Ordering / age |
| `signed_count` (or equivalent progress) | How many have signed |
| `signers[]` | Each entry filtered through the **signer allowlist** |

Create responses (`create_document`, `create_from_template`) return the same document allowlist
plus any newly created signer objects (see `sign_url` rule below).

#### Signer allowlist (`get_signer`, nested `signers[]` on reads)

| Allowed | Notes |
|---|---|
| `token` | Opaque signer identifier (when present) |
| `name` | Display name |
| `status`, `status_code` | Signing state |
| `signed_at` | Completion time when signed |
| `qualification` | Role/qualification label |
| `auth_mode` | Auth method label (not biometric payloads) |
| `email` | **Conditional** — only when the caller is the document owner / verified ownership |

#### Template allowlist (`get_template`, `list_templates` items)

| Allowed | Notes |
|---|---|
| `token` | Opaque template identifier |
| `name` | Template label |
| Active / enabled flag | Whether the template can be used |
| Input **names** / variable keys | So the model can request fill values |
| `answers_count`, `answers_filled[]`, `metadata_count`, `metadata_filled[]` | Fast path — see below |

#### `answers` / `metadata` fast path

MCP **does not** return raw `answers` or `metadata` **values**.

Instead (when relevant):

- `answers_count` / `metadata_count`: number of answer or metadata fields
- `answers_filled` / `metadata_filled`: `[{ name: "<field>", filled: true|false }, …]` — **no values**

Long-term (not required for this resubmission): template `sensitivity` tags with per-field
redaction for `health` / `financial` / `biometric`.

#### `sign_url` / `signing_link` rule

| Tool | `sign_url` / `signing_link` |
|---|---|
| `create_document` | Allowed in the create response for new signers |
| `add_signer` | Allowed in the create response for the new signer |
| `create_from_template` | Allowed in the create response for new signers |
| `get_document`, `get_signer`, `list_documents`, and all other reads | **Never** returned |

#### Explicitly withheld (never returned to ChatGPT via MCP)

- CPF / CNPJ and other government identifiers
- Biometric photos and liveness captures (`selfie_photo_url`, `selfie_photo_url2`, `liveness_photo_url`, related flags)
- ID / document photos (`document_photo_url`, `document_verse_photo_url`, …)
- Precise geolocation (`geo_latitude`, `geo_longitude`)
- IP addresses
- Digital certificates and signature/visto images
- `sign_url` / `signing_link` on **read** tools
- Raw `answers` / `metadata` values
- Internal/debug fields (e.g. `uploaded_files`, `resend_attempts`, `sandbox`, `original_file_hash`, `deleted_at`, payment processor IDs, free-form payment notes)

#### Tool-shaped summary

- `list_documents` / `get_document`: document allowlist + nested signer allowlist (no `sign_url`).
- `create_document` / `create_from_template`: document allowlist; `sign_url` only for newly created signers in that response.
- `add_signer`: signer allowlist **including** `sign_url` for the new signer.
- `get_signer`: signer allowlist **without** `sign_url`.
- `get_template` / `list_templates`: template allowlist; inputs as names only; answers/metadata via counts/filled flags.
- `create_webhook`: webhook identifier + configuration needed to confirm creation.
- Errors: actionable message only — no upstream bodies, credentials, or personal identifiers.

## CSP note

Marketing pages (`/docs`, `/privacy`, browser `/mcp` landing) use a consent-gated marketing CSP (GA4 + Clarity). OAuth `/authorize` uses a strict auth CSP (`script-src 'none'`). MCP JSON-RPC is not HTML.

## Org / verification prerequisites

- ZapSign OpenAI Platform org with Apps Management write (`api.apps.write`)
- Business / developer identity verification (longest pole)
- Domain verification for `mcp.zapsign.com.br`
- Demo credentials: reuse Claude reviewer account structure (Phase 1)
