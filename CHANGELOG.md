# Changelog

## 2.1.1 — 2026-09-17

### Fixed

- **Privacy/security:** MCP tool responses now go through an explicit allowlist (`src/utils/response-filter.ts`) before returning to the model. Read/list responses for documents, signers, and templates no longer include government ID (CPF/CNPJ), biometric/ID-photo fields, precise geolocation, IP address, or digital-certificate data. Signing links (`sign_url`/`signing_link`) are now returned only on the call that creates the signer, never on subsequent reads. Template `answers`/`metadata` are returned as counts and filled-flags instead of raw values. Addresses OpenAI Apps review findings (restricted-data request, unnecessary personal identifiers, privacy-policy disclosure gap, annotation/behavior mismatch).
- Linked privacy policy (`/privacy`) updated with a field-level disclosure table matching the allowlist.

### Internal

- Cloudflare Workers deploy now runs via GitHub Actions (`.github/workflows/deploy.yml`, `workflow_dispatch` + `CLOUDFLARE_API_TOKEN` repo secret) instead of interactive local `wrangler login`.
- **Integration Tests (Sandbox)** CI check is green for the first time: added an owned PDF fixture (`test/fixtures/integration-test.pdf`) for `ZAPSIGN_TEST_PDF_URL`, wired the remaining required repo variables/secret, and fixed a real test bug — `GET /documents` defaults to ascending order, so the CRUD-cycle test now passes `sort_order: 'desc'` explicitly instead of assuming the newest document is on page 1.

## 2.1.0 — 2026-08-13

### Added

- Stamp MCP-created documents with reserved `origin=mcp` metadata on `createDocument` and `createFromTemplate` (STDIO and OAuth) so webhooks can attribute agent-created docs

## 2.0.0 — 2026-07-21

### Breaking

- Replaced Express/SSE architecture with Cloudflare Workers + OAuth 2.1 (remote) and Node STDIO (local)
- Renamed/normalized tools to the Workers Claude-friendly snake_case set (see `docs/TOOL_UNION.md`)
- npm consumers must use `ZAPSIGN_API_KEY` with the new STDIO bin; Docker/Traefik/SSE hosting is no longer the supported path (archived under `docs/archive/api-mcp-v1/`)

### Added

- Full tool union: core document/signer/template tools plus place signatures, extra docs, timestamp, envelope reorder, batch sign, webhooks, reprocess, and partner tools
- Shared auth adapter (`getAuthProps`) for Workers OAuth props and STDIO env credentials
- OAuth scopes: `webhooks:read`, `webhooks:write`, `partner:write`
- `create_document` supports `url_docx` and `async`; `create_from_template` supports `async`

### Changed

- Package remains `mcp-server-zapsign`; implementation now matches the former `zapsign-mcp` Workers quality bar
- Canonical remote URL: `https://mcp.zapsign.com.br/mcp`

## 1.0.4

Previous Express/SSE release. See `docs/archive/api-mcp-v1/`.
