// What would otherwise be checked by hand by opening the site on a phone.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const EXPECT_VERSION = process.env.EXPECT_VERSION; // the short commit this deploy should be serving

test("the deploy is live and serving the expected commit", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.ok).toBe(true);
  if (EXPECT_VERSION) expect(body.version).toBe(EXPECT_VERSION);
});

test("signed out, every screen goes to sign in, which looks right and passes axe", async ({
  page,
}) => {
  for (const path of ["/", "/practices", "/sessions", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in$/);
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
  await expect(page.getByText("A logbook for the practical side of therapy.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter your email to get a code" })).toBeDisabled();
  await page.getByLabel("Email").fill("someone@example.com");
  await expect(page.getByRole("button", { name: "Email me a code" })).toBeEnabled();
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test("installable: manifest, icons and iOS home-screen tags", async ({ page, request }) => {
  await page.goto("/sign-in");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({ name: "Daybook", display: "standalone", start_url: "/" });
  for (const icon of [...manifest.icons, { src: "/icons/apple-touch-icon.png" }]) {
    const img = await request.get(icon.src);
    expect(img.ok(), icon.src).toBe(true);
    expect(img.headers()["content-type"]).toBe("image/png");
  }
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    "content",
    "yes",
  );
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /viewport-fit=cover/,
  );
});

test("fonts are the self-hosted Atkinson, never Google's", async ({ page }) => {
  const google: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("fonts.g")) google.push(r.url());
  });
  await page.goto("/dev/states");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Atkinson Hyperlegible Next"'))).toBe(
    true,
  );
  expect(google).toEqual([]);
});

test("a missing file is a real 404, never the app page", async ({ request }) => {
  for (const url of ["/assets/index-gone.js", "/icons/gone.png"]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(404);
    expect(res.headers()["content-type"] ?? "").not.toMatch(/html/);
  }
});

test("the service worker takes control of the real build", async ({ page }, info) => {
  test.skip(
    info.project.name === "iphone",
    "Chromium checks the service worker; WebKit in Playwright is less reliable here.",
  );
  await page.goto("/sign-in");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
});
