# syntax=docker/dockerfile:1.4

FROM node:25-alpine AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod=false

COPY . .

RUN pnpm run build && \
    test -d dist && test -f dist/index.html

FROM alpine AS runner

COPY --from=builder /app/dist /srv/www
