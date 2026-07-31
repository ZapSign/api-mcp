# OpenAI org / verification status (Phase 2B early)

**Date:** 2026-07-31  
**Ticket:** [CAO-148](https://truora.atlassian.net/browse/CAO-148)  
**Agent pass:** Phase 2B parallel start (org registration & business verification)  
**Note:** `LAUNCH_STATE.md` did not exist yet — findings live here until Phase 0 merges them into the OPENAI section.

## Session evidence

| Check | Result |
|---|---|
| Browser session signed into OpenAI? | **No** — Cursor browser has no authenticated OpenAI session |
| `https://platform.openai.com` | Redirects to `https://platform.openai.com/login` |
| `https://platform.openai.com/plugins` | Redirects to `https://platform.openai.com/login?next=%2Fplugins` |
| Login UI | Email + Continue; Google / Apple / Microsoft / phone SSO options |
| ZapSign org exists? | **Unknown** — blocked before dashboard |
| Apps Management write (`api.apps.write`)? | **Unknown** — blocked |
| Business / developer verification? | **Unknown** — blocked |
| Support contact `support@zapsign.com.br`? | **Unknown** — blocked |
| Final app submission | **Not started** (correct — listing materials depend on Phase 0 `docs/submission/openai.md`) |

## HARD GATE (active)

**Login / missing OpenAI Platform credentials for ZapSign org.**

Posted on CAO-148. Do not invent credentials. After a human provides an authenticated session (or credentials + 2FA when prompted), re-run this pass to:

1. Confirm ZapSign org (or create it).
2. Grant submitter role with **Apps Management → Write**.
3. Start **business verification** (longest pole; may need CNPJ / legal package — separate gate).
4. Set customer support contact to `support@zapsign.com.br`.
5. Note portal challenge token for domain verify (do not submit final listing yet).

## Domain verification method (docs — pre-login)

Source: [OpenAI plugin submission — Domain verification](https://developers.openai.com/plugins/deploy/submission)

| Item | Guidance |
|---|---|
| Preferred method | **Well-known HTTPS challenge** (not DNS TXT/CNAME) |
| Challenge URL | `https://mcp.zapsign.com.br/.well-known/openai-apps-challenge` |
| Response body | Exact portal token as **plain text only** (no JSON/HTML/list) |
| Challenge base | MCP hostname or parent hostname; **paths ignored** |
| MCP URL planned | `https://mcp.zapsign.com.br/mcp` (Universal) |
| DNS-panel gate | Only if Worker cannot serve `/.well-known/openai-apps-challenge` — prefer Worker route |

Implementation note for later (post-login, when token exists): add a Worker route mirroring other `/.well-known` handlers; deploy before clicking Verify in the portal.

## Apps Management permission (docs — pre-login)

Source: [Get plugin submission access](https://developers.openai.com/plugins/deploy/submission)

1. Platform → organization roles settings.
2. Role for submitter: **Apps Management = Write**.
3. Owners already have it; non-owners need Write to create/submit drafts.
4. Reload `/plugins` after role change.

## Next unblocked OpenAI steps (after login gate clears)

1. Inspect org name / ID; confirm ZapSign ownership.
2. Start business verification immediately; upload legal docs if prompted (HARD GATE on CNPJ package if missing).
3. Set support contact to `support@zapsign.com.br`.
4. Confirm Apps Management Write on submitter.
5. Draft-only: create plugin shell only if useful for domain challenge token — **do not** submit for review until Phase 0 listing pack + Phase 1 demo credentials exist.
6. Merge this file into `LAUNCH_STATE.md` OPENAI section when Phase 0 creates it.

## Secrets policy

No credentials, tokens, or API keys recorded here. UI status descriptions only.
