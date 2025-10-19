#!/bin/bash

# UltimateXO Health Check Script
# Comprehensive health check for all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost}"
API_URL="${API_URL:-$BASE_URL/api}"
TIMEOUT=10

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Functions
print_header() {
    echo ""
    echo "================================================"
    echo "  UltimateXO Health Check"
    echo "================================================"
    echo ""
}

print_summary() {
    echo ""
    echo "================================================"
    echo "  Summary"
    echo "================================================"
    echo -e "Passed:   ${GREEN}$PASSED${NC}"
    echo -e "Failed:   ${RED}$FAILED${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All health checks passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Some health checks failed!${NC}"
        return 1
    fi
}

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# Docker checks
check_docker() {
    echo "🐳 Checking Docker..."

    if ! command -v docker &> /dev/null; then
        check_fail "Docker is not installed"
        return 1
    fi
    check_pass "Docker is installed"

    if ! docker info &> /dev/null; then
        check_fail "Docker daemon is not running"
        return 1
    fi
    check_pass "Docker daemon is running"

    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        check_fail "Docker Compose is not available"
        return 1
    fi
    check_pass "Docker Compose is available"
}

# Container checks
check_containers() {
    echo ""
    echo "📦 Checking containers..."

    local containers=("ultimatexo-server" "ultimatexo-client" "ultimatexo-proxy")

    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            check_pass "Container $container is running"

            # Check container health
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
            if [ "$health" = "healthy" ]; then
                check_pass "Container $container is healthy"
            elif [ "$health" = "none" ]; then
                check_warn "Container $container has no health check"
            else
                check_warn "Container $container health status: $health"
            fi
        else
            check_fail "Container $container is not running"
        fi
    done
}

# Network checks
check_network() {
    echo ""
    echo "🌐 Checking network..."

    if docker network ls | grep -q "ultimatexo-network"; then
        check_pass "Network ultimatexo-network exists"
    else
        check_fail "Network ultimatexo-network not found"
    fi
}

# Service endpoint checks
check_endpoints() {
    echo ""
    echo "🔌 Checking service endpoints..."

    # Check client (homepage)
    if curl -f -s --max-time $TIMEOUT "$BASE_URL" > /dev/null; then
        check_pass "Client homepage is accessible ($BASE_URL)"

        # Check response time
        local response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time $TIMEOUT "$BASE_URL")
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            check_pass "Client response time is good (${response_time}s)"
        else
            check_warn "Client response time is slow (${response_time}s)"
        fi
    else
        check_fail "Client homepage is not accessible"
    fi

    # Check API health endpoint
    if curl -f -s --max-time $TIMEOUT "$API_URL/health" > /dev/null; then
        check_pass "API health endpoint is accessible ($API_URL/health)"

        # Parse health response if JSON
        local health_response=$(curl -s --max-time $TIMEOUT "$API_URL/health")
        if echo "$health_response" | jq . &> /dev/null; then
            check_pass "API health endpoint returns valid JSON"
        fi
    else
        check_fail "API health endpoint is not accessible"
    fi

    # Check HTTPS redirect
    if [ "$BASE_URL" = "http://localhost" ]; then
        check_warn "Skipping HTTPS check (localhost)"
    else
        local https_url="${BASE_URL/http:/https:}"
        if curl -f -s --max-time $TIMEOUT "$https_url" > /dev/null; then
            check_pass "HTTPS is working"
        else
            check_warn "HTTPS check failed or not configured"
        fi
    fi
}

