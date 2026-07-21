# ZapSign MCP Server — Agent Instructions

## Project Overview

Remote MCP server connecting Claude AI to ZapSign's electronic signature API via Cloudflare Workers.
Stack: TypeScript strict, Cloudflare Workers, @modelcontextprotocol/sdk ^1.27.0, agents 0.6.0, OAuth 2.1.

## Dev Commands

```bash
npm run dev          # wrangler dev (local server)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
npm run test         # vitest run
npm run test:watch   # vitest watch
npm run deploy       # wrangler deploy
```

## Architecture

- `src/index.ts` — Worker entry point (OAuthProvider wiring)
- `src/server.ts` — McpServer factory (new instance per request)
- `src/auth/` — OAuth handler, API token validation, token exchange passthrough
- `src/api/` — ZapSign HTTP client wrapper, endpoint constants
- `src/tools/` — full MCP tool union (documents, signers, templates, webhooks, partner) + STDIO entry in `src/stdio/`
- `src/errors/` — Error class hierarchy (base, api, auth, validation)
- `src/types/` — Cloudflare Env bindings, ZapSign API types
- `src/utils/` — Logger, MCP response formatters, scope enforcement

## Coding Standards

These are non-negotiable constraints. Every agent MUST follow them.

### Language Rules

- All identifiers in English: variable names, function names, class names, type names, enum values
- All comments in English: only write comments that explain WHY, never WHAT
- No narration comments: never write `// Create the client` before `const client = new Client()`
- JSDoc only on exported functions: with `@param`, `@returns`, `@throws`

### Structural Rules

- Early return pattern: always. Guard clauses at the top of every function.
- No `else` after `return`: ever. Use early return instead.
- No `else` blocks: restructure with early returns or ternaries.
- No `switch` statements: use object maps (Record<string, handler>) or strategy pattern.
- Maximum 2 levels of nesting: if inside an `if` inside a `for`, that's 2. Extract to a function.
- Cyclomatic complexity < 10: per function. Prefer extracting helpers.
- Cognitive complexity < 10: per function.
- Maximum function length: 40 lines (excluding type signatures and JSDoc).
- Single responsibility: each function does ONE thing.

### Type Safety Rules

- No `any`: ever. Use `unknown` + type guards if the type is truly unknown.
- No `as` type assertions: except when interfacing with untyped libraries (document with comment).
- Errors are typed: catch blocks use `instanceof` checks, never catch untyped errors silently.
- No silent catch blocks: every catch must either re-throw, log, or return an error.
- No hardcoded strings for categories/states: use `as const` objects (NOT TypeScript enums).
- Use `as const` objects for finite value sets (NOT `enum`).
- Booleans only for true binary states.

### Naming Conventions

- Files: kebab-case (`create-document.ts`, `api-error.ts`)
- Types/Interfaces/Classes: PascalCase (`ZapSignDocument`, `AuthError`)
- Functions/Variables: camelCase (`listDocuments`, `accessToken`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_PAGE_SIZE`)
- Const value objects: PascalCase name, PascalCase keys (`DocumentStatus.Pending`)
- Log events: snake_case, past tense, max 35 chars (`document_created`, `oauth_authorization_completed`)
- MCP tool names: snake_case (`list_documents`, `create_from_template`)

### Architecture Patterns

- Tools never call fetch() directly: always go through `ZapSignClient`
- Tools never import env: they receive `ZapSignClient` already configured
- Each tool file exports a single `registerXxxTool(server)` function
- The registry is the only file that imports all tool modules
- Error handling at tool level: each tool catches errors and returns `toolError()`, never throws
- Scope enforcement at tool level: each tool MUST verify the granted OAuth scope before executing

### MCP-Specific Rules

- Every tool MUST have `annotations` with: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint: true`, and `title`
- `server.registerTool()` uses config object (NOT deprecated `server.tool()`)
- McpServer is created PER REQUEST (CVE GHSA-345p-7cg4-v4c7)
- Tool descriptions are written for Claude: explain WHEN to use the tool
- Tool responses are compact JSON: `JSON.stringify(result)` — no pretty-print
- Error messages must be ACTIONABLE for Claude
- McpServer must declare `serverInstructions`

## Tool Implementation Pattern

Each tool file exports ONE function: `registerXxxTool(server: McpServer): void`.

```typescript
server.registerTool(
  'tool_name',
  {
    title: 'Human Readable Name',
    description: 'Rich description for Claude (1-3 sentences)',
    inputSchema: XxxInputSchema.shape,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (args) => {
    // 1. Get auth context (no generic — SDK does not support it)
    const auth = getMcpAuthContext();
    if (!auth) {
      return formatToolError('Authentication required. Please reconnect the ZapSign integration.');
    }
    // 2. Cast props and enforce scope
    const props = auth.props as unknown as AuthProps;
    requireScope(props.grantedScope, 'documents:read');
    // 3. Create client
    const client = new ZapSignClient(props.zapSignApiUrl, props.zapSignApiToken);
    // 4. Call API
    const result = await client.listDocuments(args);
    // 5. Return compact JSON
    return formatToolSuccess(JSON.stringify(result));
    // Catch ZapSignMcpError -> formatToolError(error.message)
    // Catch unknown -> formatToolError('An unexpected error occurred')
  }
);
```

## Testing

- Framework: Vitest with `@cloudflare/vitest-pool-workers` (runs in workerd runtime)
- Unit tests: `test/unit/**/*.test.ts`
- Integration tests: `test/integration/**/*.test.ts`
- Mocks: `test/mocks/zapsign-responses.ts`
- Pre-commit: `npm run typecheck && npm run lint && npm test`

## Commit Convention

Format: `type(scope): description`

Allowed types: `feat`, `fix`, `test`, `chore`, `docs`, `refactor`

Examples:
- `feat(documents): implement document tools`
- `fix(api): handle 429 rate limit retry`
- `test(signers): add signer tool unit tests`
- `chore(tooling): add agent context infrastructure`

## Task Protocol

Before starting a task:

1. Read this file and the assigned task, issue, or pull request.
2. Inspect the relevant code, tests, and documentation before choosing an implementation.
3. Record a focused failing test or executable evidence check before changing code or documentation.
4. Keep the change within the assigned task. Escalate a dependency or blocker instead of expanding scope.

For code changes, use TDD: observe the focused test fail, make the smallest change to pass it, then refactor while it remains green. For documentation, operations, and governance changes, use a failing search, URL check, or checklist as the evidence check.

## Checkpoint Protocol

After completing a task:

1. Run the focused test or evidence check, then run the applicable `npm run typecheck`, `npm run lint`, and test commands.
2. Do not run a test that calls the real ZapSign API unless the task explicitly authorizes it and the sandbox preflight passes.
3. Review the diff for scope, secrets, and compliance with these instructions.
4. Commit one focused change using `type(scope): description`.
5. Report the commands and results, changed files, and unresolved blockers to the task owner.
