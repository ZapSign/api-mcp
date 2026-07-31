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
| Long description | Bring ZapSign’s e-signature workflow into ChatGPT. Create signing requests from a PDF URL or reusable template, add signers, deliver signing links by email or WhatsApp, track document status, configure webhooks, and (for partner accounts) provision partner companies—without leaving the conversation. |
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

## CSP note

Marketing pages (`/docs`, `/privacy`, browser `/mcp` landing) use a consent-gated marketing CSP (GA4 + Clarity). OAuth `/authorize` uses a strict auth CSP (`script-src 'none'`). MCP JSON-RPC is not HTML.

## Org / verification prerequisites

- ZapSign OpenAI Platform org with Apps Management write (`api.apps.write`)
- Business / developer identity verification (longest pole)
- Domain verification for `mcp.zapsign.com.br`
- Demo credentials: reuse Claude reviewer account structure (Phase 1)
