# mcp-server-zapsign

Official ZapSign [Model Context Protocol](https://modelcontextprotocol.io) server.

Dual-mode:

1. **Remote (recommended)** — Cloudflare Workers + OAuth 2.1 at `https://mcp.zapsign.com.br/mcp`
2. **Local STDIO** — `npx -y mcp-server-zapsign` with `ZAPSIGN_API_KEY`

Package: [`mcp-server-zapsign`](https://www.npmjs.com/package/mcp-server-zapsign) · Repo: [`ZapSign/api-mcp`](https://github.com/ZapSign/api-mcp)

## Remote install (Claude Connectors)

1. Open Claude → Settings → Connectors → Add custom connector
2. URL: `https://mcp.zapsign.com.br/mcp`
3. Complete OAuth and paste your ZapSign API token on the authorization page (never put the token in the URL)
4. Approve scopes and finish

Docs page: `https://mcp.zapsign.com.br/docs`  
Privacy policy: `https://mcp.zapsign.com.br/privacy`

## Usage examples

1. **Track pending signatures** — “List my ZapSign documents that are still pending and summarize who still needs to sign.”
2. **Send a contract** — “Create a signing request from this PDF URL, add two signers by email, and show me their signing links.”
3. **Fill a template** — “Create a document from my contract template for client ACME using `{{client_name}}` and `{{address}}`, then confirm the status.”

## Agent tutorials hub

Official how-to hub for Claude, ChatGPT, Cursor, Codex, Gemini, and REST:

- Site: [agents.zapsign.com.br](https://agents.zapsign.com.br)
- Agent index: [agents.zapsign.com.br/llms.txt](https://agents.zapsign.com.br/llms.txt)

## Local install (Claude Desktop / Cursor)

```json
{
  "mcpServers": {
    "zapsign": {
      "command": "npx",
      "args": ["-y", "mcp-server-zapsign"],
      "env": {
        "ZAPSIGN_API_KEY": "your-zapsign-api-token",
        "ZAPSIGN_BASE_URL": "https://api.zapsign.com.br"
      }
    }
  }
}
```

`ZAPSIGN_BASE_URL` is optional (defaults to production). Use the sandbox API URL when testing against sandbox.

## Tools

Core Workers names are preserved. Full union also includes webhooks, envelopes, timestamps, batch sign, and partner tools. See [`docs/TOOL_UNION.md`](docs/TOOL_UNION.md).

### Documents

| Tool | Purpose |
|---|---|
| `list_documents` | List/filter documents |
| `get_document` | Document details |
| `create_document` | Create from `url_pdf`, `url_docx`, or `base64_pdf` (`async` optional) |
| `update_document` | Update metadata |
| `delete_document` | Delete document |
| `place_signatures` | Place signature fields |
| `add_extra_document` | Attach extra PDF |
| `add_extra_document_from_template` | Extra doc from template |
| `add_timestamp` | Timestamp a document URL |
| `reorder_envelope_documents` | Reorder envelope docs |

### Signers / templates / webhooks / partner

| Tool | Purpose |
|---|---|
| `add_signer` / `get_signer` / `update_signer` / `delete_signer` | Signer CRUD |
| `sign_in_batch` | Batch signing |
| `list_templates` / `get_template` / `create_from_template` | Templates (`async` optional) |
| `create_webhook` / `delete_webhook` | Webhooks |
| `create_webhook_header` / `delete_webhook_header` | Webhook headers |
| `reprocess_documents_webhooks` | Reprocess deliveries |
| `create_partner_account` / `update_partner_payment_status` | Partner APIs |

Template tip: call `get_template` first and use exact braced strings from `inputs[].variable`: `{{name}}`, `{{address}}`, `{{start_date}}` — pass those exact braced keys as `data` keys to `create_from_template`.

## Development

```bash
npm install
cp .dev.vars.example .dev.vars
npm run typecheck
npm run lint
npm test
npm run dev          # wrangler local
npm run build:stdio  # npm bin output
```

Opt-in sandbox integration tests (never against production):

1. Copy `test/.env.test.example` → `test/.env.test`
2. Set `ZAPSIGN_TEST_SIGNER_EMAIL`, `ZAPSIGN_TEST_PDF_URL`, and other sandbox fields
3. Run `npm run test:integration`

See [`AGENTS.md`](AGENTS.md) for coding standards and architecture.

## Migration from v1 / zapsign-mcp

- npm v1 (`1.0.4`) was Express/SSE STDIO-only with different tool names → **breaking** in `2.0.0`
- Remote OAuth path previously lived in `ZapSign/zapsign-mcp` → now this repo
- Prefer `mcp.zapsign.com.br` and [agents.zapsign.com.br](https://agents.zapsign.com.br) over third-party hosted proxies

## Related community integrations

These are **not** the official server. Prefer this package, `mcp.zapsign.com.br`, and [agents.zapsign.com.br](https://agents.zapsign.com.br).

| Source | Role |
|---|---|
| [vm0-ai zapsign SKILL.md](https://github.com/vm0-ai/vm0-skills/blob/main/zapsign/SKILL.md) | Community curl/skill |
| [mcpmarket ZapSign Signature Manager](https://mcpmarket.com/tools/skills/zapsign-signature-manager) | Directory listing |
| [mcp.ai/zapsign](https://mcp.ai/zapsign) | Third-party hosted proxy |
| [@marcelocorrea/mcp-zapsign](https://www.npmjs.com/package/@marcelocorrea/mcp-zapsign) | Community npm package |
| [mcpbundles.com/skills/zapsign](https://www.mcpbundles.com/skills/zapsign) | Community bundle |

Also scan Smithery, Glama, PulseMCP, mcpservers.org, and the Anthropic Connectors Directory after cutover.

## Growth metrics & analytics

Track BR search intent (Google Trends), npm downloads, and shared marketing analytics:

- Docs: [`docs/marketing/README.md`](docs/marketing/README.md)
- Measurement IDs (GA4 / Clarity / GSC): [`docs/marketing/MEASUREMENT_IDS.md`](docs/marketing/MEASUREMENT_IDS.md)
- SEO cadence (30-day review): [`docs/marketing/SEO_CADENCE.md`](docs/marketing/SEO_CADENCE.md)
- Snapshot: `node scripts/marketing/take-snapshot.mjs`
- Cursor skill: `mcp-growth-metrics` · agent: `mcp-marketing`

**Live marketing analytics** (Consent Mode v2 + banner; shared with [agents.zapsign.com.br](https://agents.zapsign.com.br)):

- GA4 `G-GNJFSQFD50` + Clarity `xq06022ata` on `/docs` and the `/mcp` browser landing only
- Never on `/authorize`
- Hosts: `mcp.zapsign.com.br`, `mcp.zapsign.co` (same Worker vars)

## License

MIT © ZapSign
