# HTTPS/TLS Configuration Guide for HMR Production

## Overview

This document describes how to enable HTTPS for the HMR application in production.

## Current Status

By default, the production setup (`docker-compose.prod.yml`) serves HTTP on port 80. This is acceptable for:
- Internal networks with VPN access
- When placed behind a reverse proxy/load balancer that terminates TLS
- Development/testing environments

## Recommended Approaches

### Option 1: Reverse Proxy with TLS Termination (Recommended)

Place the HMR application behind a reverse proxy (Nginx, Traefik, or cloud load balancer) that handles TLS termination.

**Example with external Nginx:**

```nginx
# /etc/nginx/sites-available/hmr
server {
    listen 443 ssl http2;
    server_name hmr.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name hmr.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Option 2: Let's Encrypt with Docker

Use Let's Encrypt for automatic certificate management:

```yaml
# docker-compose.ssl.yml
services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./certs:/etc/nginx/certs
      - ./vhost.d:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
    restart: always

  acme-companion:
    image: nginxproxy/acme-companion:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./certs:/etc/nginx/certs
      - ./vhost.d:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
      - ./acme:/etc/acme.sh
    environment:
      - DEFAULT_EMAIL=admin@yourdomain.com
    restart: always

  hmr-app:
    environment:
      - VIRTUAL_HOST=hmr.yourdomain.com
      - LETSENCRYPT_HOST=hmr.yourdomain.com
```

### Option 3: Cloud Provider Load Balancer

Most cloud providers offer managed load balancers with automatic TLS:

- **AWS**: Use Application Load Balancer (ALB) with ACM certificates
- **GCP**: Use Google Cloud Load Balancer with managed SSL
- **Azure**: Use Application Gateway with SSL termination
- **DigitalOcean**: Use Load Balancer with Let's Encrypt

## Security Headers Already Configured

The included `nginx.conf` already sets these security headers:

- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info
- `Permissions-Policy` - Restricts browser features

## Testing HTTPS

After configuration, test with:

```bash
# Test SSL configuration
curl -I https://yourdomain.com

# Test SSL certificate
openssl s_client -connect yourdomain.com:443

# Test security headers
curl -I https://yourdomain.com | grep -i "strict-transport\|x-frame\|x-content\|x-xss"
```

## Important Notes

1. **Never commit certificates or private keys to git**
2. **Set up automatic certificate renewal** (Let's Encrypt expires every 90 days)
3. **Use strong cipher suites** (TLS 1.2+ only)
4. **Enable HSTS** only after confirming HTTPS works correctly
5. **Monitor certificate expiration** with alerts

## Next Steps

1. Choose your preferred TLS approach
2. Configure DNS to point to your server
3. Set up certificates
4. Test thoroughly before enforcing HTTPS-only
5. Update `CORS_ORIGINS` environment variable to use `https://`

## Support

For issues with HTTPS configuration, consult:
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Nginx SSL Documentation](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
