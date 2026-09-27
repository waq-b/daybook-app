import { expect, fakeSessions, sessionRow, signIn, test } from "./fixtures";

// Saturday 26 September 2026, 10am in London.
const NOW = new Date("2026-09-26T09:00:00Z");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("a first session starts blank and saves what you enter", async ({ page }) => {
  const store = await fakeSessions(page);
  await page.goto("/sessions/new");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("New session");
  await expect(page.getByText("Pick the date and time of your next appointment.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pick a date and time to save" })).toBeDisabled();

  await page.getByLabel("Pick a date").fill("2026-09-29");
  await page.getByLabel("Pick a time").fill("16:00");
  await page.getByLabel("Session notes").fill("Bring the worksheet");
  await page.getByLabel(/Anything else, not a practice yet/).fill("Notice my phone");
  await page.getByRole("button", { name: "Save session" }).click();

  await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tuesday 29 September");
  expect(store).toHaveLength(1);
  expect(store[0]).toMatchObject({
    at: "2026-09-29T15:00:00.000Z", // 4pm BST
    notes: "Bring the worksheet",
    assigned_note: "Notice my phone",
  });
});

test("a next session is set from the last one", async ({ page }) => {
  await fakeSessions(page, [sessionRow(new Date("2026-09-22T15:00:00Z"))]); // Tue 22 Sep 4pm
  await page.goto("/sessions/new");
  await expect(
    page.getByText(
      "Set to the next Tuesday at your last session's time. Change it if yours is different.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Date, Tuesday 29 September. Change")).toHaveValue("2026-09-29");
  await expect(page.getByLabel("Time, 4:00pm. Change")).toHaveValue("16:00");
});

test("editing shows what was saved and saves the change", async ({ page }) => {
  const row = sessionRow(new Date("2026-09-15T15:00:00Z"), {
    notes: "Bus is done.",
    assigned_note: "Notice my phone",
  });
  const store = await fakeSessions(page, [row]);
  await page.goto(`/sessions/${row.id}/edit`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Edit session");
  await expect(page.getByLabel("Session notes")).toHaveValue("Bus is done.");
  await expect(page.getByLabel(/Anything else, not a practice yet/)).toHaveValue("Notice my phone");
  await expect(page.getByText(/Set to the next/)).toHaveCount(0);

  await page.getByLabel("Time, 4:00pm. Change").fill("16:30");
  await page.getByLabel("Session notes").fill("");
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(`/sessions/${row.id}`);
  await expect(page.getByText("4:30pm")).toBeVisible();
  expect(store[0]).toMatchObject({ at: "2026-09-15T15:30:00.000Z", notes: null });
});

test("offline, Save says so and keeps everything", async ({ page, context }) => {
  const store = await fakeSessions(page);
  await page.goto("/sessions/new");
  await page.getByLabel("Pick a date").fill("2026-09-29");
  await page.getByLabel("Pick a time").fill("16:00");
  await page.getByLabel("Session notes").fill("Keep this");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Saving needs a connection. Your changes are still here.",
  );
  await expect(page.getByLabel("Session notes")).toHaveValue("Keep this");
  expect(store).toHaveLength(0);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}$/);
  expect(store).toHaveLength(1);
});

test("close on a new session goes back to the list, on an edit back to the session", async ({
  page,
}) => {
  const store = await fakeSessions(page);
  await page.goto("/sessions/new");
  await page.getByLabel("Session notes").fill("Not saved");
  await page.getByRole("link", { name: "Close without saving" }).click();
  await expect(page).toHaveURL("/sessions");
  expect(store).toHaveLength(0);

  const row = sessionRow(new Date("2026-09-15T15:00:00Z"), { notes: "Kept" });
  store.push(row);
  await page.goto(`/sessions/${row.id}/edit`);
  await page.getByLabel("Session notes").fill("Changed, not saved");
  await page.getByRole("link", { name: "Close without saving" }).click();
  await expect(page).toHaveURL(`/sessions/${row.id}`);
  await expect(page.getByText("Kept")).toBeVisible();
});

test("a session that isn't there says so", async ({ page }) => {
  await fakeSessions(page);
  await page.goto("/sessions/00000000-0000-4000-8000-00000000abcd/edit");
  await expect(page.getByRole("status")).toHaveText("That session isn't here any more.");
  await page.getByRole("link", { name: "Back to sessions" }).click();
  await expect(page).toHaveURL("/sessions");
});
