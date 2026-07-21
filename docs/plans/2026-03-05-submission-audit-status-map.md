# Submission Audit — Full Status Map

## Context

The user wants a complete map of what's done and what remains from the submission audit (`docs/plans/2026-03-03-submission-audit-design.md`) before submitting to the Anthropic MCP Connectors Directory.

**Clarificación clave**: El desarrollador es ingeniero de ZapSign/Truora. Este es un proyecto oficial de la empresa — somos **first-party**, igual que Supabase y DocuSign.

**Decisión privacy policy**: Resuelta — usando la policy oficial de ZapSign (`zapsign.co/privacy-policy`) como first-party integration.

---

## Phase 1: Code Verification — ALL DONE


| Task | Description                         | Status | Completed As                                  |
| ---- | ----------------------------------- | ------ | --------------------------------------------- |
| 1A   | Audit tool annotations              | ✅ Done | W15A + H3                                     |
| 1B   | Audit tool descriptions             | ✅ Done | H3 (optimized for directory compliance)       |
| 1C   | Verify tool name lengths ≤ 64 chars | ✅ Done | W15A                                          |
| 1D   | Verify OAuth DCR callbacks          | ✅ Done | C2 (all 4 Claude URLs accepted)               |
| 1E   | Verify CORS headers                 | ✅ Done | MCP SDK `corsOptions` in `src/index.ts:12-21` |
| 1F   | Verify response truncation          | ✅ Done | S2B + M4 regression test                      |


---

## Phase 2: Documentation Consistency — ALL DONE


| Task | Description                   | Status | Notes                                                          |
| ---- | ----------------------------- | ------ | -------------------------------------------------------------- |
| 2A   | README.md                     | ✅ Done | Shows 12 tools, no webhook refs                                |
| 2B   | REVIEWER_GUIDE.md             | ✅ Done | 12 tools, test walkthrough correct                             |
| 2C   | SUBMISSION_PLAN.md            | ✅ Done | Updated in S-series                                            |
| 2D   | PROGRESS.md                   | ✅ Done | C3 removal documented; historical refs are fine (internal doc) |
| 2E   | Cross-check server.ts vs docs | ✅ Done | 12 tools registered = 12 documented                            |


---

## Phase 3: Privacy & Compliance — ALL DONE


| Task | Description                     | Status            | Notes                                                                                                                                                                                                               |
| ---- | ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3A   | Privacy policy URL              | ✅ Done            | Using ZapSign's official policy: zapsign.co/privacy-policy |
| 3B   | Privacy policy completeness     | ✅ Done            | `docs/PRIVACY_POLICY.md` + `docs/PRIVACY_POLICY_WEB.md` both exist                                                                                                                                                  |
| 3C   | 30-point Directory Policy audit | ✅ Done            | Verified in conversation — 27/30 pass, 3 human-pending (21, 23, 27). LICENSE file added.                                                                                                                           |
| 3D   | SECURITY.md                     | ✅ Done            | 68 lines, vulnerability reporting, response timeline                                                                                                                                                                |
| 3E   | No prohibited use cases         | ✅ Done            | No financial, content gen, or cross-service automation                                                                                                                                                              |


---

## Phase 4: E2E Testing — PENDING (HUMAN + CLAUDE)


| Task | Description                      | Status    | Owner  |
| ---- | -------------------------------- | --------- | ------ |
| 4A   | Deploy latest code               | ❌ Pending | Claude |
| 4B   | Test OAuth on Claude.ai          | ❌ Pending | Human  |
| 4C   | Test OAuth on Claude Desktop     | ❌ Pending | Human  |
| 4D   | Test OAuth on Claude Code        | ❌ Pending | Human  |
| 4E   | Test all 12 tools through Claude | ❌ Pending | Human  |
| 4F   | Test error scenarios             | ❌ Pending | Human  |


---

## Phase 5: Submission Prep — PENDING (HUMAN)


| Task | Description                            | Status    | Owner          |
| ---- | -------------------------------------- | --------- | -------------- |
| 5A   | Create dedicated ZapSign test account  | ❌ Pending | Human          |
| 5B   | Load demo data                         | ❌ Pending | Human          |
| 5C   | Update REVIEWER_GUIDE with credentials | ❌ Pending | Human + Claude |
| 5D   | Draft submission answers               | ❌ Pending | Claude         |
| 5E   | Final deploy and health check          | ❌ Pending | Claude         |
| 5F   | Submit to Anthropic MCP Connectors Directory | ❌ Pending | Human          |


---

## Summary: What Claude Can Still Do

1. **4A**: Deploy latest code to production
2. **5D**: Draft submission answers
3. **5E**: Final deploy + health check

## Summary: What Only Human Can Do

1. **4B-4F**: Test OAuth + tools on Claude.ai, Desktop, and Code
2. **5A**: Create ZapSign test account for reviewers
3. **5B**: Load demo data (3+ docs, 1+ template, 2-3 signers)
4. **5C**: Arrange secure reviewer credential handoff; the token is entered on the authorization page
5. **5F**: Submit to the Anthropic MCP Connectors Directory

---

## Privacy Policy Analysis (con experto compliance + benchmarks)

### Benchmark: Supabase y DocuSign


| Factor                     | Supabase / DocuSign        | Nuestro MCP Server                            |
| -------------------------- | -------------------------- | --------------------------------------------- |
| ¿Quién construye el MCP?   | Ellos mismos (first-party) | ZapSign/Truora (first-party ✅)                |
| ¿Quién es data controller? | Misma entidad que la API   | Misma entidad ✅                               |
| ¿Su policy cubre el MCP?   | Sí                         | Sí — la policy de ZapSign cubre sus productos |


**Conclusión**: Como proyecto oficial de ZapSign, SÍ aplica el precedente. Podemos usar `zapsign.co/privacy-policy`.

### Sección 8.1 de ZapSign

- **Ya no es problema** — ZapSign autoriza su propia integración oficial
- Un reviewer no cuestionará esto si queda claro que es first-party

### Decisión final: URLs oficiales de ZapSign


| Recurso                   | URL                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Privacy Policy**        | [https://zapsign.co/privacy-policy](https://zapsign.co/privacy-policy)                                                               |
| **Security Trust Center** | [https://app.vanta.com/zapsign.com.br/trust/2r7pzu657cx76es2ji28l](https://app.vanta.com/zapsign.com.br/trust/2r7pzu657cx76es2ji28l) |
| **Help Center**           | [https://clients.zapsign.com.br/en/help](https://clients.zapsign.com.br/en/help)                                                     |

