# ZapSign MCP Server — Full Submission Audit & Preparation Design

**Date**: 2026-03-03
**Status**: Approved (scoped to C1: tool annotations audit first)
**Goal**: Identify and fix all potential rejection risks before submitting to Anthropic MCP Connectors Directory

---

## 1. Context

The ZapSign MCP server is at v1.0.0, production-deployed to Cloudflare Workers, with exactly 12 active tools and 228 passing unit tests. The S2B response truncation commit was just merged.

**What remains**: A thorough audit against Anthropic's published submission requirements, documentation consistency fixes, compliance verification, end-to-end testing on all Claude surfaces, and human tasks for test account setup and directory submission.

---

## 2. Risk Assessment (Ranked by Rejection Likelihood)

### Critical — Immediate Rejection

| # | Risk | Details | Audit Action |
|---|------|---------|--------------|
| C1 | **Missing/incomplete tool annotations** | 30% of all rejections. Every tool needs `readOnlyHint`, `destructiveHint`, `title`, `idempotentHint` | Audit all 12 tool files, verify annotations |
| C2 | **OAuth callback URLs not supported** | Claude requires 4 specific callbacks: `claude.ai`, `claude.com`, `localhost:6274/oauth/callback`, `localhost:6274/oauth/callback/debug` | Verify DCR accepts these, test on Claude.ai |
| C3 | **Documentation inconsistency** | The connector currently exposes exactly 12 tools | Audit README, REVIEWER_GUIDE, SUBMISSION_PLAN |
| C4 | **Test account missing** | Reviewer credentials are not embedded in public documentation | Create account, load demo data, share securely |

### High — Likely Revision Request

| # | Risk | Details | Audit Action |
|---|------|---------|--------------|
| H1 | **Privacy policy on GitHub URL only** | GitHub URLs change with repo transfers; Anthropic recommends stable HTTPS URL | Add `/privacy` route to worker |
| H2 | **Never tested on Claude.ai / Desktop** | Submission requires a record of tested surfaces | Test OAuth + tools on all 3 surfaces |
| H3 | **Tool descriptions not optimized** | Policy: "narrowly and unambiguously describe what each tool does" | Review all 12 descriptions |
| H4 | **Support email authenticity** | `support@zapsign.com.br` — must actually receive and respond to emails | Verify inbox access |

### Medium — Could Delay Acceptance

| # | Risk | Details | Audit Action |
|---|------|---------|--------------|
| M1 | ~~**No custom domain**~~ | **Resolved** — `mcp.zapsign.co` active | N/A |
| M2 | **CORS headers** | Must work for browser-based Claude.ai | Verify CORS configuration |
| M3 | **API endpoint ownership** | Requirement 25: verify ownership/control of connected APIs | Prepare partnership documentation if needed |
| M4 | **Response pagination gaps** | Large lists may still hit limits even with truncation | Verify pagination on list endpoints |

---

## 3. Audit Phases & Checkpoints

### Phase 1: Code Verification (Automated)

**Goal**: Verify all 12 tools meet Anthropic's technical requirements in actual code.

| Task | Description | Pass Criteria |
|------|-------------|---------------|
| 1A | Audit tool annotations on all 12 tools | Every tool has `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`, `title` |
| 1B | Audit tool descriptions for clarity | Each description is narrow, unambiguous, matches actual behavior |
| 1C | Verify tool name lengths | All names ≤ 64 characters |
| 1D | Verify OAuth DCR callback handling | DCR accepts Claude's 4 required callback URLs |
| 1E | Verify CORS headers | Browser-based Claude.ai requests succeed |
| 1F | Verify response truncation (S2B) | Responses > 80K chars are truncated with notice |

**Checkpoint 1**: All code-level issues identified. Fixes committed as `fix(S2C): audit fixes for submission compliance`.

**Resume point**: If interrupted, re-run tasks 1A-1F. All are idempotent reads.

---

### Phase 2: Documentation Consistency

**Goal**: All documentation accurately reflects the current 12-tool, v1.0.0 state.

| Task | Description | Pass Criteria |
|------|-------------|---------------|
| 2A | Audit README.md | Tool count says 12, examples reference only active tools, all links work |
| 2B | Audit REVIEWER_GUIDE.md | Tool table shows exactly 12 tools, walkthrough and annotations are accurate |
| 2C | Audit SUBMISSION_PLAN.md | S-series status updated, gap table reflects current state |
| 2D | Update PROGRESS.md | S2B marked done, S2C-S2D in progress |
| 2E | Cross-check tool list in server.ts vs docs | Registration code matches documented tool list exactly |

**Checkpoint 2**: All docs consistent. Committed as `docs(S2D): documentation consistency audit`.

**Resume point**: Run `grep -r "14 tools\|14 MCP\|webhook" docs/ README.md` to find remaining inconsistencies in historical planning notes.

---

### Phase 3: Privacy & Compliance

**Goal**: Meet all Anthropic policy and legal requirements.

