# Changelog

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
