import { expect, signedInTest as test } from "./fixtures";

const TABS = [
  ["Practices", "/practices", "Practices"],
  ["Sessions", "/sessions", "Sessions"],
  ["History", "/history", "History"],
  ["Settings", "/settings", "Settings"],
  ["Today", "/", "Today"],
] as const;

test("the five tabs switch screens and mark the current one", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const [label, path, heading] of TABS) {
    await nav.getByRole("button", { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(nav.getByRole("button", { name: label })).toHaveAttribute("aria-current", "page");
  }
});

test("a deep link opens its tab, and an unknown path goes to Today", async ({ page }) => {
  await page.goto("/sessions");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sessions");
  await page.goto("/nowhere");
  await expect(page).toHaveURL("/");
});

test("the nav sits at the bottom and nothing scrolls sideways, even at 200% text", async ({
  page,
}) => {
  await page.goto("/");
  const viewport = page.viewportSize()!;
  const box = await page.getByRole("navigation", { name: "Main" }).boundingBox();
  expect(Math.round(box!.y + box!.height)).toBe(viewport.height);

  for (const path of ["/", "/practices", "/sessions", "/history", "/settings"]) {
    await page.goto(path);
    await page.addStyleTag({ content: "html { zoom: 2 }" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("every nav target is at least 44px", async ({ page }) => {
  await page.goto("/");
  for (const button of await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button")
    .all()) {
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});
