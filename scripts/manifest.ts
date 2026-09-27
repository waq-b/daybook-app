// The web app manifest, built from src/copy.ts and design/tokens.json so its
// words pass the voice test and its colours are tokens.
import type { ManifestOptions } from "vite-plugin-pwa";
import { copy } from "../src/copy";
import { colour } from "./design-tokens";

export const manifest: Partial<ManifestOptions> = {
  name: copy.app.name,
  short_name: copy.app.name,
  description: copy.app.description,
  lang: "en-GB",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  theme_color: colour("paper"),
  background_color: colour("paper"),
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};
