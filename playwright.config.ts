import { defineConfig, devices } from "@playwright/test";

// Runs against the real production server (Fastify serving dist/), built
// with VITE_SUPABASE_URL=http://localhost:54321 so e2e/fixtures.ts can answer
// every Supabase call. `npm run e2e:build` makes that build; CI does too.
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "npm start",
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
  },
});
