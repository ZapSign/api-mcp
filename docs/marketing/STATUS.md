# MCP growth status

### 2026-07-21 (baseline)

- npm `mcp-server-zapsign@1.0.4`: last_day=12, last_week=101, last_month=246 (no prior snapshot)
- npm `@marcelocorrea/mcp-zapsign@2.0.0`: last_day=4, last_week=21, last_month=74
- Trends BR (past 12 mo averages): mcp=2 · chatgpt=1 · api=0 · claude=0 (one mcp spike to 100 week of 2025-12-21)
- Presence: official npm listed; [agents.zapsign.com.br](https://agents.zapsign.com.br) (+ `/llms.txt`) is the official tutorials hub; mcp.ai / mcpbundles are third-party; Anthropic directory submit still pending cutover
- Note: agents hub `llms.txt` still describes legacy STDIO/SSE install — update via ZapSign/agents after dual-mode cutover
- Next focus: keep [agents.zapsign.com.br/llms.txt](https://agents.zapsign.com.br/llms.txt) aligned with dual-mode (remote OAuth + `npx mcp-server-zapsign@2.0.0`); Anthropic directory submit

### 2026-07-21 (cutover)

- Published [`mcp-server-zapsign@2.0.0`](https://www.npmjs.com/package/mcp-server-zapsign)
- Deployed Workers to `https://mcp.zapsign.com.br`
- Merged api-mcp PR #13; retired/archived `ZapSign/zapsign-mcp` with redirect README

### 2026-07-31 (marketplace day-0 baseline)

- Snapshot: [`docs/marketing/snapshots/2026-07-31.json`](snapshots/2026-07-31.json)
- npm `mcp-server-zapsign@2.0.0`: last_day=7, last_week=121, last_month=504
- npm `@marcelocorrea/mcp-zapsign@2.0.0`: last_day=2, last_week=18, last_month=74
- Trends BR: left null in snapshot (fill via Trends UI; do not invent)
- Directory funnel (DCR registrations / OAuth token issuance): **not yet in this snapshot** — source of truth will be Cloudflare Worker logs/analytics on `mcp.zapsign.com.br` once launch instrumentation is confirmed; marketing page traffic continues via GA4 `G-GNJFSQFD50` + Clarity (consent-gated `/docs`, `/mcp` landing, `/privacy`)
- Presence: Anthropic + OpenAI directory submits pending Phase 1 demo token + Phase 0 `/privacy` deploy
- Next focus: deploy `/privacy` → Phase 1 demo account → submit packs in `docs/submission/`
