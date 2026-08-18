/**
 * Cloudflare Worker / Assets Worker Handler
 *
 * Automatically proxies:
 *   - /api/* -> BACKEND_URL/* (stripping the /api prefix for Axum)
 *   - /ws/*  -> BACKEND_URL/ws/* (WebSocket upgrade proxying)
 *   - All other routes -> Static Assets (env.ASSETS)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Target backend server URL (Configurable via Cloudflare Environment Variable BACKEND_URL)
    const backendUrlConfig =
      env.BACKEND_URL || "http://omarisadev.duckdns.org:6767";
    const targetUrl = new URL(backendUrlConfig);

    // 1. Proxy REST API calls: /api/* -> targetUrl/*
    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      const strippedPath = url.pathname.replace(/^\/api/, "") || "/";
      const destUrl = new URL(strippedPath + url.search, targetUrl);

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("Host", targetUrl.host);

      if (request.headers.get("CF-Connecting-IP")) {
        requestHeaders.set(
          "X-Forwarded-For",
          request.headers.get("CF-Connecting-IP"),
        );
        requestHeaders.set(
          "X-Real-IP",
          request.headers.get("CF-Connecting-IP"),
        );
      }

      const proxyRequest = new Request(destUrl.toString(), {
        method: request.method,
        headers: requestHeaders,
        body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
        redirect: "follow",
      });

      try {
        return await fetch(proxyRequest);
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: "Bad Gateway",
            message: "Cloudflare Worker failed to reach backend server.",
            details: String(err),
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // 2. Proxy WebSocket connections: /ws/* -> targetUrl/ws/*
    if (url.pathname.startsWith("/ws/") || url.pathname === "/ws") {
      const wsScheme = targetUrl.protocol === "https:" ? "wss:" : "ws:";
      const destWsUrl = new URL(
        url.pathname + url.search,
        `${wsScheme}//${targetUrl.host}`,
      );

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("Host", targetUrl.host);

      const proxyWsRequest = new Request(destWsUrl.toString(), {
        method: request.method,
        headers: requestHeaders,
      });

      try {
        return await fetch(proxyWsRequest);
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: "Bad Gateway",
            message:
              "Cloudflare Worker failed to establish WebSocket connection to backend.",
            details: String(err),
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // 3. Default: Serve static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  },
};
