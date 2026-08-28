# MCP marketplace dual launch

**Status:** Active  
**Last updated:** 2026-08-28
**Tracks:** [CAO-146](https://truora.atlassian.net/browse/CAO-146) · [CAO-147](https://truora.atlassian.net/browse/CAO-147) · [CAO-148](https://truora.atlassian.net/browse/CAO-148)  
**Ops checklist:** [`LAUNCH_STATE.md`](../../LAUNCH_STATE.md)  
**Frozen packs:** [`docs/submission/anthropic.md`](../submission/anthropic.md) · [`docs/submission/openai.md`](../submission/openai.md)

## Purpose

Get ZapSign MCP publicly installable in **both** Claude Connectors and ChatGPT Apps directories with a truthful **25-tool** inventory, then record Live evidence and day-0 metrics baselines. This is an ops/acceptance contract for Phases 2–3; it does not change Worker tool registration.

## Inputs

- Human org sessions with directory-admin rights:
  - Claude **Team** or **Enterprise** org (Directory submissions portal)
  - OpenAI ZapSign Platform org with Apps Management write + completed Persona identity
- Demo / reviewer ZapSign API token sourced from AWS Secrets Manager secret `stress-testing` — **secret name only in git and tickets; never commit or paste secret values**
- Frozen submission copy in `docs/submission/anthropic.md` and `docs/submission/openai.md`
- Production Worker at canonical origin `https://mcp.zapsign.com.br` (privacy, docs, OAuth, MCP)

## Outputs

- Anthropic directory **submission ID** (or portal confirmation evidence) + date on CAO-147 / `LAUNCH_STATE.md`
- OpenAI Apps / plugin **submission ID** (or portal confirmation evidence) + date on CAO-148 / `LAUNCH_STATE.md`
- Public **Live** listing URLs (or install-path screenshots) for both directories
- E1 (Anthropic) and E2 (OpenAI) day-0 baselines logged on CAO-146 / marketing snapshots

## Invariants

- Canonical public MCP URL in all submission artifacts is `https://mcp.zapsign.com.br/mcp` (not `mcp.zapsign.co`, not legacy/`fabricio` hosts).
- First-submit tool inventory is **25 tools** until **both** listings are Live; do not gate remote surface to core 12 during review.
- No secrets in git: API tokens, Persona codes, OpenAI challenge tokens, and AWS SM values stay in session env / secrets stores only.
- Submission packs remain the frozen source of truth for form fields; drift is fixed in packs + `LAUNCH_STATE.md`, not ad-hoc portal improvisation.
- Worker may keep `.co` as a dual-host alias; that alias must not appear in directory forms or reviewer-facing submission URLs.

## Error taxonomy

| Condition | Behavior |
|-----------|----------|
| Claude session is individual Max (or lacks Directory admin) | Phase 2A blocked: cannot open Team/Enterprise directory submission portal. Switch to ZapSign Team/Enterprise org with Directory management access. |
| OpenAI Persona identity incomplete (email OTP / CNPJ / biometrics) | Phase 2B hard-gated: Create plugin With MCP blocked. Complete Persona for `andre@zapsign.com.br` before listing create. |
| OpenAI domain challenge token missing | Do not deploy empty challenge; set `OPENAI_APPS_CHALLENGE_TOKEN` only after portal issues token, then deploy. |
| Demo token missing / invalid | Re-fetch AWS SM secret `stress-testing` into session env only; validate against ZapSign docs API before sharing via secure form fields. |
| Portal rejects listing or requests changes | Respond via support@zapsign.com.br within 48h; update `LAUNCH_STATE.md`; do not change tool count until both Live (unless reviewer requires a non-count fix). |
| Reviewer cannot reach `/privacy` or OAuth metadata | Treat as production incident; fix deploy before resubmitting. |

No new product error codes. These are ops/auth gates, not MCP tool failures.

## Acceptance

WHEN `GET https://mcp.zapsign.com.br/privacy` is requested  
THEN the response is **200** and the body identifies ZapSign MCP privacy policy.

WHEN Anthropic and OpenAI submission packs are used for form fill  
THEN both packs list the same **25** tools and use only `mcp.zapsign.com.br` public URLs (no legacy `.co` in form fields).

WHEN Anthropic directory submit completes  
THEN a submission ID (or equivalent confirmation) and date are recorded on CAO-147 and in `LAUNCH_STATE.md`.

WHEN OpenAI Apps / plugin submit completes  
THEN a submission ID (or equivalent confirmation) and date are recorded on CAO-148 and in `LAUNCH_STATE.md`.

WHEN both directory reviews approve the listings  
THEN each listing is publicly installable (Live) and Live evidence is attached to CAO-147/148 and `LAUNCH_STATE.md`.

WHEN both listings are Live  
THEN E1 (Anthropic) and E2 (OpenAI) day-0 baselines are logged on CAO-146 (and marketing snapshot path as documented in `LAUNCH_STATE.md`).

WHEN submission artifacts are reviewed before send  
THEN they contain no secret values and no `mcp.zapsign.co` / legacy host as the canonical server URL.

WHEN a tool returns ZapSign data to an MCP host
THEN the response contains only workflow fields and omits unnecessary identifiers, contact fields,
government identifiers, biometric fields, geolocation, payment processor data, and raw metadata.

WHEN partner or payment tools validate input
THEN they reject government identifiers, processor IDs, free-form payment notes, and payment credentials.

WHEN OpenAI scans tool annotations
THEN every annotation is explicit and matches behavior, including `destructiveHint: true` for batch signing.

## Out of scope

- Phase 4 Worker gate to core 12 tools — see sibling [`docs/specs/mcp-marketplace-core12.md`](mcp-marketplace-core12.md)
- Registry / `registerCoreTools` implementation (code cycle only after both Live)
- Changing npm STDIO full-union tool count during marketplace review
- Real ZapSign API soak tests beyond session demo-token validation
- MCP Inspector annotation pass and REVIEWER_GUIDE E2E (Phase 1 leftovers; tracked in `LAUNCH_STATE.md`, not blockers for this acceptance contract once packs are frozen)
