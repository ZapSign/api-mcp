# Phase 4 — publish / deploy / retire (human credentials required)

## Blockers observed (2026-07-21)

| Action | Status | Why |
|---|---|---|
| `wrangler deploy` | Blocked | `wrangler whoami` → not authenticated. Run `wrangler login` (account that owns `mcp.zapsign.com.br` + OAuth KV). |
| `npm publish` | Blocked | `npm whoami` → ENEEDAUTH. Run `npm login` with access to publish `mcp-server-zapsign`. |
| Archive `zapsign-mcp` | Prepared locally only | Do **after** Workers deploy from `api-mcp` succeeds and npm `2.0.0` is live. |

## Commands (after credentials)

```bash
# From api-mcp (merged/main or this branch after secrets confirmed)
cd api-mcp
npm ci
npm run typecheck && npm run lint && npm test
npm run build:stdio
npx wrangler deploy
npm publish --access public

# Smoke
# 1) Remote: open https://mcp.zapsign.com.br/docs and complete OAuth wizard
# 2) STDIO: ZAPSIGN_API_KEY=... npx -y mcp-server-zapsign  (sandbox only if authorized)
```

## Retire `ZapSign/zapsign-mcp`

1. Replace README with redirect (see draft below).
2. Settings → Archive repository (preferred over delete).
3. Close obsolete api-mcp Dependabot PRs (#4–#6, #10–#12) after merge of dual-mode PR.
4. Confirm no remaining Workers deploy hooks still target `zapsign-mcp`.

### Redirect README draft for zapsign-mcp

```markdown
# Moved to ZapSign/api-mcp

This repository is retired.

- **Canonical code + npm:** https://github.com/ZapSign/api-mcp (`mcp-server-zapsign`)
- **Remote MCP:** https://mcp.zapsign.com.br/mcp
- **Local:** `npx -y mcp-server-zapsign` with `ZAPSIGN_API_KEY`
```

## Close Dependabot PRs

```bash
gh pr close 12 --repo ZapSign/api-mcp --comment "Superseded by Workers dual-mode rewrite (v2)."
gh pr close 11 --repo ZapSign/api-mcp --comment "Superseded by Workers dual-mode rewrite (v2)."
gh pr close 10 --repo ZapSign/api-mcp --comment "Superseded by Workers dual-mode rewrite (v2)."
gh pr close 6 --repo ZapSign/api-mcp --comment "Superseded by Workers dual-mode rewrite (v2)."
gh pr close 5 --repo ZapSign/api-mcp --comment "Superseded by Workers dual-mode rewrite (v2)."
gh pr close 4 --repo ZapSign/api-mcp --comment "Superseded by Workers dual-mode rewrite (v2)."
```
