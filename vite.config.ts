import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // `npm run dev:server` runs Fastify on 3000; the Vite dev server forwards /api to it.
    proxy: { "/api": "http://localhost:3000" },
  },
});
