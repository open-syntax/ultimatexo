#!/bin/bash

# UltimateXO Deployment Script
# This script handles deployment with health checks and rollback capability

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="${DEPLOY_DIR:-~/ultimatexo}"
BACKUP_DIR="${DEPLOY_DIR}/backups"
MAX_BACKUPS=10
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10  # 10 seconds

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env() {
    local required_vars=("RELEASE_VERSION" "IMAGE_BASE")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please set them in your .env file or export them"
        exit 1
    fi
}

# Create backup
create_backup() {
    log_info "Creating backup..."

    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/${backup_timestamp}"

    mkdir -p "$backup_path"

    # Backup container state
    docker compose ps > "${backup_path}/containers.txt" 2>/dev/null || true

    # Backup .env file
    if [ -f .env ]; then
        cp .env "${backup_path}/.env"
    fi

    # Store current version
    if [ -f .env ] && grep -q "RELEASE_VERSION" .env; then
        local current_version=$(grep "RELEASE_VERSION" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        echo "$current_version" > "${backup_path}/version.txt"
        log_info "Current version: $current_version"
    fi

    log_success "Backup created at $backup_path"

    # Cleanup old backups
    cleanup_old_backups
}

# Cleanup old backups
cleanup_old_backups() {
    local backup_count=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)

    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        log_info "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
        cd "$BACKUP_DIR" && ls -t | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
    fi
}

# Pull new images
pull_images() {
    log_info "Pulling new images for version $RELEASE_VERSION..."

    if ! docker compose pull; then
        log_error "Failed to pull images"
        return 1
    fi

    log_success "Images pulled successfully"
}

# Check service health
check_health() {
    local service=$1
    local url=$2
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=1

    log_info "Checking health of $service..."

    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T "$service" curl -f "$url" > /dev/null 2>&1; then
            log_success "$service is healthy (attempt $attempt/$max_attempts)"
            return 0
        fi

        log_warning "$service health check attempt $attempt/$max_attempts failed, retrying..."
        sleep $HEALTH_CHECK_INTERVAL
        attempt=$((attempt + 1))
    done

    log_error "$service health check failed after $max_attempts attempts"
    return 1
}

# Verify all services are healthy
verify_deployment() {
    log_info "Verifying deployment..."

    # Wait for containers to start
    sleep 10

    # Check if all containers are running
    local running_containers=$(docker compose ps --filter 'status=running' -q | wc -l)
    local expected_containers=3

    if [ "$running_containers" -ne "$expected_containers" ]; then
        log_error "Expected $expected_containers containers, but only $running_containers are running"
        docker compose ps
        return 1
    fi

    log_success "All containers are running"

    # Check individual service health
    if ! check_health "server" "http://localhost:6767/health"; then
        return 1
    fi

    if ! check_health "client" "http://localhost:8080/"; then
        return 1
    fi

    log_success "All services are healthy"
    return 0
}

# Rollback to previous version
rollback() {
    log_warning "Initiating rollback..."

    # Find the most recent backup
    local latest_backup=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -n1)

    if [ -z "$latest_backup" ]; then
        log_error "No backup found for rollback"
        return 1
    fi

    local backup_path="${BACKUP_DIR}/${latest_backup}"
    local previous_version=$(cat "${backup_path}/version.txt" 2>/dev/null || echo "unknown")

    log_info "Rolling back to version: $previous_version"

    # Stop current containers
    docker compose down

    # Restore .env
    if [ -f "${backup_path}/.env" ]; then
        cp "${backup_path}/.env" .env
    fi

    # Start previous version
    docker compose up -d

    log_success "Rollback completed"
}

# Deploy
deploy() {
    log_info "Starting deployment of version $RELEASE_VERSION"

    # Create backup before deployment
    create_backup

    # Pull new images
    if ! pull_images; then
        log_error "Failed to pull images, aborting deployment"
        exit 1
    fi

    # Start deployment
    log_info "Starting services..."
    if ! docker compose up -d --remove-orphans; then
        log_error "Failed to start services"
        rollback
        exit 1
    fi

    # Verify deployment
    if ! verify_deployment; then
        log_error "Deployment verification failed"
        log_info "Displaying recent logs:"
        docker compose logs --tail=50
        rollback
        exit 1
    fi

    log_success "Deployment completed successfully!"

    # Cleanup
    log_info "Cleaning up old images..."
    docker image prune -af --filter "until=168h" || true

    log_info "Deployment summary:"
    docker compose ps
}

# Show help
show_help() {
    cat << EOF
UltimateXO Deployment Script

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -v, --version VERSION   Set the version to deploy
    -r, --rollback          Rollback to previous version
    -s, --status            Show current deployment status
    -l, --logs              Show container logs

Environment Variables:
    RELEASE_VERSION         Version to deploy (required)
    IMAGE_BASE              Base image name (required)
    DEPLOY_DIR              Deployment directory (default: ~/ultimatexo)

Examples:
    # Deploy version v1.2.3
    RELEASE_VERSION=v1.2.3 $0

    # Rollback to previous version
    $0 --rollback

    # Check deployment status
    $0 --status

EOF
}

# Show status
show_status() {
    log_info "Current deployment status:"

    if [ -f .env ]; then
        local current_version=$(grep "RELEASE_VERSION" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        log_info "Deployed version: $current_version"
    fi

    echo ""
    docker compose ps

    echo ""
    log_info "Recent backups:"
    ls -lht "$BACKUP_DIR" 2>/dev/null | head -n 6 || log_warning "No backups found"
}

# Show logs
show_logs() {
    docker compose logs -f
}

# Main
main() {
    cd "$DEPLOY_DIR" || {
        log_error "Failed to change to deployment directory: $DEPLOY_DIR"
        exit 1
    }

    # Parse arguments
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -r|--rollback)
            rollback
            exit 0
            ;;
        -s|--status)
            show_status
            exit 0
            ;;
        -l|--logs)
            show_logs
            exit 0
            ;;
        -v|--version)
            if [ -n "${2:-}" ]; then
                export RELEASE_VERSION="$2"
            else
                log_error "Version not specified"
                exit 1
            fi
            ;;
        "")
            # No arguments, proceed with deployment
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac

    # Check environment
    check_env

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"

    # Deploy
    deploy
}

# Run main function
main "$@"
