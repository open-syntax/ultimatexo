import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import sitemap from "vite-sitemap";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Default to localhost if not set
  const apiUri = env.VITE_API_URI || "localhost";
  const apiPort = env.VITE_API_PORT || "6767";

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      sitemap({
        base: "https://ultimatexo.com/",
        urls: ["instructions", "rooms", "create"],
      }),
    ],

    // Build optimizations
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
      // Generate sourcemaps for production debugging (optional)
      sourcemap: mode === "production" ? "hidden" : true,
    },

    server: {
      host: true,
      port: 5173,
      strictPort: false,

      proxy: {
        // API routes - REST endpoints
        "/api": {
          target: `http://${apiUri}:${apiPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("API proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("Proxying API request:", req.method, req.url);
            });
          },
        },

        // WebSocket route - separate from API
        "/ws": {
          target: `ws://${apiUri}:${apiPort}`,
          ws: true,
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("WebSocket proxy error", err);
            });
            proxy.on("proxyReqWs", (proxyReq, req, socket, _options, _head) => {
              console.log("Proxying WebSocket request:", req.url);

              // Handle socket errors
              socket.on("error", (err) => {
                console.error("WebSocket socket error:", err);
              });
            });
          },
        },
      },
    },

    // Preview server configuration (for production builds)
    preview: {
      host: true,
      port: 4173,
      strictPort: false,
      proxy: {
        "/api": {
          target: `http://${apiUri}:${apiPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/ws": {
          target: `ws://${apiUri}:${apiPort}`,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
