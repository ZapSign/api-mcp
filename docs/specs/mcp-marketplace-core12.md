# MCP marketplace core-12 Worker gate

**Status:** Active (implement only after both marketplace listings are Live)  
**Last updated:** 2026-08-14  
**Depends on:** [`docs/specs/mcp-marketplace-launch.md`](mcp-marketplace-launch.md)  
**Code targets:** `src/tools/registry.ts`, `src/server.ts`, STDIO entry under `src/stdio/`

## Purpose

After both Claude and ChatGPT directory listings are Live, narrow the **remote Worker** MCP surface to the original **core 12** tools while keeping the **npm STDIO** package on the full **25-tool** union. Prevent silent tool-count drift between transports.

## Inputs

- Confirmed dual Live from marketplace launch acceptance (CAO-147 + CAO-148)
- Existing full registry via `registerAllTools` (25 tools today)
- Intended core set (documents×5 + signers×4 + templates×3):

| Domain | Tools |
|--------|--------|
| Documents | `list_documents`, `get_document`, `create_document`, `update_document`, `delete_document` |
| Signers | `add_signer`, `get_signer`, `update_signer`, `delete_signer` |
| Templates | `list_templates`, `get_template`, `create_from_template` |

- Worker factory `createServer` in `src/server.ts` (Worker path; today calls `registerAllTools`)
- STDIO entry `src/stdio/main.ts` (today builds via `createServer()` → full union; after gate must keep `registerAllTools` even if Worker switches)

## Outputs

- New `registerCoreTools(server)` in `src/tools/registry.ts` registering exactly the 12 tools above
- Worker (`src/server.ts`) calls `registerCoreTools` only
- STDIO entry continues to call `registerAllTools` (25)
- Hermetic unit tests green for the names listed under Acceptance
- Docs / listing copy amended only if portals require post-gate inventory updates (ops follow-up)

## Invariants

- Do **not** implement this gate until both marketplace listings are Live (see launch spec).
- Worker remote surface after gate = **exactly 12** tools (core set above).
- STDIO / npm `mcp-server-zapsign` surface remains **25** tools via `registerAllTools`.
- Tools still never call `fetch()` directly; scope annotations and `openWorldHint: true` unchanged per tool.
- OAuth scope strings and tool list advertised for the Worker match the core-12 surface (no orphan scopes required only by gated-off tools on the Worker path, as designed in implementation).
- No secrets in tests or commits.

## Error taxonomy

| Condition | Behavior |
|-----------|----------|
| Gate attempted before both Live | Blocked by process: keep Worker on 25; follow launch spec. |
| `registerCoreTools` registers ≠ 12 | Failing unit test; do not deploy. |
| Worker still calls `registerAllTools` | Failing unit test `createMcpServer_worker_uses_core_not_full_union`. |
| STDIO drops below 25 | Failing unit test `stdio_entry_still_registers_all_25`. |
| Scope / tool-list mismatch on Worker | Failing unit test `oauth_scopes_or_tool_list_match_core_surface`. |

No new ZapSign API error codes.

## Acceptance

WHEN `registerCoreTools` is invoked on a fresh `McpServer`  
THEN exactly **12** tools are registered and they are the core set listed in Inputs  
(test: `registerCoreTools_exposes_exactly_12_tools`).

WHEN the Worker MCP server factory builds a server  
THEN it registers via `registerCoreTools`, not the full union  
(test: `createMcpServer_worker_uses_core_not_full_union`).

WHEN the STDIO entrypoint builds a server  
THEN it still registers all **25** tools via `registerAllTools`  
(test: `stdio_entry_still_registers_all_25`).

WHEN Worker OAuth metadata or advertised tool list is inspected after the gate  
THEN scopes / tool list match the core-12 surface as designed  
(test: `oauth_scopes_or_tool_list_match_core_surface`).

## Intended failing tests (Phase 4 red → green)

Recorded from the SDD marketplace plan; write these before changing the registry:

1. `registerCoreTools_exposes_exactly_12_tools`
2. `createMcpServer_worker_uses_core_not_full_union`
3. `stdio_entry_still_registers_all_25`
4. `oauth_scopes_or_tool_list_match_core_surface`

## Out of scope

- Dual marketplace form submit / Live follow-up (parent launch spec)
- Removing tools from npm STDIO
- Changing tool handler behavior beyond which register function the Worker calls
- Portal re-submission unless a directory requires updated inventory after gate
