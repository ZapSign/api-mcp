# OpenAI org / verification status (Phase 2B)

**Date:** 2026-08-14 (gates unchanged — Persona/identity still incomplete; no listing submission; prior continue disconnected before docs/Jira)  
**Ticket:** [CAO-148](https://truora.atlassian.net/browse/CAO-148)  
**Canonical:** also mirrored in `LAUNCH_STATE.md` OPENAI track.

## Session evidence (authenticated)

| Check | Result |
|---|---|
| Browser session signed into OpenAI? | **Yes** |
| Org | **ZapSign** (`org-zytAEIEHDhfBrgREh8gTiYUA`) |
| Submitter | André Chaves — **Owner** (Apps Management Write included) |
| `/plugins` under ZapSign | Loads; Create plugin menu shows With MCP + Skills only |
| Business verification | **Identity incomplete** — Persona inquiry `inq_Ab5jmhWL315dJws5trTcSecHwAxkpK` (OpenAI `TRUSTED_BUSINESS` STARTED; `PERSONA_BUSINESS` STARTED; billing/sentinel APPROVED) |
| Persona session | Prior `inquiry-id` / old `code=` links → **Session/Link expired**. Refreshed successfully via `PUT https://api.openai.com/v1/dashboard/organizations/verifications` → new one-time `code=` URL |
| Persona email | **HARD GATE** — Confirm your email address; 5-digit code to `andre@zapsign.com.br` (browser unlocked; ~10 min poll still on this step) |
| Create plugin With MCP | Blocked by modal: “Complete identity verification” until Persona finishes |
| Support contact `support@zapsign.com.br` | Not set in listing yet (form blocked until verify) |
| Domain challenge token | **Not issued** — requires plugin draft after identity verify |
| Final app submission | **Not started** (blocked on identity verify) |
| Demo token | Session-validated from AWS SM `stress-testing` (2026-08-13); not in git |

## HARD GATEs (active)

1. **Persona email confirmation code** (then CNPJ / legal package + biometrics if Persona prompts).
2. ~~Phase 1 local demo token~~ — cleared for this agent session via AWS SM (still not in Wrangler/GitHub-readable env for CI).

## Domain verification method (ready in Worker)

| Item | Guidance |
|---|---|
| Preferred method | Well-known HTTPS challenge |
| Challenge URL | `https://mcp.zapsign.com.br/.well-known/openai-apps-challenge` |
| Response body | Exact portal token as **plain text only** |
| Worker | `handleOpenAiAppsChallenge` + env/secret `OPENAI_APPS_CHALLENGE_TOKEN` |
| Deploy step | After portal shows token: `npx wrangler secret put OPENAI_APPS_CHALLENGE_TOKEN` then deploy |

## Next unblocked OpenAI steps (after Persona)

1. Finish Persona business verification (CNPJ / legal package if prompted) — ask once if docs needed.
2. Create plugin With MCP → paste Public MCP URL `https://mcp.zapsign.com.br/mcp`.
3. Capture domain challenge token → set Worker secret → deploy → Verify Domain.
4. Set support to `support@zapsign.com.br`; paste listing from `docs/submission/openai.md`.
5. Submit with demo credentials in designated fields only.

## Secrets policy

No credentials, tokens, or API keys recorded here. UI status descriptions only.
