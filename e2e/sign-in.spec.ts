import { expect, mockSupabase, test, testSession } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
});

test("signed out, every screen goes to sign in", async ({ page }) => {
  for (const path of ["/", "/sessions", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/sign-in");
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
});

test("email, then code, then Today", async ({ page }) => {
  let otpBody: Record<string, unknown> = {};
  await page.route("**/auth/v1/otp*", async (route) => {
    otpBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/auth/v1/verify*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(testSession()),
    }),
  );

  await page.goto("/sign-in");
  const send = page.getByRole("button", { name: "Enter your email to get a code" });
  await expect(send).toBeDisabled();

  await page.getByLabel("Email").fill(" Test@Example.com ");
  await page.getByRole("button", { name: "Email me a code" }).click();
  expect(otpBody.email).toBe("test@example.com");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check your email");
  await expect(
    page.getByText("We sent a code to test@example.com. It works for 10 minutes."),
  ).toBeVisible();
  const code = page.getByLabel("6-digit code");
  await expect(code).toHaveAttribute("autocomplete", "one-time-code");
  await expect(code).toHaveAttribute("inputmode", "numeric");
  await expect(page.getByRole("button", { name: "Enter the 6-digit code" })).toBeDisabled();

  await code.fill("482913");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
  // In a phone browser, the install prompt comes first (task 8).
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Put Daybook on your home screen",
  );
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");

  // Reopening stays signed in.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
});

test("a wrong code says so calmly and keeps the form", async ({ page }) => {
  await page.route("**/auth/v1/verify*", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: "otp_expired", message: "Token has expired or is invalid" }),
    }),
  );
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByLabel("6-digit code").fill("000000");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "That code didn't work. Check it against the latest email, or send a new one.",
  );
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();

  await page.getByRole("button", { name: "Send a new code" }).click();
  await expect(page.getByRole("status")).toHaveText("A new code is on its way.");

  await page.getByRole("button", { name: "Use a different email" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
});

test("offline, sign in says it needs a connection", async ({ page, context }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("test@example.com");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Signing in needs a connection. Try again when you're back online.",
  );
  await context.setOffline(false);
});
