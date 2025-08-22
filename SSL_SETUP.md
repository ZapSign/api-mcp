# SSL Certificate Setup Guide

## Current Status
The application is currently running with HTTP only (no SSL) to resolve immediate connectivity issues.

## SSL Setup Options

### Option 1: Let's Encrypt with HTTP Challenge (Recommended)
This requires the server to be accessible from the internet on ports 80 and 443.

1. **Ensure ports 80 and 443 are open** in your firewall/security group
2. **Verify DNS resolution** points to the correct server IP
3. **Update docker-compose.yml** to re-enable Let's Encrypt:

```yaml
command:
  - "--api.insecure=true"
  - "--providers.docker=true"
  - "--providers.docker.exposedbydefault=false"
  - "--entrypoints.web.address=:80"
  - "--entrypoints.websecure.address=:443"
  - "--certificatesresolvers.letsencrypt.acme.email=your-email@domain.com"
  - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
  - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
  - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
  - "--log.level=INFO"
```

4. **Re-add the letsencrypt volume**:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - ./traefik/letsencrypt:/letsencrypt:rw
```

5. **Re-enable HTTPS routing** in the MCP server labels

### Option 2: DNS Challenge (Most Secure)
This doesn't require external port access but needs DNS provider API credentials.

1. **Choose a DNS provider** (Cloudflare, Route53, GoDaddy, etc.)
2. **Get API credentials** from your DNS provider
3. **Add credentials to .env file**:
```bash
# For Cloudflare
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_EMAIL=your_email

# For Route53
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

4. **Update Traefik configuration** to use DNS challenge

### Option 3: Self-Signed Certificate (Development Only)
For development/testing environments only.

## Network Requirements

### For HTTP Challenge (Option 1):
- Port 80 (HTTP) must be accessible from the internet
- Port 443 (HTTPS) must be accessible from the internet
- No firewall blocking incoming connections

### For DNS Challenge (Option 2):
- No external port access required
- DNS provider API access required

## Testing SSL Setup

1. **Check certificate status**:
```bash
docker-compose logs traefik | grep -i certificate
```

2. **Test HTTPS endpoint**:
```bash
curl -k https://mcp.zapsign.com.br/health
```

3. **Verify certificate details**:
```bash
openssl s_client -connect mcp.zapsign.com.br:443 -servername mcp.zapsign.com.br
```

## Troubleshooting

### Common Issues:
1. **Port 80/443 blocked**: Check firewall and security group settings
2. **DNS not resolving**: Verify DNS records point to correct IP
3. **Rate limiting**: Let's Encrypt has rate limits (5 certificates per domain per week)
4. **Permission issues**: Ensure Traefik has write access to letsencrypt volume

### Debug Commands:
```bash
# Check Traefik logs
docker-compose logs -f traefik

# Check MCP server logs
docker-compose logs -f mcp-zapsign-server

# Test connectivity
curl -I http://mcp.zapsign.com.br
curl -I https://mcp.zapsign.com.br
```
