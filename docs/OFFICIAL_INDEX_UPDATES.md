# Official index updates (Phase 3)

## This PR (`ZapSign/api-mcp`)

- README dual install (remote OAuth + STDIO/`npx`)
- CHANGELOG `2.0.0`
- Community sources table
- `docs/TOOL_UNION.md`

## Follow-up PRs (separate repos)

### `ZapSign/agents` → public site [agents.zapsign.com.br](https://agents.zapsign.com.br)

Canonical hub for agent tutorials. Keep in sync with this repo:

| Surface | URL |
|---|---|
| Hub | https://agents.zapsign.com.br |
| Agent index | https://agents.zapsign.com.br/llms.txt |
| Remote MCP | https://mcp.zapsign.com.br/mcp |
| npm | `mcp-server-zapsign` / https://github.com/ZapSign/api-mcp |

Search/replace targets:

| Find | Replace |
|---|---|
| `github.com/ZapSign/zapsign-mcp` | `github.com/ZapSign/api-mcp` |
| `github.com/fabricioism/zapsign-mcp` | `github.com/ZapSign/api-mcp` |
| npm package docs pointing at Express/SSE only | Dual-mode: remote `https://mcp.zapsign.com.br/mcp` + `npx -y mcp-server-zapsign` |
| Tool tables listing only old api-mcp names | Link to api-mcp README / TOOL_UNION |

Likely files (confirm with repo search): `llms.txt`, `index.html`, `tutoriais/servidor-mcp.html`, Codex/Cursor/ChatGPT/Gemini tutorials.

### `ZapSign/zapsign-builder-docs` / `zapsign-builder-kits`

- Point MCP / agent use-case links at `https://github.com/ZapSign/api-mcp` and `https://mcp.zapsign.com.br/mcp`
- Prefer official server over mcp.ai / community npm packages

### Directories (manual / submit)

- Anthropic Connectors Directory — follow `SUBMISSION_PLAN.md` after deploy cutover
- mcpmarket, mcp.ai, mcpbundles, Smithery, Glama, PulseMCP, mcpservers.org — update listing URLs when ready

## Commands for humans

```bash
# api-mcp
cd api-mcp
git push -u origin feat/workers-dual-mode-v2
gh pr create ...

# agents (after cloning)
# apply URL/repo replacements, open PR
```
