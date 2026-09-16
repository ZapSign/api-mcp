# OpenAI resubmission evidence — ZapSign MCP allowlist

**Branch:** `mcp/redact-openai-allowlist`  
**Repo:** `ZapSign/api-mcp`  
**Evidence captured:** 2026-09-16  
**Privacy policy URL (listing):** https://mcp.zapsign.com.br/privacy

This note is the checklist + local proof bundle for OpenAI Apps resubmission after the privacy rejection (sensitive fields in MCP tool results).

## What was fixed

1. **Response allowlist** (`src/utils/response-filter.ts`)  
   Read/create tool handlers project upstream ZapSign JSON onto explicit allowlists for documents, signers, and templates. Banned keys (CPF/CNPJ, biometrics/ID photos, geolocation, IP, certificates, phone, debug fields, etc.) are dropped before `tools/call` returns.

2. **`sign_url` / `signing_link` create-only**  
   Included only via `OWNER_CREATE_OPTIONS` on `create_document`, `add_signer`, and `create_from_template`. Reads (`get_document`, `get_signer`, `list_documents`, …) use `OWNER_READ_OPTIONS` and never return signing links.

3. **`answers` / `metadata` fast path**  
   Raw values are never returned. Documents expose `answers_count`, `answers_filled[{name,filled}]`, `metadata_count`, and `metadata_filled[{name,filled}]` only.

4. **Privacy + submission docs**  
   Field-level disclosure in `docs/PRIVACY_POLICY.md` (served by Worker at `/privacy`), plus allowlist contract in `docs/submission/openai.md` / tool annotations.

## Privacy policy URL / Worker deploy

| Item | Status |
|---|---|
| Canonical URL for OpenAI listing | `https://mcp.zapsign.com.br/privacy` |
| Source in repo | `docs/PRIVACY_POLICY.md` + `src/docs/privacy-policy-markdown.ts` / `privacy-page.ts` |
| Live page | **Requires Worker deploy** of this branch (`npx wrangler deploy` / usual prod deploy). Uncommitted allowlist + policy updates are **not** live until deploy. |

Do **not** resubmit until `GET https://mcp.zapsign.com.br/privacy` returns 200 with the updated field-level table (Data returned / Purpose / Source + withheld categories).

## Test evidence (local, 2026-09-16)

Environment: Node `v20.19.0`, repo root `/home/andre-chaves/Documents/zapsign/api-mcp`.

### Privacy / filter unit suite

```bash
npm test -- --run \
  test/unit/response-filter.test.ts \
  test/unit/docs/privacy-page.test.ts \
  test/unit/docs/privacy-policy.test.ts \
  test/unit/utils/sanitize-tool-result.test.ts
```

**Result:** 4 files, **13 passed**.

### Tool wiring (documents / signers / templates)

```bash
npm test -- --run \
  test/unit/tools/documents.test.ts \
  test/unit/tools/signers.test.ts \
  test/unit/tools/templates.test.ts
```

**Result:** 3 files, **72 passed**.

### Privacy smoke (integration config, fixture-based — no live prod secrets)

```bash
npm run test:integration -- --run test/integration/privacy-smoke.test.ts
```

**Result:** 1 file, **6 passed**.

### Full unit suite

```bash
npm test -- --run
```

**Result:** 42 files, **423 passed**.

### Spot-check (filter fixtures, no live MCP)

Invoked `filterDocument` / `filterSigner` with production-shaped payloads containing banned fields + secret answer/metadata values:

| Check | Result |
|---|---|
| All `BANNED_SIGNER_KEYS` / `BANNED_DOCUMENT_KEYS` absent from read output | PASS |
| `sign_url` / `signing_link` absent on read; present on create options | PASS |
| Raw `answers` / `metadata` keys absent; summaries present | PASS |
| Secret values (`SECRET_CPF`, `secret@ex.com`) absent from serialized read doc | PASS |

Read document keys observed: `token`, `name`, `status`, `created_at`, `last_update_at`, `signed_count`, `signers`, `answers_count`, `answers_filled`, `metadata_count`, `metadata_filled`.

## Remaining human steps

1. **Commit / push / PR** (optional but recommended) on `mcp/redact-openai-allowlist` — working tree currently has uncommitted allowlist + docs changes; this evidence pass did **not** commit or push.
2. **Deploy Worker** so `https://mcp.zapsign.com.br/privacy` and MCP tool filtering go live.
3. **Spot-check live** `GET https://mcp.zapsign.com.br/privacy` (200 + updated disclosure table). Optionally smoke one read tool against staging and confirm banned keys absent.
4. **Resubmit** in OpenAI Platform Apps with:
   - Privacy policy URL: `https://mcp.zapsign.com.br/privacy`
   - This evidence note + test commands/results above
   - Pointer to allowlist implementation: `src/utils/response-filter.ts`

## Out of scope for this evidence pass

- No git commit, push, or Worker deploy (per remediation handoff).
- No live production MCP calls with secrets.
