import { defineConfig, devices } from "@playwright/test";

// Runs against the real production server (Fastify serving dist/), built
// with VITE_SUPABASE_URL=http://localhost:54321 so e2e/fixtures.ts can answer
// every Supabase call. `npm run e2e:build` makes that build; CI does too.
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], timezoneId: "Europe/London", locale: "en-GB" } },
    // Safari's engine on an iPhone-sized screen: Waqar's phone. Playwright
    // can't intercept requests from a WebKit page a service worker controls,
    // so the service worker is off here; its behaviour (opening offline,
    // updates) is tested on Chromium, where it can be.
    {
      name: "iphone",
      use: {
        ...devices["iPhone 15"],
        timezoneId: "Europe/London",
        locale: "en-GB",
        serviceWorkers: "block",
      },
    },
  ],
  webServer: {
    command: "npm start",
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
  },
});