| Task | Description | Pass Criteria |
|------|-------------|---------------|
| 3A | Add `/privacy` route to worker | GET `/privacy` returns styled HTML privacy policy |
| 3B | Verify privacy policy completeness | Covers: collection, usage, storage, retention, sharing, contact |
| 3C | Audit against 30-point Directory Policy | All 30 requirements checked off |
| 3D | Verify SECURITY.md meets T&C | Vulnerability reporting mechanism documented, response timeline stated |
| 3E | Verify no prohibited use cases | No financial transactions, no content generation, no cross-service automation |

**Checkpoint 3**: All compliance issues resolved. Committed as `feat(S3): compliance and privacy endpoint`.

**Resume point**: Check `/privacy` endpoint returns 200. Review 30-point checklist in Section 4 below.

---

### Phase 4: End-to-End Testing

**Goal**: Verify the full OAuth + tools flow works on all Claude surfaces.

| Task | Description | Pass Criteria |
|------|-------------|---------------|
| 4A | Deploy latest code to production | `curl /health` returns `{"status":"ok","version":"1.0.0"}` |
| 4B | Test OAuth flow on Claude.ai | Full auth cycle completes, tools appear |
| 4C | Test OAuth flow on Claude Desktop | Full auth cycle completes, tools appear |
| 4D | Test OAuth flow on Claude Code | Full auth cycle completes, tools appear |
| 4E | Test all 12 tools through Claude | Each tool returns expected results with demo data |
| 4F | Test error scenarios | Invalid token → actionable error, rate limit → retry message, bad input → validation error |

**Checkpoint 4**: All surfaces tested, issues fixed. Fixes committed as needed.

**Resume point**: Keep a test log (Phase 4 results table in Section 5 below). Re-test only failed items.

---

### Phase 5: Submission Preparation (Human Tasks)

**Goal**: Prepare everything needed for the directory submission.

| Task | Description | Owner | Pass Criteria |
|------|-------------|-------|---------------|
| 5A | Create dedicated ZapSign test account | Human | New account active, API token generated |
| 5B | Load demo data | Human | 3+ documents (pending/signed/mixed), 1+ template with `{{fields}}`, 2-3 signers |
| 5C | Update REVIEWER_GUIDE.md with connection instructions | Human + Claude | Secure credential handoff, demo data inventory |
| 5D | Draft submission answers | Claude | All fields pre-filled in a template (Section 6 below) |
| 5E | Final deploy and health check | Claude | All endpoints return expected responses |
| 5F | Submit to Anthropic MCP Connectors Directory | Human | Submission completed |

**Checkpoint 5**: Submission completed. Begin monitoring period.

**Resume point**: Check the submission confirmation and monitor `support@zapsign.com.br`.

---

## 4. Anthropic 30-Point Directory Policy Checklist

Use this to audit compliance. Check off each item.

### Safety & Security (1-6)

- [ ] **1**: Does not facilitate violations of Anthropic's Usage Policy
- [ ] **2**: Does not evade or circumvent Claude's safety guardrails
- [ ] **3**: Prioritizes user privacy, complies with applicable laws
- [ ] **4**: Only collects data necessary for functionality (API token only, no conversation data)
- [ ] **5**: Does not infringe intellectual property rights
- [ ] **6**: Cannot access users' previous chats or memory contents

### Compatibility (7-12)

- [ ] **7**: Tool descriptions narrowly and unambiguously describe what each tool does
- [ ] **8**: Descriptions precisely match actual functionality
- [ ] **9**: Does not create confusion with other directory MCP servers
- [ ] **10**: Cannot coerce Claude into calling other servers
- [ ] **11**: Cannot interfere with Claude calling tools from other servers
- [ ] **12**: Does not direct Claude to pull behavioral instructions from external sources

### Functionality (13-19)

- [ ] **13**: Delivers reliable performance with fast response times
- [ ] **14**: Gracefully handles errors with helpful (not generic) feedback
- [ ] **15**: Token usage proportional to task complexity; tool names ≤ 64 chars
- [ ] **16**: Uses secure OAuth 2.0 for authentication
- [ ] **17**: Provides all applicable tool annotations (`readOnlyHint`, `destructiveHint`, `title`)
- [ ] **18**: Supports Streamable HTTP transport
- [ ] **19**: Uses reasonably current dependency versions

### Developer Requirements (20-27)

- [ ] **20**: Clear, accessible privacy policy
- [ ] **21**: Verified contact information and support channels
- [ ] **22**: Documentation covering purpose, usage, and troubleshooting
- [ ] **23**: Testing account with sample data
- [ ] **24**: At least 3 working examples
- [ ] **25**: Verified ownership/control of connected API endpoints
- [ ] **26**: Commitment to maintain server and address issues promptly
- [ ] **27**: Agreement to MCP Directory Terms and Conditions

### Prohibited Use Cases (28-30)

- [ ] **28**: No financial transactions (transfer money, crypto, etc.)
- [ ] **29**: No content generation (image/video/audio)
- [ ] **30**: No cross-service automation (limited to ZapSign API only)

