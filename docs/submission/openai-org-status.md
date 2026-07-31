# OpenAI org / verification status (Phase 2B)

**Date:** 2026-07-31 (updated)  
**Ticket:** [CAO-148](https://truora.atlassian.net/browse/CAO-148)  
**Canonical:** also mirrored in `LAUNCH_STATE.md` OPENAI track.

## Session evidence (authenticated)

| Check | Result |
|---|---|
| Browser session signed into OpenAI? | **Yes** |
| Org | **ZapSign** (`org-zytAEIEHDhfBrgREh8gTiYUA`) |
| Submitter | André Chaves — **Owner** (Apps Management Write included) |
| `/plugins` under ZapSign | Loads; Create plugin available |
| Business verification | **Started** — Persona inquiry `inq_Ab5jmhWL315dJws5trTcSecHwAxkpK` |
| Persona email | Code sent to `andre@zapsign.com.br` — **HARD GATE** awaiting 5-digit code |
| Create plugin With MCP | Blocked by modal: “Complete identity verification” until Persona finishes |
| Support contact `support@zapsign.com.br` | Not set in listing yet (form blocked until verify) |
| Domain challenge token | **Not issued** — requires plugin draft after identity verify |
| Final app submission | **Not started** (blocked on identity verify + Phase 1 demo creds) |

## HARD GATEs (active)

1. **Persona email confirmation code** (and subsequent business/CNPJ docs + biometrics in Persona).
2. **Phase 1 local demo token** — GitHub secret `ZAPSIGN_API_TOKEN` exists; not available in agent local env / `.dev.vars` / Wrangler secrets.

## Domain verification method (ready in Worker)

| Item | Guidance |
|---|---|
| Preferred method | Well-known HTTPS challenge |
| Challenge URL | `https://mcp.zapsign.com.br/.well-known/openai-apps-challenge` |
| Response body | Exact portal token as **plain text only** |
| Worker | `handleOpenAiAppsChallenge` + env/secret `OPENAI_APPS_CHALLENGE_TOKEN` |
| Deploy step | After portal shows token: `npx wrangler secret put OPENAI_APPS_CHALLENGE_TOKEN` then deploy |

## Next unblocked OpenAI steps (after Persona)

1. Finish Persona business verification (CNPJ / legal package if prompted).
2. Create plugin With MCP → paste Public MCP URL `https://mcp.zapsign.com.br/mcp`.
3. Capture domain challenge token → set Worker secret → deploy → Verify Domain.
4. Set support to `support@zapsign.com.br`; paste listing from `docs/submission/openai.md`.
5. Submit only when Phase 1 demo credentials are frozen.

## Secrets policy

No credentials, tokens, or API keys recorded here. UI status descriptions only.
