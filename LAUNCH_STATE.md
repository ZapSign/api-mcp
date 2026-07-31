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
| 0 — Recon / compliance | **Code complete; deploy pending** | `/privacy` implemented + tests green; `wrangler deploy` crashed in this environment — redeploy for production 200 |
| 1 — Demo account | Blocked | HARD GATE: no reviewer ZapSign API token in env |
| 2A — Anthropic submit | Pending | Pack: `docs/submission/anthropic.md` |
| 2B — OpenAI submit | Pending | Org/business verify can start in parallel |
| 3 — Follow-up until Live | Pending | No gate-to-12 during review |
| 4 — Close-out + gate to 12 | Pending | After both Live |

---

## Production endpoint evidence (2026-07-31)

| Check | Result | Evidence |
|---|---|---|
| `GET https://mcp.zapsign.com.br/health` | **200** | `{"status":"ok","version":"2.0.0",...}` |
| `GET https://mcp.zapsign.com.br/privacy` | **404** (pre-deploy) | Body `Not Found` — deploy Worker with Phase 0 route next |
| `GET https://mcp.zapsign.com.br/.well-known/oauth-authorization-server` | **200** | issuer `https://mcp.zapsign.com.br`; scopes include documents/signers/templates/webhooks/partner |
| `GET https://mcp.zapsign.com.br/mcp` | **401** | `invalid_token` / Missing or invalid access token (expected) |
| `GET https://mcp.zapsign.com.br/docs` | **200** | (baseline from prior cutover) |
| Local `/privacy` | **pass** | `test/unit/docs/privacy-page.test.ts` + `oauth-handler` GET /privacy |
| Registry tool count | **25** | `src/tools/registry.ts` |

**Next deploy step:** Re-run `npm run deploy` (wrangler) with Cloudflare credentials so production `/privacy` returns 200 HTML. A deploy attempt on 2026-07-31 exited abnormally before publish completed; production still 404. Until `/privacy` is live, directory forms must wait.

---

## ANTHROPIC track (CAO-147)

Mirrors Jira checklist. Update checkboxes as work completes.

### A. Pre-submission

- [x] Align artifacts to `mcp.zapsign.com.br` (README, REVIEWER_GUIDE, SUBMISSION_PLAN §3, submission packs)
- [x] Inventory locked to **25 tools** (not 12) for first submit
- [x] Privacy route implemented (`GET /privacy`); unit tests green
- [ ] Privacy **live** at `https://mcp.zapsign.com.br/privacy` (deploy pending)
- [x] Support = support@zapsign.com.br; SECURITY.md present (supported versions → 2.x)
- [x] Public docs page `/docs`; OAuth metadata verified
- [x] Allowed link URIs documented (ZapSign-owned only)
- [ ] MCP Inspector against production confirms 25 tools with `title` + four hints

### B. Reviewer test account

- [ ] Demo company + API token provisioned (HARD GATE)
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

### A. Org registration & verification

- [ ] ZapSign OpenAI org + Apps Management write
- [ ] Business / developer identity verification (HARD GATE — longest pole)
- [ ] Support contact registered (support@zapsign.com.br)
- [ ] Domain verification for `mcp.zapsign.com.br`

### B. Technical compliance

- [x] Public MCP URL documented; OAuth AS metadata OK
- [x] 25 tools with human titles + annotations in registry
- [x] CSP profiles documented in `docs/submission/openai.md`
- [ ] Stability/latency pass with demo account

### C. Listing assets & test materials

- [x] Frozen copy in `docs/submission/openai.md` (starter prompts, 5+/3− cases, countries)
- [ ] Demo credentials (shared with Anthropic track — Phase 1)

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

| Gate | Ticket | Ask |
|---|---|---|
| Demo/reviewer ZapSign API token | CAO-147 (+148) | Dedicated sandbox/reviewer company + token |
| Deploy `/privacy` if CI credentials missing | CAO-147 | `wrangler deploy` with Cloudflare account access |
| OpenAI 2FA / org login | CAO-148 | Code for logged-in session |
| OpenAI business verification docs | CAO-148 | CNPJ / legal package |
| DNS if well-known insufficient | CAO-148 | TXT/CNAME for domain verify |

---

## Changelog

| Date | Event |
|---|---|
| 2026-07-31 | Phase 0: `/privacy` route + submission packs + 25-tool doc alignment + day-0 snapshot; prod `/privacy` still 404 until deploy |
