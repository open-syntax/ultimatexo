import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import sitemap from "vite-sitemap";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      sitemap({
        base: "https://ultimatexo.com/",
        urls: ["instructions", "rooms", "create"],
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: `http://${env.VITE_API_URI}:${env.VITE_API_PORT}`,
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },

        "/ws": {
          target: `http://${env.VITE_API_URI}:${env.VITE_API_PORT}/ws`,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
