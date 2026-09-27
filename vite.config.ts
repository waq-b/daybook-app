import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { colour } from "./scripts/design-tokens";
import { manifest } from "./scripts/manifest";

/** theme-color comes from tokens.json at build time, never typed as hex. */
function themeColour(): Plugin {
  return {
    name: "daybook-theme-colour",
    transformIndexHtml: () => [
      { tag: "meta", attrs: { name: "theme-color", content: colour("paper") }, injectTo: "head" },
    ],
  };
}

export default defineConfig({
  plugins: [
    react(),
    themeColour(),
    VitePWA({
      // "prompt": a new version waits until the app is next opened fresh, so
      // an update never swaps the page out from under someone mid-log.
      registerType: "prompt",
      injectRegister: false,
      manifest,
      includeAssets: ["icons/favicon.svg", "icons/apple-touch-icon.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
        navigateFallback: "/index.html",
        // The API is network-only: never answered from cache.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    // `npm run dev:server` runs Fastify on 3000; the Vite dev server forwards /api to it.
    proxy: { "/api": "http://localhost:3000" },
  },
});
