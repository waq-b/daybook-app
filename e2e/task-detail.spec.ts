import { expect, fakeTables, practiceRow, repRow, signIn, taskRow, test } from "./fixtures";

// Monday 28 September 2026, 10am in London.
const NOW = new Date("2026-09-28T09:00:00Z");
const d = (iso: string) => new Date(iso);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("not tried yet (board TaskDetailNew)", async ({ page }) => {
  const p = practiceRow();
  const phone = taskRow(p.id, "Phone the dentist", 7, {
    target_date: "2026-09-30",
    notes: "About a check-up",
  });
  await fakeTables(page, { practices: [p], tasks: [phone], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/${phone.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Phone the dentist");
  const header = page.locator("header.task-header");
  await expect(header).toContainText("Predicted7");
  await expect(header).toContainText("Remaining–");
  await expect(header).toContainText("One-off · by Wed");
  await expect(header).toContainText("About a check-up");
  await expect(page.getByText("No reps yet.")).toBeVisible();
  await expect(
    page.getByText("When you log the first one, it'll show here against the 7 you predicted."),
  ).toBeVisible();
  await expect(page.getByRole("figure")).toHaveCount(0);
  await expect(page.getByText("Before the next one")).toHaveCount(0); // prediction check off by default
  await expect(page.getByRole("button", { name: "Log it" })).toBeVisible();
});

test("in progress: chart, tally 4 + 1, reps newest first", async ({ page }) => {
  const p = practiceRow();
  const gym = taskRow(p.id, "Go to the gym at 6pm", 7, { repeating: true, reps_per_week: 4 });
  await fakeTables(page, {
    practices: [p],
    tasks: [gym],
    reps: [
      repRow(gym.id, d("2026-09-01T17:10:00Z"), 8, 7, {
        note: "Turned round at the door once, then went in.",
      }),
      repRow(gym.id, d("2026-09-03T17:05:00Z"), 7, 6),
      repRow(gym.id, d("2026-09-07T17:20:00Z"), 7, 7, { left_early: true }),
      repRow(gym.id, d("2026-09-17T17:00:00Z"), 6, 5, { coping: ["Earphones in"] }),
      repRow(gym.id, d("2026-09-28T07:40:00Z"), 5, 5, { note: "Stayed the full 40 minutes." }),
    ],
  });
  await page.goto(`/practices/${p.id}/tasks/${gym.id}`);
  const header = page.locator("header.task-header");
  await expect(header).toContainText("Remaining5");
  await expect(header).toContainText("Tally4 + 1");
  await expect(header).toContainText("Repeating, 4 a week · 1 of 4 this week");
  await expect(
    page.getByRole("img", {
      name: "Thought 7. The first one was an 8, the latest a 5. Remaining has gone from 7 to 5.",
    }),
  ).toBeVisible();
  const cards = page.locator(".task-reps").getByText(/^Rep \d$/);
  await expect(cards).toHaveText(["Rep 5", "Rep 4", "Rep 3", "Rep 2", "Rep 1"]);
  await expect(page.getByText("Earphones in")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log a rep" })).toBeVisible();
});

test("done: the tinted header, comments that save, Log another rep", async ({ page }) => {
  const p = practiceRow();
  const coffee = taskRow(p.id, "Walk to the shop", 5);
  const db = await fakeTables(page, {
    practices: [p],
    tasks: [coffee],
    reps: [
      repRow(coffee.id, d("2026-09-05T10:00:00Z"), 6, 5),
      repRow(coffee.id, d("2026-09-26T09:30:00Z"), 4, 3),
    ],
  });
  await page.goto(`/practices/${p.id}/tasks/${coffee.id}`);
  await expect(page.getByText("Done. Remaining 3, under the 4 line.")).toBeVisible();
  await expect(page.getByText("Date completed 26 Sep")).toBeVisible();
  await expect(page.locator("header.task-header")).toContainText("One-off · 2 reps");
  await expect(page.getByRole("button", { name: "Save comments" })).toHaveCount(0);
  await page.getByLabel("Comments").fill("Small Street Espresso, sat in the window.");
  await page.getByRole("button", { name: "Save comments" }).click();
  await expect.poll(() => db.tasks[0]!.comments).toBe("Small Street Espresso, sat in the window.");
  await expect(page.getByRole("button", { name: "Save comments" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log another rep" })).toBeVisible();
});

test("flag a rep from its card; offline it waits and syncs later", async ({ page, context }) => {
  const p = practiceRow();
  const gym = taskRow(p.id, "Gym", 7);
  const rep = repRow(gym.id, d("2026-09-27T17:00:00Z"), 6, 5);
  const db = await fakeTables(page, { practices: [p], tasks: [gym], reps: [rep] });
  await page.goto(`/practices/${p.id}/tasks/${gym.id}`);
  await expect(page.getByText("Rep 1")).toBeVisible(); // loaded before the connection goes

  await context.setOffline(true);
  await page
    .locator(".task-reps")
    .getByRole("button", { name: /Bring to session|Flag/ })
    .click();
  await expect(page.locator(".task-reps").getByRole("button", { pressed: true })).toHaveCount(1);
  expect(db.reps[0]!.flagged).toBe(false); // still only on the phone

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => db.reps[0]!.flagged).toBe(true);
  await page.reload();
  await expect(page.locator(".task-reps").getByRole("button", { pressed: true })).toHaveCount(1);
});

test("with the prediction check on: Before the next one saves on leaving the box", async ({
  page,
}) => {
  const p = practiceRow({ settings: { prediction_check: true } });
  const gym = taskRow(p.id, "Gym", 7);
  const db = await fakeTables(page, { practices: [p], tasks: [gym], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/${gym.id}`);
  await expect(page.getByText("Before the next one")).toBeVisible();
  await page.getByLabel("What do you think will happen?").fill("Everyone will stare");
  await page
    .getByRole("group", { name: "How likely does that feel?" })
    .getByRole("button", { name: "Fairly" })
    .click();
  await expect.poll(() => db.tasks[0]!.next_prediction).toBe("Everyone will stare");
  await expect.poll(() => db.tasks[0]!.next_prediction_likelihood).toBe("fairly");
});

test("Edit → Save changes comes back to the task; back goes to the ladder", async ({ page }) => {
  const p = practiceRow();
  const gym = taskRow(p.id, "Gym", 7);
  await fakeTables(page, { practices: [p], tasks: [gym], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/${gym.id}`);
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page).toHaveURL(`/practices/${p.id}/tasks/${gym.id}/edit`);
  await page.getByLabel("Task", { exact: true }).fill("Go to the gym at 6pm");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(`/practices/${p.id}/tasks/${gym.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Go to the gym at 6pm");
  await page.getByRole("link", { name: "Activity hierarchy" }).click();
  await expect(page).toHaveURL(`/practices/${p.id}`);
});
