# MCP Marketplace Dual Publication — Launch State

**Decision locked:** Submit truthful **25-tool** inventory first. Gate remote marketplace surface to core 12 only after **both** listings are Live (Phase 4).  
**Canonical server:** `https://mcp.zapsign.com.br/mcp`  
**Repo:** [ZapSign/api-mcp](https://github.com/ZapSign/api-mcp) · **npm:** `mcp-server-zapsign`  
**Epics/tasks:** [CAO-146](https://truora.atlassian.net/browse/CAO-146) · [CAO-147](https://truora.atlassian.net/browse/CAO-147) · [CAO-148](https://truora.atlassian.net/browse/CAO-148)

Do **not** put `mcp.zapsign.co` or legacy/`fabricio` URLs in submission forms. Worker may keep `.co` as a dual-host alias.

---

## Phase progress

| Phase | Status | Notes |
|---|---|---|
| 0 — Recon / compliance | **Complete** | Commits `b3b32a3`, `e5b044a`, `7ae7f61`; Worker deployed (Version `adeae044-b5bb-4980-a1fd-ccc0c74bf15a`); `/privacy` **200** |
| 1 — Demo account | **Blocked** | HARD GATE: GitHub secret `ZAPSIGN_API_TOKEN` exists; **not** in local env / `.dev.vars` / Wrangler — ask on CAO-147 `133093` + CAO-148 |
| 2A — Anthropic submit | Pending | Pack ready; blocked on Phase 1 demo credentials |
| 2B — OpenAI submit | **In progress / gated** | Login cleared; ZapSign org + Owner confirmed; Persona business verify started — email code HARD GATE; plugin create blocked until verified |
| 3 — Follow-up until Live | Pending | No gate-to-12 during review |
| 4 — Close-out + gate to 12 | Pending | After both Live |

---

## Production endpoint evidence (2026-07-31 post-deploy)

| Check | Result | Evidence |
|---|---|---|
| `GET https://mcp.zapsign.com.br/health` | **200** | `{"status":"ok","version":"2.0.0",...}` |
| `GET https://mcp.zapsign.com.br/privacy` | **200** | HTML includes “Privacy Policy” + “ZapSign MCP” |
| `GET https://mcp.zapsign.com.br/docs` | **200** | Public docs page |
| `GET https://mcp.zapsign.com.br/mcp` | **401** | `invalid_token` / Missing or invalid access token (expected) |
| `GET https://mcp.zapsign.com.br/.well-known/oauth-authorization-server` | **200** | issuer `https://mcp.zapsign.com.br`; scopes include documents/signers/templates/webhooks/partner |
| Deploy | **OK** | `npm run deploy` → `zapsign-mcp`; Version ID `adeae044-b5bb-4980-a1fd-ccc0c74bf15a`; custom domains `mcp.zapsign.com.br`, `mcp.zapsign.co` |
| Registry tool count | **25** | `src/tools/registry.ts` |
| OpenAI challenge route (code) | **Implemented** | `GET /.well-known/openai-apps-challenge` via `OPENAI_APPS_CHALLENGE_TOKEN` (not deployed until portal token exists) |

**Phase 0 commits (local main, ahead of origin by 3 — not required for deploy):**

| SHA | Summary |
|---|---|
| `b3b32a3` | `feat(privacy): serve GET /privacy for directory submissions` |
| `e5b044a` | `docs(submission): freeze 25-tool marketplace packs and launch state` |
| `7ae7f61` | `chore(marketing): record day-0 marketplace metrics baseline` |

Do **not** submit Anthropic/OpenAI directory forms until Phase 1 demo credentials exist (privacy is now live). OpenAI also requires completed Persona business verification before plugin create.

---

## ANTHROPIC track (CAO-147)

Mirrors Jira checklist. Update checkboxes as work completes.

### A. Pre-submission

- [x] Align artifacts to `mcp.zapsign.com.br` (README, REVIEWER_GUIDE, SUBMISSION_PLAN §3, submission packs)
- [x] Inventory locked to **25 tools** (not 12) for first submit
- [x] Privacy route implemented (`GET /privacy`); unit tests green
- [x] Privacy **live** at `https://mcp.zapsign.com.br/privacy` (deploy Version `adeae044…`)
- [x] Support = support@zapsign.com.br; SECURITY.md present (supported versions → 2.x)
- [x] Public docs page `/docs`; OAuth metadata verified
- [x] Allowed link URIs documented (ZapSign-owned only)
- [ ] MCP Inspector against production confirms 25 tools with `title` + four hints

### B. Reviewer test account

- [ ] Demo company + API token provisioned (HARD GATE — GitHub secret name exists; local session missing)
- [ ] Demo data loaded (3+ docs, 1 template, 2–3 signers)
- [ ] Token validated via `GET /api/v1/docs/`
- [ ] REVIEWER_GUIDE walkthrough E2E
- [ ] Freeze credentials until both reviews conclude

### C. Submission

- [ ] Fill form from `docs/submission/anthropic.md`
- [ ] Screenshot confirmation → attach here + CAO-147 comment
- [ ] Record submission date

### D. Follow-up until Live

- [ ] Monitor support@zapsign.com.br; respond &lt; 48h
- [ ] Weekly status; escalate mcp-review@anthropic.com after 3 weeks silence
- [ ] On approval: listing screenshot + fresh install + OAuth + `list_documents`
- [ ] E1 day-0 baseline logged

**Submission date:** _pending_  
**Live date:** _pending_

---

## OPENAI track (CAO-148)

Merged from `docs/submission/openai-org-status.md`.

### A. Org registration & verification

- [x] ZapSign OpenAI org + Apps Management write (Owner: André Chaves; org `org-zytAEIEHDhfBrgREh8gTiYUA`)
- [ ] Business / developer identity verification (Persona started — email code HARD GATE)
- [ ] Support contact registered (support@zapsign.com.br) — listing form blocked until verify
- [ ] Domain verification for `mcp.zapsign.com.br` (Worker route ready; token not issued yet)

**HARD GATE (active) — Persona email code:** Business verification inquiry started; 5-digit code sent to `andre@zapsign.com.br`. Complete Persona (then CNPJ/legal package if prompted). Plugin create With MCP shows “Complete identity verification” until done. Details: [`docs/submission/openai-org-status.md`](docs/submission/openai-org-status.md).

### B. Technical compliance

- [x] Public MCP URL documented; OAuth AS metadata OK
- [x] 25 tools with human titles + annotations in registry
- [x] CSP profiles documented in `docs/submission/openai.md`
- [x] Worker `GET /.well-known/openai-apps-challenge` implemented (secret-driven)
- [ ] Stability/latency pass with demo account

### C. Listing assets & test materials

- [x] Frozen copy in `docs/submission/openai.md` (starter prompts, 5+/3− cases, countries)
- [ ] Demo credentials (shared with Anthropic track — Phase 1 HARD GATE)

### D. Submission & follow-up

- [ ] Submit via platform portal
- [ ] Screenshot + CAO-148 comment
- [ ] Follow-up until Live; E2 day-0 baseline

**Submission date:** _pending_  
**Live date:** _pending_

---

## Metrics baseline (day 0 — marketplace launch prep)

See `docs/marketing/STATUS.md` (2026-07-31 entry) and `docs/marketing/snapshots/`.

| Source | What | Where it will come from |
|---|---|---|
| npm weekly downloads | `mcp-server-zapsign` (+ optional community benchmark) | `scripts/marketing/take-snapshot.mjs` → npm registry API |
| DCR / OAuth funnel | Client registrations, token issuance | Cloudflare Worker logs / analytics (instrument before Live day-0) |
| Docs / privacy traffic | `/docs`, `/privacy`, `/mcp` landing | GA4 `G-GNJFSQFD50` + Clarity (consent-gated marketing pages) |
| Directory installs | E1/E2 | Anthropic/OpenAI dashboards + Worker DCR after Live |

---

## Hard gates (human)

| Gate | Ticket | Ask | Status |
|---|---|---|---|
| Demo/reviewer ZapSign API token (local) | CAO-147 (+148) | Put production/reviewer token in session env or gitignored `.dev.vars` (GitHub secret already set; not readable via API) | **ACTIVE** |
| Deploy `/privacy` | CAO-147 | `wrangler deploy` with Cloudflare account access | **Cleared** — privacy 200 |
| OpenAI 2FA / org login | CAO-148 | Authenticated ZapSign Platform session | **Cleared** |
| Persona email confirmation code | CAO-148 | 5-digit code to `andre@zapsign.com.br` (or complete Persona manually) | **ACTIVE** |
| OpenAI business verification docs | CAO-148 | CNPJ / legal package + biometrics in Persona (after email code) | Pending |
| DNS if well-known insufficient | CAO-148 | TXT/CNAME for domain verify | Pending (prefer Worker route) |

### Phase 1 HARD GATE — precise ask

- **What:** Production/reviewer ZapSign API token available **locally** to this agent session
- **Where:** Env `ZAPSIGN_API_TOKEN` or gitignored `.dev.vars` — never in git/URL/Jira/LAUNCH_STATE
- **Evidence already:** `gh secret list` shows repo secret `ZAPSIGN_API_TOKEN` (2026-07-31); Wrangler secrets have only `COOKIE_ENCRYPTION_KEY`
- **Why:** Validate `GET https://api.zapsign.com.br/api/v1/docs/?page=1`, load MCP Review demo data, freeze REVIEWER_GUIDE identifiers
- **Expected artifact:** Validated token + company with 3 docs (pending/signed/mixed), 1 DOCX template with `{{client_name}}`, `{{address}}`, `{{contract_date}}`, 2–3 signers

---

## Next steps

1. Human: put Phase 1 token in local env / `.dev.vars` → load demo data → E2E REVIEWER_GUIDE → freeze.
2. Human: Persona email code (+ finish business verify) → Create plugin → domain challenge secret → deploy → submit listing.
3. After (1): Phase 2A Anthropic form submit (not before).
4. Optional: MCP Inspector production pass for 25 tools with `title` + four hints.

---

## Changelog

| Date | Event |
|---|---|
| 2026-07-31 | Phase 0 code/docs complete (`b3b32a3`, `e5b044a`, `7ae7f61`); prod `/privacy` was 404 until deploy |
| 2026-07-31 | Deploy OK (Version `adeae044…`); `/privacy` **200**; Phase 1 HARD GATE on CAO-147 comment `133026` + CAO-148 comment `133027`; OpenAI login gate merged from `openai-org-status.md` |
| 2026-07-31 | OpenAI login cleared; ZapSign org confirmed; Persona business verify started; Phase 1 local-token HARD GATE restated (CAO-147 `133093`); OpenAI challenge route implemented in code; plugin create blocked until identity verify |
