import { androidOnly, expect, signIn, test } from "./fixtures";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

test.describe("iPhone in Safari", () => {
  test.use({ userAgent: IPHONE });

  test("after sign-in, shows the three steps; Not now lets you in and stays dismissed", async ({
    page,
  }) => {
    await signIn(page, { installPromptSeen: false });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Put Daybook on your home screen",
    );
    await expect(page.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByText("Scroll down and tap Add to Home Screen.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Install Daybook" })).toHaveCount(0);

    await page.getByRole("button", { name: "Not now" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
  });

  test("never shows when opened from the home screen", async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "standalone", { get: () => true }),
    );
    await signIn(page, { installPromptSeen: false });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
  });

  test("Settings can open it again at /install", async ({ page }) => {
    await signIn(page);
    await page.goto("/install");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Put Daybook on your home screen",
    );
    await page.getByRole("button", { name: "Not now" }).click();
    await expect(page).toHaveURL("/settings");
  });
});

test.describe("Android in Chrome", () => {
  test("Install Daybook opens Chrome's own install dialog", async ({ page }, info) => {
    androidOnly(info);
    await signIn(page, { installPromptSeen: false });
    await page.addInitScript(() => {
      (window as unknown as { prompted: boolean }).prompted = false;
      window.addEventListener("load", () => {
        const e = new Event("beforeinstallprompt") as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: string }>;
        };
        e.prompt = async () => {
          (window as unknown as { prompted: boolean }).prompted = true;
        };
        e.userChoice = Promise.resolve({ outcome: "accepted" });
        window.dispatchEvent(e);
      });
    });
    await page.goto("/");
    await expect(page.getByText("What you get")).toBeVisible();
    await page.getByRole("button", { name: "Install Daybook" }).click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { prompted: boolean }).prompted))
      .toBe(true);
    // Accepted: next open goes straight in.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
  });
});

test.describe("desktop", () => {
  test.use({ userAgent: DESKTOP, isMobile: false, hasTouch: false });

  test("no install prompt on a computer", async ({ page }) => {
    await signIn(page, { installPromptSeen: false });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
  });
});
