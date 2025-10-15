# Scripts Directory

This directory contains utility scripts for managing the UltimateXO application.

## Available Scripts

### 📦 deploy.sh

Production deployment script with health checks and automatic rollback.

**Usage:**
```bash
# Deploy specific version
RELEASE_VERSION=v1.2.3 IMAGE_BASE=ghcr.io/open-syntax/ultimatexo ./deploy.sh

# Deploy with environment file
source .env && ./deploy.sh

# Rollback to previous version
./deploy.sh --rollback

# Check deployment status
./deploy.sh --status

# View logs
./deploy.sh --logs
```

**Features:**
- Automated backup before deployment
- Health check verification
- Automatic rollback on failure
- Cleanup of old images and backups

**Environment Variables:**
- `RELEASE_VERSION` - Version to deploy (required)
- `IMAGE_BASE` - Base image name (required)
- `DEPLOY_DIR` - Deployment directory (default: ~/ultimatexo)

---

### 🏥 health-check.sh

Comprehensive health check for all services.

**Usage:**
```bash
# Check localhost
./health-check.sh

# Check production
./health-check.sh --url https://ultimatexo.com

# With custom timeout
./health-check.sh --url https://ultimatexo.com --timeout 15
```

**Checks performed:**
- Docker and Docker Compose availability
- Container status and health
- Network configuration
- Service endpoints (HTTP/HTTPS)
- SSL/TLS certificate validity
- Resource usage (disk, memory)
- Volume existence
- Recent error logs
- Performance (response times)

**Exit codes:**
- `0` - All checks passed
- `1` - One or more checks failed

---

### 🔧 setup.sh (Coming soon)

Initial setup script for new deployments.

---

### 📊 monitoring.sh (Coming soon)

Real-time monitoring dashboard for deployed services.

---

## Making Scripts Executable

After cloning the repository, make scripts executable:

```bash
chmod +x scripts/*.sh
```

## Integration with CI/CD

These scripts are used by GitHub Actions workflows:

- **deploy.sh** is called by `.github/workflows/deploy.yml`
- **health-check.sh** is used for smoke tests after deployment

## Local Development

For local development, you can use these scripts to:

1. Test deployment locally before pushing
2. Verify health of local Docker setup
3. Practice rollback procedures

## Adding New Scripts

When adding new scripts:

1. Follow the existing naming convention (kebab-case)
2. Include shebang line: `#!/bin/bash`
3. Add help text with `-h` or `--help` flag
4. Use exit codes appropriately
5. Include colored output for better UX
6. Document the script in this README

## Security Notes

- Scripts should never contain hardcoded secrets
- All sensitive data should come from environment variables
- SSH keys and tokens should be passed securely
- Always validate input parameters

## Troubleshooting

### Permission Denied

```bash
chmod +x scripts/script-name.sh
```

### Script Not Found

Make sure you're running from the project root:
```bash
cd /path/to/ultimatexo
./scripts/script-name.sh
```

### Environment Variables Not Set

Check your `.env` file or export variables:
```bash
export RELEASE_VERSION=v1.0.0
export IMAGE_BASE=ghcr.io/open-syntax/ultimatexo
```

## Contributing

When contributing scripts:

1. Test thoroughly in multiple environments
2. Handle errors gracefully
3. Provide clear output messages
4. Update this README with documentation
5. Add examples of usage
