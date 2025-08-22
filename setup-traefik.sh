#!/bin/bash

# Create Traefik directory structure
echo "Creating Traefik directory structure..."

# Create traefik directory
mkdir -p traefik/letsencrypt

# Set proper permissions for Let's Encrypt storage
chmod 600 traefik/letsencrypt

# Create logs directory if it doesn't exist
mkdir -p logs

echo "Traefik directory structure created successfully!"
echo "Directories created:"
echo "  - traefik/letsencrypt (for SSL certificates)"
echo "  - logs (for application logs)"
echo ""
echo "Next steps:"
echo "1. Set DOMAIN_NAME in your .env file"
echo "2. Run: docker-compose -f docker-compose.traefik.yml up -d"
echo "3. Access Traefik dashboard at: http://localhost:8080"
echo "4. Your MCP server will be available at: https://your-domain.com"
