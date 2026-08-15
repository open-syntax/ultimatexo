import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

interface SeoRoute {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
}

const SITE_URL = "https://ultimatexo.com";

const seoRoutes: SeoRoute[] = [
  {
    path: "/",
    title: "UltimateXO - Play Ultimate Tic-Tac-Toe Online | Free Multiplayer Game",
    description:
      "Play Ultimate Tic-Tac-Toe online for free. Challenge friends, join public rooms, or practice against AI. Nine boards, one champion - the ultimate tic-tac-toe experience.",
    h1: "Play Ultimate Tic-Tac-Toe Online",
    intro:
      "Challenge friends, join public rooms, or practice against AI. Nine boards, one champion - the ultimate tic-tac-toe experience.",
  },
  {
    path: "/instructions",
    title: "How to Play Ultimate Tic-Tac-Toe: Rules & Tips | UltimateXO",
    description:
      "Learn how to play Ultimate Tic-Tac-Toe. Complete rules, gameplay mechanics, strategy tips, and a video tutorial to master the game.",
    h1: "How to Play Ultimate Tic-Tac-Toe",
    intro:
      "Ultimate Tic-Tac-Toe is a recursive board game played on a 3x3 grid of 3x3 boards. You win by taking control of local boards and lining up three won locals on the global board.",
  },
  {
    path: "/rooms",
    title: "Find a Game Room | UltimateXO",
    description:
      "Browse active Ultimate Tic-Tac-Toe rooms, filter by privacy, and jump straight into a live multiplayer game.",
    h1: "Find a Game Room",
    intro:
      "Join an open Ultimate Tic-Tac-Toe room and play against real opponents in real time.",
  },
  {
    path: "/create",
    title: "Create a Game Room | UltimateXO",
    description:
      "Create an Ultimate Tic-Tac-Toe room. Play online with friends, locally on one device, or practice against AI with adjustable difficulty.",
    h1: "Create a Game Room",
    intro:
      "Set up a private or public room, invite friends, or start a game against the AI.",
  },
  {
    path: "/quick",
    title: "Quick Play - Instant Game Match | UltimateXO",
    description:
      "Jump into a random Ultimate Tic-Tac-Toe game instantly. No setup required - we'll match you with an active room or AI opponent.",
    h1: "Quick Play",
    intro:
      "No setup required. We'll match you with an active room or AI opponent instantly.",
  },
];

function staticShell(route: SeoRoute): string {
  return `<div id="root">
      <div class="flex h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 class="text-3xl font-black tracking-tight sm:text-4xl">${route.h1}</h1>
        <p class="max-w-xl text-sm text-foreground-500">${route.intro}</p>
      </div>
    </div>`;
}

function replaceMetaContent(html: string, key: string, value: string): string {
  return html.replace(
    new RegExp(`(<meta[^>]*?${key}[^>]*?content=")[^"]*("[^>]*?/>)`),
    `$1${value}$2`,
  );
}

function applyRouteMeta(html: string, route: SeoRoute): string {
  const url = `${SITE_URL}${route.path}`;
  const metaKeys = [
    `name="description"`,
    `property="og:title"`,
    `property="og:description"`,
    `name="twitter:title"`,
    `name="twitter:description"`,
  ];

  let output = html
    .replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>\n      ${route.title}\n    </title>`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${url}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${url}" />`,
    )
    .replace(/<div id="root"><\/div>/, staticShell(route));

  for (const key of metaKeys) {
    const value = key.includes("title") ? route.title : route.description;
    output = replaceMetaContent(output, key, value);
  }

  return output;
}

function buildSitemap(): string {
  const today = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${seoRoutes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function seoPlugin(): Plugin {
  let outDir = "dist";

  return {
    name: "ultimatexo-seo",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const dist = resolve(outDir);
      const indexHtml = readFileSync(resolve(dist, "index.html"), "utf-8");

      for (const route of seoRoutes) {
        if (route.path === "/") {
          writeFileSync(resolve(dist, "index.html"), applyRouteMeta(indexHtml, route));
          continue;
        }

        const routeDir = resolve(dist, route.path.slice(1));
        mkdirSync(routeDir, { recursive: true });
        writeFileSync(resolve(routeDir, "index.html"), applyRouteMeta(indexHtml, route));
      }

      writeFileSync(resolve(dist, "sitemap.xml"), buildSitemap());
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Default to localhost if not set
  const apiUri = env.VITE_API_URI || "localhost";
  const apiPort = env.VITE_API_PORT || "6767";

  return {
    plugins: [
      tailwindcss(),
      react(),
      tsconfigPaths(),
      seoPlugin(),
    ],

    // Build optimizations
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return "vendor";
            }
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
