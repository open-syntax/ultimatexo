#!/usr/bin/env bash
set -euo pipefail

# deploy.sh - Production deployment script for UltimateXO
# Usage: ./deploy.sh <version> [skip_health_check]
#
# This script is designed to run on the target server.
# It handles backup, image pull, service restart, and health verification.

VERSION="${1:?Version is required}"
SKIP_HEALTH="${2:-false}"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/ultimatexo}"
BACKUP_DIR="${DEPLOY_DIR}/backups"
MAX_HEALTH_ATTEMPTS=30
HEALTH_INTERVAL=10

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

backup_current_state() {
  local backup_path="$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$backup_path"

  if [ -f "$DEPLOY_DIR/.env" ]; then
    cp "$DEPLOY_DIR/.env" "$backup_path/.env"
    local prev_version
    prev_version=$(grep "^VERSION=" "$backup_path/.env" | cut -d= -f2 || echo "unknown")
    echo "$prev_version" > "$backup_path/version.txt"
    log "Backed up previous version: $prev_version to $backup_path"
  fi

  docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps -a > "$backup_path/containers.txt" 2>/dev/null || true
}

pull_images() {
  log "Pulling images for version: $VERSION"
  docker compose -f "$DEPLOY_DIR/docker-compose.yml" pull
}

deploy_services() {
  log "Deploying services..."
  docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d --remove-orphans
}

wait_for_server_health() {
  log "Waiting for server health check..."
  for i in $(seq 1 "$MAX_HEALTH_ATTEMPTS"); do
    if docker inspect ultimatexo-server --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
      log "Server is healthy"
      return 0
    fi
    log "Health check attempt $i/$MAX_HEALTH_ATTEMPTS... waiting"
    sleep "$HEALTH_INTERVAL"
  done
  log "Server health check timed out after $(( MAX_HEALTH_ATTEMPTS * HEALTH_INTERVAL ))s"
  return 1
}

wait_for_proxy() {
  log "Waiting for proxy to respond..."
  for i in $(seq 1 "$MAX_HEALTH_ATTEMPTS"); do
    local http_code
    http_code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost 2>/dev/null || echo "000")
    if [[ "$http_code" =~ ^(200|301|302|308)$ ]]; then
      log "Proxy responding with HTTP $http_code"
      return 0
    fi
    log "Proxy check attempt $i/$MAX_HEALTH_ATTEMPTS (HTTP $http_code)... waiting"
    sleep "$HEALTH_INTERVAL"
  done
  log "Proxy health check timed out"
  return 1
}

cleanup_old_images() {
  log "Cleaning up old images..."
  docker image prune -af --filter "until=168h" || true
}

show_logs() {
  log "Recent service logs:"
  docker compose -f "$DEPLOY_DIR/docker-compose.yml" logs --tail=50
}

rollback() {
  local backup_path="$1"
  log "Rolling back to backup at $backup_path"

  if [ -f "$backup_path/.env" ]; then
    cp "$backup_path/.env" "$DEPLOY_DIR/.env"
  fi

  docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d --remove-orphans
  log "Rollback complete"
}

main() {
  cd "$DEPLOY_DIR"

  log "Starting deployment of version: $VERSION"
  log "Skip health check: $SKIP_HEALTH"

  backup_current_state

  pull_images
  deploy_services

  if [ "$SKIP_HEALTH" = "true" ]; then
    log "Health check skipped. Deployment complete."
    exit 0
  fi

  local health_ok=true

  if ! wait_for_server_health; then
    health_ok=false
  fi

  if [ "$health_ok" = true ] && ! wait_for_proxy; then
    health_ok=false
  fi

  if [ "$health_ok" = true ]; then
    log "All health checks passed. Deployment successful!"
    cleanup_old_images
    exit 0
  fi

  log "Health checks failed!"
  show_logs

  log "Attempting automatic rollback..."
  local latest_backup
  latest_backup=$(ls -td "$BACKUP_DIR"/*/ 2>/dev/null | head -1)
  if [ -n "$latest_backup" ]; then
    rollback "$latest_backup"
    log "Rollback completed. Please investigate and redeploy."
  else
    log "No backup found for rollback. Manual intervention required."
  fi

  exit 1
}

main
