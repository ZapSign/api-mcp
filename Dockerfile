# MCP ZapSign Server Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies first (including dev dependencies for prepare script)
RUN npm ci

# Run the prepare script (linting)
RUN npm run lint

# Remove dev dependencies to keep production image lean
RUN npm prune --production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs && chmod 755 logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Default command
CMD ["npm", "start"]