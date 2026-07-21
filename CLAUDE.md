# ZapSign MCP Server — Claude Code Instructions

## What This Project Is

Remote MCP server (Cloudflare Workers + TypeScript) that connects Claude AI to ZapSign's electronic signature API via OAuth 2.1. Target: Anthropic MCP Connectors Directory.

## MANDATORY: Read Before Any Task

1. **`AGENTS.md`** — Coding standards, architecture patterns, commit convention. Non-negotiable.
2. **The assigned task, issue, or pull request** — Scope, acceptance criteria, dependencies, and blockers.
3. **Relevant code, tests, and documentation** — Confirm the current contract before changing it.

## Architecture

```
src/index.ts          → Worker entry (OAuthProvider wiring)
src/server.ts         → McpServer factory (new per request)
src/auth/             → OAuth handler, API token validation, token exchange
src/api/              → ZapSign HTTP client + endpoint constants
src/errors/           → Error hierarchy (base, api, auth, valid.)
src/types/            → Cloudflare Env bindings, ZapSign API types
src/utils/            → Logger, MCP response formatters, scope
src/tools/            → 12 MCP tools (docs×5, signers×4, tpl×3)
```

## Non-Negotiable Rules (from AGENTS.md)

- **No `any`** — use `unknown` + type guards
- **No `else` after `return`** — early return pattern always
- **No `switch`** — use `Record<string, handler>` maps
- **No `enum`** — use `as const` objects
- **No `as` assertions** — except with untyped libs (comment why)
- **Max 40 lines per function**, max 2 nesting levels
- **McpServer created PER REQUEST** (CVE GHSA-345p-7cg4-v4c7) — never cache globally
- **Tools never call `fetch()` directly** — always through `ZapSignClient`
- **Every tool needs `annotations`**: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint: true`, `title`
- **Tool responses**: `JSON.stringify(result)` — no pretty-print, 25k token limit
- **Error messages must be ACTIONABLE** for Claude (explain how to recover)

## Dev Commands

```bash
npm run dev          # wrangler dev (local server)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
npm run test         # vitest run
npm run deploy       # wrangler deploy
```

## Checkpoint After Each Task

```bash
npm run typecheck && npm run lint   # always
npm test                            # when applicable and hermetic
```

First run the focused test or evidence check. Do not run a test that calls the real ZapSign API unless the task explicitly authorizes it and the sandbox preflight passes. Review the diff for scope and secrets, then commit one focused change.

## Commit Format

```
feat(documents): implement document tools
fix(api): handle 429 rate limit retry
test(signers): add signer tool unit tests
chore(tooling): add agent context infrastructure
```

## Dependency Versions (pinned — never use `latest`)

```
@modelcontextprotocol/sdk: "^1.27.0"
@cloudflare/workers-oauth-provider: "^0.2.3"
agents: "0.6.0"                        ← EXACT version, no ^
zod: "^3.23.0"                         ← V3, NOT V4
```

## Key External Docs

- MCP spec: https://modelcontextprotocol.io/specification/2025-06-18
- ZapSign API: https://docs.zapsign.com.br/english
- Cloudflare OAuthProvider: https://github.com/cloudflare/workers-oauth-provider
- Cloudflare Agents SDK: https://developers.cloudflare.com/agents/api-reference/mcp-handler-api/
