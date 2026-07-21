# Contributing to ZapSign MCP Server

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- **Node.js** 20+
- **npm**
- **[Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)** v4+
- A **ZapSign sandbox account** ([sign up](https://sandbox.app.zapsign.com.br/acesso/entrar)) for integration testing

## Local Setup

1. Fork and clone the repository:

```bash
git clone https://github.com/<your-username>/zapsign-mcp.git
cd zapsign-mcp
npm install
```

2. Create your local environment file:

```bash
cp .env.example .dev.vars
```

3. Fill in the required variables in `.dev.vars`:

| Variable | Description |
|----------|-------------|
| `ZAPSIGN_API_URL` | `https://sandbox.api.zapsign.com.br` for development |
| `COOKIE_ENCRYPTION_KEY` | Generate with `openssl rand -hex 32` |
| `ENVIRONMENT` | `sandbox` |

4. Start the local development server:

```bash
npm run dev
```

The server runs at `http://localhost:8788`. Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test the OAuth flow and tool execution locally.

## Coding Standards

This project enforces strict coding standards. The full list of non-negotiable rules lives in [`AGENTS.md`](../AGENTS.md). Here are the key highlights:

- **Early return pattern**: always. No `else` after `return`. No `else` blocks at all.
- **No `switch` statements**: use `Record<string, handler>` object maps instead.
- **No `any`**: use `unknown` + type guards.
- **No `as` type assertions**: except for untyped library interfaces (with a comment explaining why).
- **No TypeScript `enum`**: use `as const` objects with derived types.
- **Max 40 lines per function** (excluding type signatures and JSDoc).
- **Max 2 levels of nesting**: extract to a helper function if deeper.
- **Cyclomatic and cognitive complexity < 10** per function.
- **All identifiers and comments in English**.
- **JSDoc only on exported functions** with `@param`, `@returns`, `@throws`.

## Testing

The project uses [Vitest](https://vitest.dev/) with [`@cloudflare/vitest-pool-workers`](https://developers.cloudflare.com/workers/testing/vitest-integration/) to run tests inside the Workers runtime.

### Test structure

| Directory | Purpose |
|-----------|---------|
| `test/unit/**/*.test.ts` | Unit tests (mocked dependencies) |
| `test/integration/**/*.test.ts` | Integration tests (real ZapSign sandbox API) |
| `test/mocks/zapsign-responses.ts` | Shared mock data for all API response shapes |

### Commands

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode for development
```

Integration tests require sandbox credentials in `test/.env.test` and run with a separate config:

```bash
npx vitest run --config vitest.integration.config.ts
```

### Before submitting

Always run the full check suite before opening a PR:

```bash
npm run typecheck && npm run lint && npm test
```

## Pull Request Process

1. **Fork** the repository and create a feature branch from `main`:

```bash
git checkout -b feat/your-feature-name
```

2. **Make your changes** following the coding standards in [`AGENTS.md`](../AGENTS.md).

3. **Run all checks** to verify nothing is broken:

```bash
npm run typecheck && npm run lint && npm test
```

4. **Open a pull request** to `main` with a clear description of:
   - What the change does and why
   - How to test it
   - Any relevant issue numbers

5. A maintainer will review your PR. CI runs typecheck, lint, and tests automatically on every push.

## Commit Convention

Commits follow the format: `type(scope): description`

### Allowed types

| Type | Use for |
|------|---------|
| `feat` | New features or tools |
| `fix` | Bug fixes |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, dependencies |
| `docs` | Documentation changes |
| `refactor` | Code restructuring without behavior change |

### Examples

```
feat(W7A): implement document tools
fix(W3A): handle 429 rate limit retry
test(W11A): add document tool unit tests
chore(W0B): add agent context infrastructure
docs(W14C): add contributing guide
```

## Questions?

For questions about contributing, open a GitHub issue or contact **support@zapsign.com.br**.
