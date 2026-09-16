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
| Live page | **Deployed.** See "Live deploy evidence" below. |

## Live deploy evidence (2026-09-16, this session)

| Step | Evidence |
|---|---|
| PR #42 (allowlist fix) merged to `main` | Merge commit `10ccad8` |
| PR #43 (Cloudflare deploy workflow, `CLOUDFLARE_API_TOKEN` secret, no `wrangler login`) merged to `main` | Merge commit `74179cc` |
| Deploy run | `gh workflow run deploy.yml` on `main` — GitHub Actions run `35130224877`, all steps green (typecheck, lint, 423/423 tests, `wrangler deploy`) |
| Worker Version ID | `63412fb4-66ec-45e2-bb25-471ab1f033b0` |
| Custom domains updated | `mcp.zapsign.com.br`, `mcp.zapsign.co` (per `wrangler deploy` output) |
| `GET https://mcp.zapsign.com.br/privacy` post-deploy | `200`; diff vs. pre-deploy snapshot shows the new field-level table live (`biometric`, `liveness`, `geolocation`, `Digital certificate`, "We do not expose" language present) |

Live read-tool call against production (`get_document`/`get_signer` with real credentials) was **not** performed this session — no live ZapSign sandbox token available in this environment. The fixture-based spot-check above (production-shaped payloads) plus the unit suite (`test/unit/response-filter.test.ts`, `test/unit/tools/*.test.ts`) is the evidence for filter correctness; the live check above confirms the *deployed* code is the filtered version, not stale.

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

1. ~~Commit / push / PR~~ — done: PR #42 merged (`10ccad8`).
2. ~~Deploy Worker~~ — done: Worker Version `63412fb4-66ec-45e2-bb25-471ab1f033b0` live via GitHub Actions (PR #43, no local `wrangler login`).
3. ~~Spot-check live `/privacy`~~ — done: `200`, new disclosure table confirmed live.
4. **Resubmit** in OpenAI Platform Apps (only remaining step — needs a human with OpenAI Platform dashboard access; no credentials or browser automation available in this environment):
   - Privacy policy URL: `https://mcp.zapsign.com.br/privacy`
   - This evidence note + test commands/results above
   - Pointer to allowlist implementation: `src/utils/response-filter.ts`
   - Worker Version ID for reference: `63412fb4-66ec-45e2-bb25-471ab1f033b0`

## Out of scope for this evidence pass

- Live production MCP tool call (`get_document`/`get_signer`) with real credentials — no live ZapSign sandbox token available in this environment. Correctness evidence instead comes from the fixture-based spot-check + unit suite above, run against the exact code now deployed.
