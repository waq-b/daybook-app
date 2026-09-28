// DESIGN.md §7 "Dynamic type": every 0a screen at 200% zoom, with no
// sideways scroll and the primary action still reachable. (iOS Larger Text
// doesn't scale px type in an installed PWA; see DESIGN.md §4.)
import type { Page } from "@playwright/test";
import { androidOnly, expect, mockSupabase, signIn, test } from "./fixtures";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

async function atDoubleSize(page: Page) {
  await page.addStyleTag({ content: "html { zoom: 2 }" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("sign in, both steps", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/sign-in");
  await atDoubleSize(page);
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: "Email me a code" }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByLabel("6-digit code")).toBeVisible();
  await atDoubleSize(page);
  await expect(page.getByRole("button", { name: "Enter the 6-digit code" })).toBeAttached();
});

test.describe("install prompt on iPhone", () => {
  test.use({ userAgent: IPHONE });
  test("three steps and Not now", async ({ page }) => {
    await signIn(page, { installPromptSeen: false });
    await page.goto("/");
    await atDoubleSize(page);
    await page.getByRole("button", { name: "Not now" }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Not now" })).toBeInViewport();
  });
});

test("install prompt on Android", async ({ page }, info) => {
  androidOnly(info);
  await signIn(page, { installPromptSeen: false });
  await page.goto("/");
  await atDoubleSize(page);
  await page.getByRole("button", { name: "Install Daybook" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Install Daybook" })).toBeInViewport();
});

test("Settings, and both delete steps", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings");
  await atDoubleSize(page);
  await page.getByRole("button", { name: /Delete everything/ }).click();
  await atDoubleSize(page);
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Continue" }).scrollIntoViewIfNeeded();
  await sheet.getByRole("button", { name: "Continue" }).click();
  await atDoubleSize(page);
  await sheet.getByRole("button", { name: "Keep everything" }).scrollIntoViewIfNeeded();
  await expect(sheet.getByRole("button", { name: "Keep everything" })).toBeInViewport();
});
