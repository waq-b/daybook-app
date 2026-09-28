// The installability and offline check that replaces Lighthouse's removed PWA
// category (plan D8).
import { expect, needsServiceWorker, signedInTest, test } from "./fixtures";

test("manifest has what install needs, and its icons load", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const res = await request.get(href!);
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({
    name: "Daybook",
    short_name: "Daybook",
    display: "standalone",
    start_url: "/",
  });
  expect(manifest.theme_color).toMatch(/^#/);
  expect(manifest.background_color).toMatch(/^#/);

  const icons: Array<{ src: string; sizes: string; purpose?: string }> = manifest.icons;
  expect(icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  for (const icon of [...icons, { src: "/icons/apple-touch-icon.png" }]) {
    const img = await request.get(icon.src);
    expect(img.ok(), icon.src).toBe(true);
    expect(img.headers()["content-type"]).toBe("image/png");
  }
});

test("iOS home-screen tags are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    "content",
    "yes",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /viewport-fit=cover/,
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /^#/);
});

signedInTest(
  "a service worker takes control and the app opens offline",
  async ({ page, context }, info) => {
    needsServiceWorker(info);
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");

    // Any app route falls back to the cached shell, fonts included.
    await page.goto("/dev/states");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Component states");
    expect(
      await page.evaluate(() => document.fonts.check('16px "Atkinson Hyperlegible Next"')),
    ).toBe(true);
    await context.setOffline(false);
  },
);

test("the API is never answered from the cache", async ({ page, context }, info) => {
  needsServiceWorker(info);
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  const status = await page.evaluate(() =>
    fetch("/api/health").then(
      (r) => r.status,
      () => "network error",
    ),
  );
  expect(status).toBe("network error");
  await context.setOffline(false);
});

test("no request leaves for Google Fonts", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("fonts.g")) external.push(r.url());
  });
  await page.goto("/dev/states");
  await page.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]);
});
