# syntax=docker/dockerfile:1.4

FROM caddy:2.8.4-builder AS builder

RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:2.8.4-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache ca-certificates tzdata && \
    rm -rf /var/cache/apk/*

RUN mkdir -p /var/log/caddy /srv/www && \
    chown -R caddy:caddy /var/log/caddy /srv/www

WORKDIR /srv

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:2019/metrics || exit 1

USER caddy

EXPOSE 80 443 443/udp

LABEL org.opencontainers.image.title="Caddy with Cloudflare DNS" \
      org.opencontainers.image.description="Caddy web server with Cloudflare DNS plugin" \
      org.opencontainers.image.vendor="open-syntax" \
      org.opencontainers.image.source="https://github.com/open-syntax/ultimatexo"

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
