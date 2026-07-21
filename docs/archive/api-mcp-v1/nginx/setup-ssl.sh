#!/bin/bash

# SSL Setup Script for MCP ZapSign Server
# This script helps set up SSL certificates for HTTPS deployment

set -e

echo "🔐 SSL Setup for MCP ZapSign Server"
echo "====================================="

# Create necessary directories
echo "📁 Creating SSL directories..."
mkdir -p nginx/ssl
mkdir -p nginx/webroot
mkdir -p logs/nginx

# Function to generate self-signed certificate
generate_self_signed() {
    echo "🔑 Generating self-signed SSL certificate..."
    
    # Generate private key
    openssl genrsa -out nginx/ssl/key.pem 2048
    
    # Generate certificate signing request
    openssl req -new -key nginx/ssl/key.pem -out nginx/ssl/cert.csr -subj "/C=BR/ST=SP/L=Sao Paulo/O=ZapSign/CN=localhost"
    
    # Generate self-signed certificate
    openssl x509 -req -in nginx/ssl/cert.csr -signkey nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365
    
    # Clean up CSR
    rm nginx/ssl/cert.csr
    
    echo "✅ Self-signed certificate generated successfully!"
    echo "⚠️  Note: Self-signed certificates will show browser warnings"
}

# Function to setup Let's Encrypt
setup_letsencrypt() {
    echo "🌐 Setting up Let's Encrypt SSL certificate..."
    
    read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN
    read -p "Enter your email address: " EMAIL
    
    if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
        echo "❌ Domain and email are required for Let's Encrypt"
        exit 1
    fi
    
    echo "📝 Updating docker-compose.yml with your domain..."
    
    # Update docker-compose.yml with actual domain and email
    sed -i "s/your-domain.com/$DOMAIN/g" docker-compose.yml
    sed -i "s/your-email@example.com/$EMAIL/g" docker-compose.yml
    
    echo "🚀 Starting services to obtain SSL certificate..."
    docker-compose up -d nginx-proxy
    
    echo "⏳ Waiting for nginx to start..."
    sleep 10
    
    echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
    docker-compose run --rm certbot
    
    echo "✅ Let's Encrypt certificate obtained successfully!"
    echo "🔄 Reloading nginx configuration..."
    docker-compose exec nginx-proxy nginx -s reload
    
    echo "🎉 SSL setup completed! Your server is now accessible via HTTPS"
}

# Function to use existing certificates
use_existing_certificates() {
    echo "📁 Using existing SSL certificates..."
    
    read -p "Enter path to your SSL certificate (.crt or .pem): " CERT_PATH
    read -p "Enter path to your SSL private key (.key or .pem): " KEY_PATH
    
    if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
        echo "❌ Certificate files not found!"
        exit 1
    fi
    
    echo "📋 Copying certificates..."
    cp "$CERT_PATH" nginx/ssl/cert.pem
    cp "$KEY_PATH" nginx/ssl/key.pem
    
    echo "✅ Certificates copied successfully!"
}

# Main menu
echo ""
echo "Choose SSL setup option:"
echo "1) Generate self-signed certificate (for testing)"
echo "2) Setup Let's Encrypt certificate (for production)"
echo "3) Use existing certificates"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " CHOICE

case $CHOICE in
    1)
        generate_self_signed
        ;;
    2)
        setup_letsencrypt
        ;;
    3)
        use_existing_certificates
        ;;
    4)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "🔧 Next steps:"
echo "1. Start your services: docker-compose up -d"
echo "2. Access your server via HTTPS: https://your-domain.com"
echo "3. Check nginx logs: docker-compose logs nginx-proxy"
echo ""
echo "📚 For more information, check the README.md file"