# Resource checks
check_resources() {
    echo ""
    echo "💾 Checking resource usage..."

    # Check disk space
    local disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        check_pass "Disk usage is acceptable (${disk_usage}%)"
    elif [ "$disk_usage" -lt 90 ]; then
        check_warn "Disk usage is high (${disk_usage}%)"
    else
        check_fail "Disk usage is critical (${disk_usage}%)"
    fi

    # Check memory usage per container
    if command -v docker &> /dev/null; then
        local high_memory=false
        while read -r container memory; do
            local mem_value=$(echo "$memory" | sed 's/MiB//' | sed 's/GiB/*1024/' | bc 2>/dev/null || echo "0")
            if (( $(echo "$mem_value > 500" | bc -l) )); then
                check_warn "Container $container is using high memory ($memory)"
                high_memory=true
            fi
        done < <(docker stats --no-stream --format "{{.Name}} {{.MemUsage}}" 2>/dev/null | grep ultimatexo | awk '{print $1, $2}')

        if [ "$high_memory" = false ]; then
            check_pass "Container memory usage is normal"
        fi
    fi
}

# Volume checks
check_volumes() {
    echo ""
    echo "💽 Checking volumes..."

    local volumes=("ultimatexo-caddy-data" "ultimatexo-caddy-config" "ultimatexo-caddy-logs")

    for volume in "${volumes[@]}"; do
        if docker volume ls | grep -q "$volume"; then
            check_pass "Volume $volume exists"
        else
            check_fail "Volume $volume not found"
        fi
    done
}

# Log checks
check_logs() {
    echo ""
    echo "📋 Checking recent logs for errors..."

    local containers=("ultimatexo-server" "ultimatexo-client" "ultimatexo-proxy")
    local error_found=false

    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            local error_count=$(docker logs "$container" --tail=100 2>&1 | grep -iE "error|fatal|panic" | wc -l)
            if [ "$error_count" -eq 0 ]; then
                check_pass "No recent errors in $container logs"
            else
                check_warn "Found $error_count potential errors in $container logs (last 100 lines)"
                error_found=true
            fi
        fi
    done
}

# SSL/TLS checks
check_ssl() {
    if [ "$BASE_URL" = "http://localhost" ]; then
        return
    fi

    echo ""
    echo "🔒 Checking SSL/TLS..."

    local domain=$(echo "$BASE_URL" | sed -E 's/https?:\/\///')

    if command -v openssl &> /dev/null; then
        local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)

        if [ -n "$expiry_date" ]; then
            local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
            local current_epoch=$(date +%s)
            local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

            if [ "$days_until_expiry" -gt 30 ]; then
                check_pass "SSL certificate is valid (expires in $days_until_expiry days)"
            elif [ "$days_until_expiry" -gt 7 ]; then
                check_warn "SSL certificate expires soon (in $days_until_expiry days)"
            else
                check_fail "SSL certificate expires very soon (in $days_until_expiry days)"
            fi
        fi
    fi
}

# Performance test
check_performance() {
    echo ""
    echo "⚡ Checking performance..."

    if command -v curl &> /dev/null; then
        # Multiple requests to get average
        local total_time=0
        local requests=5

        for i in $(seq 1 $requests); do
            local time=$(curl -o /dev/null -s -w '%{time_total}' --max-time $TIMEOUT "$BASE_URL" 2>/dev/null || echo "0")
            total_time=$(echo "$total_time + $time" | bc)
        done

        local avg_time=$(echo "scale=3; $total_time / $requests" | bc)

        if (( $(echo "$avg_time < 0.5" | bc -l) )); then
            check_pass "Average response time is excellent (${avg_time}s)"
        elif (( $(echo "$avg_time < 1.0" | bc -l) )); then
            check_pass "Average response time is good (${avg_time}s)"
        elif (( $(echo "$avg_time < 2.0" | bc -l) )); then
            check_warn "Average response time is acceptable (${avg_time}s)"
        else
            check_warn "Average response time is slow (${avg_time}s)"
        fi
    fi
}

# Main
main() {
    print_header

    check_docker
    check_containers
    check_network
    check_volumes
    check_endpoints
    check_resources
    check_logs
    check_ssl
    check_performance

    print_summary
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            BASE_URL="$2"
            API_URL="$BASE_URL/api"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --url URL       Base URL to check (default: http://localhost)"
            echo "  --timeout SEC   Timeout in seconds (default: 10)"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

main
