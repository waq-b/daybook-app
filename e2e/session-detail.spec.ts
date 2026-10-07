import { expect, fakeSessions, sessionRow, signIn, test } from "./fixtures";

// Tuesday 29 September 2026, 10am in London.
const NOW = new Date("2026-09-29T09:00:00Z");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("today's session: notes, assigned line, and Mark session as done", async ({ page }) => {
  const today = sessionRow(new Date("2026-09-29T15:00:00Z"), {
    notes: "Gym is working.\nPhone the dentist before next time.",
    assigned_note: "Notice when I check my phone to avoid talking",
  });
  const store = await fakeSessions(page, [today]);
  await page.goto("/sessions");
  await page.getByRole("link", { name: /^Next session/ }).click();

  await expect(page).toHaveURL(`/sessions/${today.id}`);
  await expect(page.getByRole("main").getByText("Today", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tuesday 29 September");
  await expect(page.getByRole("main").getByText("4pm", { exact: true })).toBeVisible();
  await expect(page.getByText("Phone the dentist before next time.")).toBeVisible();
  await expect(page.getByText("Notice when I check my phone to avoid talking")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("The entries stay in your history.");

  await page.getByRole("button", { name: "Mark session as done" }).click();
  await expect(page.getByRole("main").getByText("Done", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark session as done" })).toHaveCount(0);
  expect(store[0]!.done_at).not.toBeNull();

  // It moves from next to Past.
  await page.getByRole("link", { name: "Sessions", exact: true }).click();
  await expect(page.getByRole("link", { name: /^Next session/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Past" })).toBeVisible();
});

test("an upcoming session has no Mark as done", async ({ page }) => {
  const upcoming = sessionRow(new Date("2026-10-06T15:00:00Z"));
  await fakeSessions(page, [upcoming]);
  await page.goto(`/sessions/${upcoming.id}`);
  await expect(page.getByRole("main").getByText("Upcoming", { exact: true })).toBeVisible();
  await expect(page.getByText("No notes yet. Add them with Edit.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark session as done" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Assigned in session" })).toHaveCount(0);
});

test("an earlier session nobody marked done can still be marked", async ({ page }) => {
  const forgot = sessionRow(new Date("2026-09-22T15:00:00Z"));
  await fakeSessions(page, [forgot]);
  await page.goto(`/sessions/${forgot.id}`);
  await expect(page.getByRole("main").getByText("Not marked done", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark session as done" })).toBeEnabled();
});

test("offline, Mark as done says nothing changed", async ({ page, context }) => {
  const today = sessionRow(new Date("2026-09-29T15:00:00Z"));
  const store = await fakeSessions(page, [today]);
  await page.goto(`/sessions/${today.id}`);
  const button = page.getByRole("button", { name: "Mark session as done" });
  await expect(button).toBeVisible(); // loaded before the connection goes
  await context.setOffline(true);
  await button.click();
  await expect(page.getByRole("status")).toHaveText(
    "Marking it done needs a connection. Nothing has changed.",
  );
  expect(store[0]!.done_at).toBeNull();
  await context.setOffline(false);
});

test("Edit and back keeps you on the same session", async ({ page }) => {
  const s = sessionRow(new Date("2026-09-29T15:00:00Z"), { notes: "First line" });
  await fakeSessions(page, [s]);
  await page.goto(`/sessions/${s.id}`);
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page).toHaveURL(`/sessions/${s.id}/edit`);
  await page.getByLabel("Session notes").fill("Changed");
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(`/sessions/${s.id}`);
  await expect(page.getByText("Changed", { exact: true })).toBeVisible();
});

test("the Sessions tab stays lit on a session", async ({ page }) => {
  const s = sessionRow(new Date("2026-09-29T15:00:00Z"));
  await fakeSessions(page, [s]);
  await page.goto(`/sessions/${s.id}`);
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Sessions" }),
  ).toHaveAttribute("aria-current", "page");
});
