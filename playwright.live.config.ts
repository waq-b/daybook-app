import { defineConfig, devices } from "@playwright/test";

// The live production smoke suite (e2e-live/): the real site, the real
// database, no fakes. Runs after every deploy (.github/workflows/live.yml)
// and by hand with `npm run e2e:live`.
const LIVE_URL = process.env.LIVE_URL ?? "https://daybook-gjf6.onrender.com";

export default defineConfig({
  testDir: "e2e-live",
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0, // the free Render box can be slow to wake
  use: { baseURL: LIVE_URL },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], timezoneId: "Europe/London", locale: "en-GB" } },
    {
      name: "iphone",
      use: { ...devices["iPhone 15"], timezoneId: "Europe/London", locale: "en-GB" },
    },
  ],
});
