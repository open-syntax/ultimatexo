# syntax=docker/dockerfile:1.4

# Builder stage
FROM node:24-alpine AS builder

# Install security updates
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Pin pnpm version for reproducibility
RUN npm install -g pnpm@10.18.2

# Copy dependency files first for better caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile --prod=false

# Copy source files
COPY . .

# Build application
RUN pnpm run build && \
    # Remove source maps in production (optional)
    # find dist -name "*.map" -type f -delete && \
    # Verify build output
    test -d dist && test -f dist/index.html

# Runtime stage with headers-more module
FROM nginx:1.29-alpine AS runner

# hadolint ignore=DL3018
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Ensure nginx group and user exist (may already exist in base image)
RUN getent group nginx || addgroup -g 101 -S nginx && \
    id -u nginx >/dev/null 2>&1 || adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets with correct ownership
COPY --from=builder --chown=nginx:nginx /app/dist .

# Copy nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Create necessary directories with correct permissions
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d && \
    chmod -R 755 /var/cache/nginx /var/run && \
    # Adjust nginx configuration directory permissions
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use exec form for proper signal handling
CMD ["nginx", "-g", "daemon off;"]

# Metadata
LABEL org.opencontainers.image.title="UltimateXO Client" \
      org.opencontainers.image.description="Production client for UltimateXO" \
      org.opencontainers.image.vendor="open-syntax" \
      org.opencontainers.image.source="https://github.com/open-syntax/ultimatexo"
