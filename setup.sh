#!/bin/bash

# MCP ZapSign Server Setup Script
# This script creates the necessary folder structure and initializes the project

echo "🚀 Setting up MCP ZapSign Server..."

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p lib/services
mkdir -p logs
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p docs/api
mkdir -p docs/deployment

# Create logs directory with proper permissions
echo "📝 Setting up logging directory..."
touch logs/.gitkeep
echo "# Log files will be created here" > logs/README.md

# Create test directories with README files
echo "🧪 Setting up test directories..."
echo "# Unit tests for MCP ZapSign Server" > tests/unit/README.md
echo "# Integration tests for MCP ZapSign Server" > tests/integration/README.md
echo "# End-to-end tests for MCP ZapSign Server" > tests/e2e/README.md

# Create documentation directories
echo "📚 Setting up documentation directories..."
echo "# API documentation for MCP ZapSign Server" > docs/api/README.md
echo "# Deployment guides and configuration" > docs/deployment/README.md

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔐 Creating .env file..."
    cat > .env << EOF
# MCP ZapSign Server Configuration

# Server Configuration
PORT=3001
HOST=localhost
NODE_ENV=development

# Server Information
SERVER_NAME=mcp-server-zapsign
SERVER_VERSION=1.0.0

# ZapSign API Configuration
ZAPSIGN_API_KEY=your_zapsign_api_key_here

ZAPSIGN_BASE_URL=https://api.zapsign.com.br
ZAPSIGN_API_VERSION=v1

# Domain Configuration (for Traefik SSL)
DOMAIN_NAME=your-domain.com
CERTBOT_EMAIL=admin@your-domain.com

# Logging Configuration
LOG_LEVEL=info

# Features Configuration
ENABLE_METRICS=false
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=100
EOF
    echo "✅ .env file created. Please update with your actual API keys."
else
    echo "ℹ️  .env file already exists. Skipping creation."
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "🚫 Creating .gitignore file..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF
    echo "✅ .gitignore file created."
else
    echo "ℹ️  .gitignore file already exists. Skipping creation."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory with proper permissions
echo "🔒 Setting proper permissions for logs directory..."
chmod 755 logs

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your ZapSign API keys"
echo "2. Run 'npm start' to start the server in STDIO mode"
echo "3. Run 'npm run start:sse' to start the server in SSE mode"
echo "4. Run 'npm run dev' for development mode with auto-reload"
echo ""
echo "For more information, see README.md"
echo ""
