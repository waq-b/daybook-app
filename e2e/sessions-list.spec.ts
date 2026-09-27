import { expect, fakeSessions, sessionRow, signIn, test } from "./fixtures";

// Saturday 26 September 2026, 10am in London.
const NOW = new Date("2026-09-26T09:00:00Z");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("empty: the empty state and one primary button to add the next session", async ({ page }) => {
  await fakeSessions(page);
  await page.goto("/sessions");
  await expect(page.getByText("No sessions yet")).toBeVisible();
  await expect(
    page.getByText("Add your next appointment. Anything you flag will collect for it."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add your next session" }).click();
  await expect(page).toHaveURL("/sessions/new");
});

test("filled: next session card with its countdown, later and past sessions", async ({ page }) => {
  const next = sessionRow(new Date("2026-09-29T15:00:00Z")); // Tue 29 Sep 4pm
  const later = sessionRow(new Date("2026-10-06T15:00:00Z"));
  const pastDone = sessionRow(new Date("2026-09-15T15:00:00Z"), {
    notes: "Bus is done.\nKeep coffee going twice a week.",
    done_at: "2026-09-15T16:00:00Z",
  });
  const pastForgot = sessionRow(new Date("2026-09-22T15:30:00Z"));
  await fakeSessions(page, [pastDone, later, next, pastForgot]);
  await page.goto("/sessions");

  const card = page.getByRole("link", {
    name: "Next session, Tuesday 29 September at 4pm, in 3 days",
  });
  await expect(card).toBeVisible();
  await expect(card).toContainText("3");
  await expect(card).toContainText("days");

  const laterRows = page.locator("section", { has: page.getByRole("heading", { name: "Later" }) });
  await expect(laterRows.getByRole("link")).toHaveCount(1);

  const past = page.locator("section", { has: page.getByRole("heading", { name: "Past" }) });
  const rows = past.getByRole("link");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("22");
  await expect(rows.nth(0)).toContainText("No notes");
  await expect(rows.nth(0)).toContainText("4:30pm · Not marked done");
  await expect(rows.nth(1)).toContainText("Bus is done.");
  await expect(rows.nth(1)).not.toContainText("Keep coffee");
  await expect(rows.nth(1)).toContainText("4pm · Marked done");

  await page.getByRole("button", { name: "Add a session" }).click();
  await expect(page).toHaveURL("/sessions/new");
});

test("today and tomorrow read as words", async ({ page }) => {
  await fakeSessions(page, [sessionRow(new Date("2026-09-26T15:00:00Z"))]);
  await page.goto("/sessions");
  await expect(
    page.getByRole("link", { name: /^Next session, Saturday 26 September at 4pm, Today$/ }),
  ).toBeVisible();
});

test("offline, it says loading needs a connection", async ({ page, context }) => {
  await fakeSessions(page);
  await page.goto("/");
  await context.setOffline(true);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Sessions" })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Sessions need a connection to load. Anything you add on the edit screen needs one too.",
  );
  await context.setOffline(false);
});

test("a saved session appears as next", async ({ page }) => {
  await fakeSessions(page);
  await page.goto("/sessions");
  await page.getByRole("button", { name: "Add your next session" }).click();
  await page.getByLabel("Pick a date").fill("2026-09-29");
  await page.getByLabel("Pick a time").fill("16:00");
  await page.getByRole("button", { name: "Save session" }).click();
  await page.getByRole("link", { name: "Sessions", exact: true }).click();
  await expect(page).toHaveURL("/sessions");
  await expect(
    page.getByRole("link", { name: /^Next session, Tuesday 29 September at 4pm/ }),
  ).toBeVisible();
});
