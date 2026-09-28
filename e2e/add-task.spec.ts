import { expect, fakeTables, practiceRow, signIn, taskRow, test } from "./fixtures";

const NOW = new Date("2026-09-28T09:00:00Z");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("from the empty ladder: add a repeating task and it's on the ladder", async ({ page }) => {
  const p = practiceRow();
  const db = await fakeTables(page, { practices: [p], tasks: [], reps: [] });
  await page.goto(`/practices/${p.id}`);
  await page.getByRole("button", { name: "Add the first task" }).click();
  await expect(page).toHaveURL(`/practices/${p.id}/tasks/new`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Add a task");
  await expect(
    page.getByRole("button", { name: "Name the task and pick a predicted difficulty" }),
  ).toBeDisabled();

  await page.getByLabel("Task", { exact: true }).fill("Eat at a busy restaurant");
  await page.getByRole("radio", { name: "6 of 8" }).click();
  await page.getByRole("button", { name: "Repeating" }).click();
  await expect(page.getByRole("group", { name: "Reps per week" })).toContainText("4");
  await page.getByRole("button", { name: "Fewer" }).click();
  await page.getByLabel("Target date. Pick a date").fill("2026-10-31");
  await page.getByLabel("Notes").fill("Somewhere on Gloucester Road.");
  await page.getByRole("button", { name: "Add to the ladder" }).click();

  await expect(page).toHaveURL(`/practices/${p.id}`);
  await expect(page.getByText("Eat at a busy restaurant")).toBeVisible();
  expect(db.tasks[0]).toMatchObject({
    practice_id: p.id,
    name: "Eat at a busy restaurant",
    predicted: 6,
    repeating: true,
    reps_per_week: 3,
    target_date: "2026-10-31",
    notes: "Somewhere on Gloucester Road.",
  });
});

test("where it lands re-sorts as you pick, and a high rung gets a soft note", async ({ page }) => {
  const p = practiceRow();
  await fakeTables(page, {
    practices: [p],
    tasks: [taskRow(p.id, "Coffee", 5), taskRow(p.id, "Gym", 7)],
    reps: [],
  });
  await page.goto(`/practices/${p.id}/tasks/new`);
  await page.getByLabel("Task", { exact: true }).fill("Big shop");
  await page.getByRole("radio", { name: "6 of 8" }).click();
  const lands = page.getByRole("region", { name: "Where it lands" }).getByRole("listitem");
  await expect(lands).toHaveText([/Coffee/, /Big shop.*New/, /Gym/]);
  await expect(page.getByRole("status")).toHaveText(
    "This one's high up, and nothing at 4 or 5 is done yet. You might want a step in between first. Up to you, you can still add it.",
  );
  await page.getByRole("radio", { name: "3 of 8" }).click();
  await expect(lands).toHaveText([/Big shop.*New/, /Coffee/, /Gym/]);
  await expect(page.getByText(/This one's high up/)).toHaveCount(0);
  await page.getByRole("radio", { name: "8 of 8" }).click();
  await expect(page.getByText(/nothing at 6 or 7 is done yet/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to the ladder" })).toBeEnabled();
});

test("one-off sends no reps per week", async ({ page }) => {
  const p = practiceRow();
  const db = await fakeTables(page, { practices: [p], tasks: [], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/new`);
  await page.getByLabel("Task", { exact: true }).fill("Phone the landlord");
  await page.getByRole("radio", { name: "7 of 8" }).click();
  await page.getByRole("button", { name: "Repeating" }).click();
  await page.getByRole("button", { name: "One-off" }).click();
  await page.getByRole("button", { name: "Add to the ladder" }).click();
  await expect.poll(() => db.tasks.length).toBe(1);
  expect(db.tasks[0]).toMatchObject({
    repeating: false,
    reps_per_week: null,
    target_date: null,
    notes: null,
  });
});

test("edit: filled in with what was saved; changes save", async ({ page }) => {
  const p = practiceRow();
  const gym = taskRow(p.id, "Gym", 7, { repeating: true, reps_per_week: 4, notes: "Earphones" });
  const db = await fakeTables(page, { practices: [p], tasks: [gym], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/${gym.id}/edit`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Edit task");
  await expect(page.getByLabel("Task", { exact: true })).toHaveValue("Gym");
  await expect(page.getByRole("radio", { name: "7 of 8" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: "Repeating" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel("Notes")).toHaveValue("Earphones");
  await page.getByLabel("Task", { exact: true }).fill("Go to the gym at 6pm");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => db.tasks[0]!.name).toBe("Go to the gym at 6pm");
});

test("archive asks once, then the rung leaves the ladder", async ({ page }) => {
  const p = practiceRow();
  const gym = taskRow(p.id, "Gym", 7);
  const db = await fakeTables(page, { practices: [p], tasks: [gym], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/${gym.id}/edit`);
  await page.getByRole("button", { name: "Archive this task" }).click();
  const sheet = page.getByRole("dialog", { name: "Archive this task?" });
  await expect(sheet).toContainText("It leaves the ladder. Its reps stay in your history.");
  await sheet.getByRole("button", { name: "Keep it" }).click();
  expect(db.tasks[0]!.archived_at).toBeNull();
  await page.getByRole("button", { name: "Archive this task" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Archive it" }).click();
  await expect(page).toHaveURL(`/practices/${p.id}`);
  expect(db.tasks[0]!.archived_at).not.toBeNull();
  await expect(page.getByText("No tasks yet. Add the first rung.")).toBeVisible();
});

test("offline, adding says so and keeps what you typed", async ({ page, context }) => {
  const p = practiceRow();
  const db = await fakeTables(page, { practices: [p], tasks: [], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/new`);
  await page.getByLabel("Task", { exact: true }).fill("Gym");
  await page.getByRole("radio", { name: "7 of 8" }).click();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Add to the ladder" }).click();
  await expect(page.getByRole("status").last()).toHaveText(
    "Adding or changing a task needs a connection. Everything you typed is still here.",
  );
  await expect(page.getByLabel("Task", { exact: true })).toHaveValue("Gym");
  expect(db.tasks).toHaveLength(0);
  await context.setOffline(false);
});
