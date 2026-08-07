# Production Deployment Checklist

Use this checklist when deploying HMR to production.

## Pre-Deployment

- [ ] Set strong `JWT_SECRET` in environment (min 32 chars, random)
- [ ] Set strong `DB_PASSWORD` (not the default)
- [ ] Configure `CORS_ORIGINS` with your production domain(s)
- [ ] Ensure `.env` file exists and is NOT committed to git
- [ ] Review and update `nginx.conf` if needed

## Security

- [ ] HTTPS/TLS enabled (see docs/HTTPS_SETUP.md)
- [ ] Firewall configured (only ports 80/443 exposed)
- [ ] Database not exposed externally (no port mapping)
- [ ] JWT tokens have expiration (7 days default)
- [ ] Error messages don't leak internal details

## Monitoring

- [ ] Health checks configured
- [ ] Logging enabled
- [ ] Backup strategy for database
- [ ] Resource limits set (CPU/memory)
- [ ] Alerts configured for failures

## Post-Deployment

- [ ] Verify `/api/health` returns 200
- [ ] Verify frontend loads correctly
- [ ] Test login/logout flow
- [ ] Test critical user journeys
- [ ] Monitor error logs for 24 hours

## Rollback Plan

If deployment fails:

```bash
# Stop current containers
docker compose -f docker-compose.prod.yml down

# View previous images
docker images | grep hmr

# Tag and run previous version (replace TAG with actual tag)
docker tag hmr-backend:PREVIOUS_TAG hmr-backend:latest
docker compose -f docker-compose.prod.yml up -d
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens (generate with `openssl rand -hex 32`) |
| `DB_USER` | No | hmr | PostgreSQL username |
| `DB_PASSWORD` | No | hmr_secret | PostgreSQL password (CHANGE THIS) |
| `DB_NAME` | No | hmr_db | PostgreSQL database name |
| `CORS_ORIGINS` | Yes* | - | Comma-separated allowed origins (e.g., `https://yourdomain.com`) |

\* Required in production

## Docker Commands

```bash
# Deploy
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Scale backend workers (if needed)
docker compose -f docker-compose.prod.yml up -d --scale backend=3

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U hmr hmr_db > backup_$(date +%Y%m%d).sql

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hmr hmr_db < backup_file.sql
```

## Support

For deployment issues:
1. Check logs: `docker compose -f docker-compose.prod.yml logs`
2. Verify environment: `docker compose -f docker-compose.prod.yml config`
3. Test health: `curl http://localhost/api/health`
4. Review AGENTS.md for architecture details
