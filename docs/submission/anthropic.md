# Anthropic Claude Connectors Directory — Frozen Submission Copy

**Decision:** Submit truthful **25-tool** inventory (do not gate to 12 until both listings are Live).  
**Server URL:** `https://mcp.zapsign.com.br/mcp`  
**Form:** https://clau.de/mcp-directory-submission  
**Track:** CAO-147 · `LAUNCH_STATE.md`

Do **not** use `mcp.zapsign.co` or any legacy/`fabricio` repository URLs in the form.

---

## Form fields

| Field | Value |
|---|---|
| Server name | ZapSign |
| Server URL | `https://mcp.zapsign.com.br/mcp` |
| Tagline | Create, send, and track e-signatures in Claude. |
| Description | Bring ZapSign’s e-signature workflow into Claude. Create signing requests from a PDF URL or reusable template, add signers, deliver signing links by email or WhatsApp, track document status, manage webhooks, and (for partner accounts) provision partner companies—all in one conversation. |
| Category | Productivity / Business |
| Documentation URL | `https://mcp.zapsign.com.br/docs` |
| Privacy Policy URL | `https://mcp.zapsign.com.br/privacy` |
| Support contact | support@zapsign.com.br |
| Logo | Hosted favicon / `icon.svg` on `mcp.zapsign.com.br` (or repo `icon.svg` under ZapSign/api-mcp) |
| Allowed link URIs | `zapsign.com.br`, `app.zapsign.com.br`, `mcp.zapsign.com.br`, `agents.zapsign.com.br` only |

## Tool inventory (25) — human titles from tool annotations

### Documents (10)

| Tool | Title |
|---|---|
| `list_documents` | List Documents |
| `get_document` | Get Document |
| `create_document` | Create Document |
| `update_document` | Update Document |
| `delete_document` | Delete Document |
| `place_signatures` | Place Signatures |
| `add_extra_document` | Add Extra Document |
| `add_extra_document_from_template` | Add Extra Document From Template |
| `add_timestamp` | Add Timestamp |
| `reorder_envelope_documents` | Reorder Envelope Documents |

### Signers (5)

| Tool | Title |
|---|---|
| `add_signer` | Add Signer |
| `get_signer` | Get Signer |
| `update_signer` | Update Signer |
| `delete_signer` | Delete Signer |
| `sign_in_batch` | Sign In Batch |

### Templates (3)

| Tool | Title |
|---|---|
| `list_templates` | List Templates |
| `get_template` | Get Template |
| `create_from_template` | Create Document from Template |

### Webhooks (5)

| Tool | Title |
|---|---|
| `create_webhook` | Create Webhook |
| `delete_webhook` | Delete Webhook |
| `create_webhook_header` | Create Webhook Header |
| `delete_webhook_header` | Delete Webhook Header |
| `reprocess_documents_webhooks` | Reprocess Documents Webhooks |

### Partner (2)

| Tool | Title |
|---|---|
| `create_partner_account` | Create Partner Account |
| `update_partner_payment_status` | Update Partner Payment Status |

**Note for reviewers:** Partner tools require a ZapSign partner-privileged API token. Non-partner demo tokens receive an actionable error from the ZapSign API (not a silent failure). Webhook tools require `webhooks:write` scope.

## Usage examples (paste into form)

1. “List my pending ZapSign documents and summarize which ones still need signatures.”
2. “Create a signing request from this PDF URL, add two signers by email, and show me their signing links.”
3. “Create a document from my contract template for client ACME, fill `{{client_name}}` and `{{address}}`, and tell me the status.”

## Reviewer credentials

Share only via the form’s designated secure fields (never in the connector URL or public docs). See `docs/REVIEWER_GUIDE.md` after Phase 1 demo account is provisioned.
