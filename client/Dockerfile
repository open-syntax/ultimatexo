# syntax=docker/dockerfile:1.7

FROM node:26-alpine3.24 AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN npm install -g pnpm@12.15.0 --no-fund --no-audit

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build && \
    test -d dist && test -f dist/index.html

FROM alpine:3.24 AS runner

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/dist /srv/www

USER appuser
