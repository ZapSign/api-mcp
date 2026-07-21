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
