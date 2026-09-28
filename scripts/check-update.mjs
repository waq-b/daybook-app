// Regression check for issue #38: a new version must reach an app that's
// already open. Builds version A and serves it, opens it signed in, then
// "deploys" version B (rebuild + server restart, as Render does) with the
// page still open. The page must show the update note, and Update now must
// land on B. Run after the e2e tests: it leaves dist/ as version B.
//   npm run check:update
import { execSync, spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const PORT = "4180";
const URL = `http://localhost:${PORT}`;
const SUPABASE = "http://localhost:54321";
const env = {
  ...process.env,
  VITE_SUPABASE_URL: SUPABASE,
  VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
};

const build = (version) =>
  execSync("npm run build", { env: { ...env, VITE_APP_VERSION: version }, stdio: "ignore" });

async function serve() {
  const server = spawn("node", ["dist-server/index.js"], { env: { ...env, PORT } });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${URL}/api/health`)).ok) return server;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("server didn't start");
}

function fail(message) {
  console.error(`check:update failed: ${message}`);
  process.exitCode = 1;
}

build("check-a");
let server = await serve();
const browser = await chromium.launch();
try {
  const page = await (
    await browser.newContext({ viewport: { width: 390, height: 844 } })
  ).newPage();
  await page.route(`${SUPABASE}/**`, (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: r.request().method() === "GET" ? "[]" : "{}",
    }),
  );
  await page.addInitScript(() => {
    localStorage.setItem("daybook.install-prompt.dismissed", "1");
    localStorage.setItem(
      "sb-localhost-auth-token",
      JSON.stringify({
        access_token: "t",
        refresh_token: "t",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: 4102444800,
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          aud: "authenticated",
          role: "authenticated",
          email: "test@example.com",
          app_metadata: {},
          user_metadata: {},
          created_at: "2026-09-27T00:00:00Z",
        },
      }),
    );
  });

  await page.goto(`${URL}/settings`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByText("Version check-a").waitFor();
  if (await page.getByText("A new version of Daybook is ready.").count())
    fail("note showed with no new version");

  server.kill();
  build("check-b");
  server = await serve();

  // The app comes back to the front: it checks, finds B, and says so.
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.getByText("A new version of Daybook is ready.").waitFor({ timeout: 20_000 });
  if (!(await page.getByText("Version check-a").count()))
    fail("the page changed version by itself");

  await page.getByRole("button", { name: "Update now" }).click();
  await page.getByText("Version check-b").waitFor({ timeout: 20_000 });
  if (await page.getByText("A new version of Daybook is ready.").count())
    fail("note still showing after update");
  if (!process.exitCode) console.log("check:update passed: A → note → Update now → B");
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  await browser.close();
  server.kill();
}
