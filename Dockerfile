# ---------------------------------------------------------------------------
# Dockerfile — api-mcp Node server
#
# Contract: the Node entry point is `dist/node/main.js` (built by the
# parallel agent doing todo 4). The server listens on PORT (default 8080).
#
# Two-stage build:
#   1. builder — install deps + compile TypeScript
#   2. runtime — copy only production artifacts, drop dev tools
# ---------------------------------------------------------------------------

# ---- Stage 1: builder -------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache friendly — only re-run on package changes).
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and compile.
COPY tsconfig.json ./
COPY src/ ./src/

# Build the Node server entry (dist/node/main.js).
# The build:node script is owned by the parallel agent (todo 4).
# If the script is not yet present, this stage will fail loudly — which is
# the correct gate: the Dockerfile must not be applied until todo 4 is merged.
RUN npm run build:node

# ---- Stage 2: runtime -------------------------------------------------------
FROM node:20-alpine AS runtime

# Security: run as non-root.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the compiled output and production dependencies.
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist/node/ ./dist/node/

USER appuser

# PORT is read by the Node server at startup (default 8080).
ENV PORT=8080
EXPOSE 8080

# /healthz and /version must be served by the Node server.
# If these endpoints are not implemented, the ALB health check will fail
# and the ECS service will cycle tasks. See FLAG below.
#
# FLAG FOR PARALLEL AGENT (todo 4):
#   The Node server MUST expose:
#     GET /healthz  → HTTP 200, body: { "status": "ok" }
#     GET /version  → HTTP 200, body: { "version": "<git-sha-or-dev>" }
#   These are the ALB health-check and smoke-test endpoints.
#   Without them the ECS service will not stabilize and the deploy workflow
#   smoke step will fail.

ENTRYPOINT ["node", "dist/node/main.js"]
