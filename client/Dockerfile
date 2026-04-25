# syntax=docker/dockerfile:1.7

FROM node:22-alpine3.21 AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build && \
    test -d dist && test -f dist/index.html

FROM alpine:3.21 AS runner

COPY --from=builder /app/dist /srv/www