---

## 5. Phase 4 Test Log Template

Fill this in during end-to-end testing:

| Surface | OAuth Flow | Tool Tested | Result | Notes |
|---------|------------|-------------|--------|-------|
| Claude.ai | [ ] Pass / [ ] Fail | list_documents | [ ] Pass / [ ] Fail | |
| Claude.ai | | get_document | [ ] Pass / [ ] Fail | |
| Claude.ai | | create_document | [ ] Pass / [ ] Fail | |
| Claude Desktop | [ ] Pass / [ ] Fail | list_templates | [ ] Pass / [ ] Fail | |
| Claude Desktop | | add_signer | [ ] Pass / [ ] Fail | |
| Claude Code | [ ] Pass / [ ] Fail | get_signer | [ ] Pass / [ ] Fail | |
| Claude Code | | update_document | [ ] Pass / [ ] Fail | |
| Claude Code | | delete_document | [ ] Pass / [ ] Fail | |

---

## 6. Submission Draft Answers

Prepare these answers for the Anthropic MCP Connectors Directory submission:

### Server Basics

- **Name**: ZapSign MCP Server
- **URL**: `https://mcp.zapsign.co/mcp`
- **Tagline**: Create, send, and track e-signatures in Claude.
- **Description**: Bring ZapSign’s e-signature workflow into Claude. Create signing requests from a PDF URL or reusable template, add signers, deliver signing links by email or WhatsApp, and track document status—all in one conversation.
- **Use cases**: (1) Create and send documents for signature via natural conversation, (2) Check document signing status and track pending signatures, (3) Create documents from pre-built templates with dynamic field replacement

### Technical Specs

- **Auth type**: OAuth 2.0 with PKCE (S256)
- **Transport**: Streamable HTTP (Cloudflare Workers)
- **Read/Write**: Both (read: list/get tools; write: create/update/delete tools)
- **Connection requirements**: The user enters their own ZapSign API token on the authorization page after Claude starts OAuth. The token is never part of the connector URL.

### Tools Inventory (12 Active)

| Tool Name | Type | Description |
|-----------|------|-------------|
| list_documents | Read | List documents with pagination and optional status filter |
| get_document | Read | Get full details of a specific document by token |
| create_document | Write | Create a new document from a PDF URL or base64 content |
| update_document | Write | Update document metadata (name, deadline, language) |
| delete_document | Write (destructive) | Delete a document |
| add_signer | Write | Add a new signer to an existing document |
| get_signer | Read | Get signer details and signing status |
| update_signer | Write | Update signer information (name, email, phone) |
| delete_signer | Write (destructive) | Remove a signer from a document |
| list_templates | Read | List available document templates |
| get_template | Read | Get template details including dynamic fields |
| create_from_template | Write | Create a new document from a template with field values |

### Branding

- **Logo URL**: `https://raw.githubusercontent.com/fabricioism/zapsign-mcp/main/icon.svg`
- **Category**: Productivity / Document Management

### Documentation & Support

- **Docs**: https://github.com/fabricioism/zapsign-mcp
- **Privacy Policy**: `https://mcp.zapsign.co/privacy` (after Phase 3)
- **Support**: support@zapsign.com.br
- **Security**: security@zapsign.com.br

### Test Account

- **Method**: Share credentials through an approved secure channel; the reviewer enters the token on the authorization page
- **Setup instructions**: See REVIEWER_GUIDE.md Section "Test Walkthrough"
- **Pre-loaded data**: Pending human setup; record the inventory before submission

### Launch Readiness

- **GA date**: 2026-02-28 (v1.0.0)
- **Surfaces tested**: Pending human verification; record results before submission

---

## 7. Post-Submission Monitoring Plan

After form submission:

1. **Monitor email**: Check `support@zapsign.com.br` daily for 2 weeks
2. **Keep test account active**: Do not modify or delete demo data during review
3. **Keep production stable**: No breaking changes to deployed code during review
4. **Be ready to respond**: Anthropic may request clarifications, fixes, or live demos
5. **Expected timeline**: ~2 weeks for initial review response

### If Rejected

1. Read rejection reason carefully
2. Return to the relevant Phase (1-5) based on the issue
3. Fix, re-test, and resubmit
4. Each rejection cycle adds ~2 weeks

---

## 8. Summary

| Phase | Effort | Owner | Checkpoint |
|-------|--------|-------|------------|
| Phase 1: Code Verification | ~2 hours | Claude | Commit `fix(S2C)` |
| Phase 2: Doc Consistency | ~1 hour | Claude | Commit `docs(S2D)` |
| Phase 3: Privacy & Compliance | ~2 hours | Claude | Commit `feat(S3)` |
| Phase 4: E2E Testing | ~2 hours | Human + Claude | Test log filled |
| Phase 5: Submission Prep | ~1.5 hours | Human | Form submitted |

**Total estimated effort**: ~8.5 hours across Claude + Human

**Critical path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (sequential, each depends on prior)
