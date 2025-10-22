
# hadolint ignore=DL3016,DL3059
FROM node:24-alpine AS builder
WORKDIR /app

# Pin pnpm version for reproducibility
RUN npm install -g pnpm@10.18.2

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:1.29-alpine AS runner
WORKDIR /usr/share/nginx/html
RUN apk update && apk upgrade && rm -rf ./*

COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
