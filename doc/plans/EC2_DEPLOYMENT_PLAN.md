# EC2 Deployment Guide with HTTPS

This guide will help you deploy the MCP ZapSign Server on AWS EC2 with HTTPS support using Nginx as a reverse proxy.

## 🚀 Prerequisites

- AWS EC2 instance running Ubuntu 20.04+ or Amazon Linux 2
- Domain name pointing to your EC2 instance
- Security group configured to allow HTTP (80) and HTTPS (443) traffic
- Docker and Docker Compose installed on the EC2 instance

## 📋 Step 1: EC2 Instance Setup

### Launch EC2 Instance
1. Launch a new EC2 instance
2. Choose Ubuntu 20.04 LTS or Amazon Linux 2
3. Select appropriate instance type (t3.medium recommended for production)
4. Configure security group to allow:
   - SSH (22) - Your IP only
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0

### Install Docker and Docker Compose
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
exit
# SSH back into your instance
```

## 📁 Step 2: Deploy Application

### Clone and Setup
```bash
# Clone your repository
git clone <your-repo-url>
cd mcp-api-server

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Configure Environment Variables
```bash
# Required variables
ZAPSIGN_API_KEY=your_actual_api_key_here
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Optional variables
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=100
```

## 🔐 Step 3: SSL Certificate Setup

### Option A: Let's Encrypt (Recommended for Production)
```bash
# Make SSL setup script executable
chmod +x nginx/setup-ssl.sh

# Run SSL setup
./nginx/setup-ssl.sh

# Choose option 2 (Let's Encrypt)
# Enter your domain and email when prompted
```

### Option B: Self-Signed Certificate (Testing Only)
```bash
# Generate self-signed certificate
./nginx/setup-ssl.sh
# Choose option 1 (Self-signed)
```

### Option C: Use Existing Certificates
```bash
# Copy your existing certificates
./nginx/setup-ssl.sh
# Choose option 3 (Existing certificates)
# Provide paths to your .crt and .key files
```

## 🚀 Step 4: Deploy Services

### Start Production Services
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Verify Deployment
```bash
# Check if services are running
curl -k https://localhost/health

# Check SSL certificate
openssl s_client -connect localhost:443 -servername your-domain.com
```

## 🔧 Step 5: Domain Configuration

### Update DNS Records
1. Go to your domain registrar's DNS settings
2. Add an A record pointing to your EC2 public IP
3. Wait for DNS propagation (can take up to 48 hours)

### Test HTTPS Access
```bash
# Test from your local machine
curl -I https://your-domain.com/health

# Test MCP endpoint
curl -I https://your-domain.com/mcp/
```

## 📊 Step 6: Monitoring and Maintenance

### View Logs
```bash
# Nginx logs
docker-compose -f docker-compose.prod.yml logs nginx-proxy

# Application logs
docker-compose -f docker-compose.prod.yml logs mcp-zapsign-server

# System logs
sudo journalctl -u docker
```

### SSL Certificate Renewal
```bash
# Manual renewal
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Reload nginx after renewal
docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload
```

### Automated Renewal (Recommended)
```bash
# Add to crontab
sudo crontab -e

# Add this line for daily renewal check
0 2 * * * cd /path/to/your/app && docker-compose -f docker-compose.prod.yml run --rm certbot renew && docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload
```

## 🛠️ Troubleshooting

### Common Issues

#### SSL Certificate Errors
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Verify private key
openssl rsa -in nginx/ssl/key.pem -check
```

#### Nginx Configuration Issues
```bash
# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -t

# Reload nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload
```

#### Port Binding Issues
```bash
# Check what's using ports 80 and 443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if running
sudo systemctl stop nginx    # if running
```

### Performance Optimization

#### Nginx Tuning
```bash
# Edit nginx/nginx.conf
# Adjust worker_processes and worker_connections based on your instance size
```

#### Docker Resource Limits
```bash
# Edit docker-compose.prod.yml
# Adjust memory and CPU limits based on your instance specifications
```

## 🔒 Security Considerations

### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Strategy
```bash
# Backup SSL certificates
sudo cp -r nginx/ssl /backup/ssl-$(date +%Y%m%d)

# Backup application data
sudo cp -r logs /backup/logs-$(date +%Y%m%d)
```

## 📈 Scaling Considerations

### Load Balancer
- Use AWS Application Load Balancer for high availability
- Configure health checks pointing to `/health` endpoint
- Enable sticky sessions if needed

### Auto Scaling
- Set up EC2 Auto Scaling Group
- Configure CloudWatch alarms for CPU/memory usage
- Use AWS Systems Manager for automated deployments

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify SSL certificate: `openssl s_client -connect localhost:443`
3. Test connectivity: `curl -I https://your-domain.com/health`
4. Check security group rules in AWS Console

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipeline
4. Set up log aggregation
5. Configure performance monitoring
