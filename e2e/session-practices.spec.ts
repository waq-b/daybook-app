import {
  expect,
  fakeSessions,
  fakeTables,
  practiceRow,
  repRow,
  sessionRow,
  signIn,
  taskRow,
  test,
} from "./fixtures";

// Tuesday 29 September 2026, 10am in London.
const NOW = new Date("2026-09-29T09:00:00Z");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("link a practice from Edit session; the detail shows it and opens the ladder", async ({
  page,
}) => {
  const s = sessionRow(new Date("2026-09-29T15:00:00Z"));
  const p = practiceRow();
  await fakeSessions(page, [s]);
  const db = await fakeTables(page, { practices: [p], tasks: [], reps: [] });
  await page.goto(`/sessions/${s.id}/edit`);
  const chip = page
    .getByRole("group", { name: "Assigned in session" })
    .getByRole("button", { name: "Activity hierarchy" });
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(`/sessions/${s.id}`);
  expect(db.practices[0]!.session_id).toBe(s.id);

  await page.getByRole("link", { name: /Activity hierarchy/ }).click();
  await expect(page).toHaveURL(`/practices/${p.id}`);
});

test("unlinking changes nothing about the practice or its reps", async ({ page }) => {
  const s = sessionRow(new Date("2026-09-29T15:00:00Z"));
  const p = practiceRow({ session_id: s.id });
  const gym = taskRow(p.id, "Gym", 7);
  const rep = repRow(gym.id, new Date("2026-09-28T17:00:00Z"), 6, 5);
  await fakeSessions(page, [s]);
  const db = await fakeTables(page, { practices: [p], tasks: [gym], reps: [rep] });
  await page.goto(`/sessions/${s.id}/edit`);
  await page
    .getByRole("group", { name: "Assigned in session" })
    .getByRole("button", { name: "Activity hierarchy" })
    .click();
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(`/sessions/${s.id}`);
  expect(db.practices[0]).toMatchObject({
    id: p.id,
    session_id: null,
    name: "Activity hierarchy",
    archived_at: null,
  });
  expect(db.tasks).toHaveLength(1);
  expect(db.reps).toHaveLength(1);

  await page.goto(`/practices/${p.id}`);
  await expect(page.getByText("Gym")).toBeVisible();
});

test("a new session can add the hierarchy on the spot, and it's linked", async ({ page }) => {
  await fakeSessions(page);
  const db = await fakeTables(page, { practices: [], tasks: [], reps: [] });
  await page.goto("/sessions/new");
  await page.getByLabel("Pick a date").fill("2026-10-06");
  await page.getByLabel("Pick a time").fill("16:00");
  await page.getByRole("button", { name: "Add a practice" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Activity hierarchy/ })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Assigned in session" })
      .getByRole("button", { name: "Activity hierarchy" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}$/);
  expect(db.practices).toHaveLength(1);
  expect(db.practices[0]!.session_id).toBe(page.url().split("/").pop());
});

test("Link a practice on today's session; not offered on an upcoming one", async ({ page }) => {
  const today = sessionRow(new Date("2026-09-29T15:00:00Z"));
  const later = sessionRow(new Date("2026-10-06T15:00:00Z"));
  const p = practiceRow();
  await fakeSessions(page, [today, later]);
  const db = await fakeTables(page, { practices: [p], tasks: [], reps: [] });

  await page.goto(`/sessions/${later.id}`);
  await expect(page.getByRole("button", { name: "Link a practice" })).toHaveCount(0);

  await page.goto(`/sessions/${today.id}`);
  await page.getByRole("button", { name: "Link a practice" }).click();
  await page
    .getByRole("dialog", { name: "Link a practice" })
    .getByRole("button", { name: /Activity hierarchy/ })
    .click();
  await expect.poll(() => db.practices[0]!.session_id).toBe(today.id);
  await expect(page.getByRole("link", { name: /Activity hierarchy/ })).toBeVisible();
});

test("a session with no practices at all still saves (practices never needed)", async ({
  page,
}) => {
  const store = await fakeSessions(page);
  await fakeTables(page, { practices: [], tasks: [], reps: [] });
  await page.goto("/sessions/new");
  await page.getByLabel("Pick a date").fill("2026-10-06");
  await page.getByLabel("Pick a time").fill("16:00");
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}$/);
  expect(store).toHaveLength(1);
});
