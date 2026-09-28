import { expect, fakeTables, practiceRow, repRow, signIn, taskRow, test } from "./fixtures";

// Monday 28 September 2026, 6pm in London (car park time).
const NOW = new Date("2026-09-28T17:00:00Z");
const d = (iso: string) => new Date(iso);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

function gymWorld(extra: { settings?: Record<string, unknown>; next_prediction?: string } = {}) {
  const p = practiceRow(extra.settings ? { settings: extra.settings } : {});
  const gym = taskRow(p.id, "Go to the gym at 6pm", 7, {
    repeating: true,
    reps_per_week: 4,
    next_prediction: extra.next_prediction ?? null,
    next_prediction_likelihood: extra.next_prediction ? "very" : null,
  });
  const reps = [
    repRow(gym.id, d("2026-09-01T17:10:00Z"), 8, 7, { coping: ["Earphones in"] }),
    repRow(gym.id, d("2026-09-22T17:40:00Z"), 5, 5, {
      coping: ["Earphones in", "Stayed near the door"],
    }),
  ];
  return { p, gym, reps };
}

async function pick(page: import("@playwright/test").Page, scale: string, n: number) {
  await page
    .getByRole("radiogroup", { name: scale })
    .getByRole("radio", { name: `${n} of 8` })
    .click();
}

test("log a rep online: Save needs both scores, it lands once, Done goes back to the task", async ({
  page,
}) => {
  const w = gymWorld();
  const db = await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}`);
  await page.getByRole("button", { name: "Log a rep" }).click();
  await expect(page).toHaveURL(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await expect(page.getByText("Predicted difficulty 7 · rep 3 · 0 of 4 this week")).toBeVisible();

  const save = page.getByRole("button", { name: "Pick both scores to save" });
  await expect(save).toBeDisabled();
  await pick(page, "Actual difficulty", 6);
  await expect(save).toBeDisabled();
  await pick(page, "Remaining difficulty", 5);

  await page.getByRole("button", { name: "Note, or anything that made it easier" }).click();
  await expect(page.getByRole("button", { name: "Earphones in" })).toBeVisible(); // your own picks, most used first
  await page.getByRole("button", { name: "Earphones in" }).click();
  await page.getByRole("button", { name: "Other" }).click();
  await page.getByLabel("What was it?").fill("Went at a quiet time");
  await page.getByRole("button", { name: "Add it" }).click();
  await page.getByLabel("Note").fill("Stayed the full 40 minutes.");
  await page.getByRole("button", { name: "Bring to session" }).click();
  await page.getByRole("button", { name: "Save rep" }).click();

  await expect(page.getByRole("status").first()).toContainText(
    "Logged. Thought 7, it was 6, now it's a 5.",
  );
  await expect(page.getByText("1 of 4", { exact: true })).toBeVisible();
  await expect.poll(() => db.reps.length).toBe(3);
  expect(db.reps[2]).toMatchObject({
    task_id: w.gym.id,
    actual: 6,
    remaining: 5,
    left_early: false,
    coping: ["Earphones in", "Went at a quiet time"],
    note: "Stayed the full 40 minutes.",
    flagged: true,
    prediction: null,
  });

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(`/practices/${w.p.id}/tasks/${w.gym.id}`);
  await expect(page.locator(".task-reps").getByText("Rep 3")).toBeVisible();
});

test("offline: saved on this phone, then exactly one row once the signal's back (the car park)", async ({
  page,
  context,
}) => {
  const w = gymWorld();
  const db = await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}`);
  await expect(page.getByRole("button", { name: "Log a rep" })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.getByRole("button", { name: "Log a rep" }).click();
  await pick(page, "Actual difficulty", 5);
  await pick(page, "Remaining difficulty", 5);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect(page.getByText("Saved on this phone, will sync")).toBeVisible();
  expect(db.reps).toHaveLength(2);

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(`/practices/${w.p.id}/tasks/${w.gym.id}`);
  // Reopen the app with no signal: the rep is still there.
  await page.reload();
  await expect(page.locator(".task-reps").getByText("Rep 3")).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => db.reps.length).toBe(3);
  // Nudge another sync: still exactly one new row.
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForTimeout(300);
  expect(db.reps).toHaveLength(3);
});

test("started, left early: counts in the tally and the week", async ({ page }) => {
  const w = gymWorld();
  const db = await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await page.getByRole("button", { name: "Started, left early" }).click();
  await pick(page, "Actual difficulty", 7);
  await pick(page, "Remaining difficulty", 3);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Logged as started, left early. It still goes in the tally.",
  );
  await expect(page.getByText("1 of 4, 1 left early")).toBeVisible();
  await expect(page.getByRole("img", { name: "2 reps, 1 attempt" })).toBeVisible();
  await expect.poll(() => db.reps.at(-1)?.left_early).toBe(true);
  // An attempt at 3 doesn't finish the rung: Done goes to the task, not the ladder.
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(`/practices/${w.p.id}/tasks/${w.gym.id}`);
});

test("finishing a rung: 'That one's done.', then the ladder shows it once", async ({ page }) => {
  const w = gymWorld();
  await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await pick(page, "Actual difficulty", 4);
  await pick(page, "Remaining difficulty", 3);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect(page.locator(".db-celebration")).toContainText(
    "That one's done. Remaining 3, under the 4 line.",
  );
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(`/practices/${w.p.id}`);
  await expect(page.locator(".ladder-bar .db-celebration")).toContainText(
    "Go to the gym at 6pm. Remaining 3, under the 4 line.",
  );
  await expect(page.getByRole("region", { name: "Done" })).toContainText("Go to the gym at 6pm");
});

test("no celebration for a rep that's neither easier nor done", async ({ page }) => {
  const w = gymWorld();
  await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await pick(page, "Actual difficulty", 7);
  await pick(page, "Remaining difficulty", 6);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect(page.getByText("Logged. Thought 7, it was 7, now it's a 6.")).toBeVisible();
  await expect(page.locator(".db-celebration")).toHaveCount(0);
});

test("a half-filled rep survives closing the app", async ({ page }) => {
  const w = gymWorld();
  await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await page.getByRole("button", { name: "Started, left early" }).click();
  await pick(page, "Actual difficulty", 6);
  await page.getByRole("button", { name: "Note, or anything that made it easier" }).click();
  await page.getByLabel("Note").fill("Busy by the weights");
  await page.waitForTimeout(200);
  await page.reload();
  await expect(page.getByRole("button", { name: "Started, left early" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page
      .getByRole("radiogroup", { name: "Actual difficulty" })
      .getByRole("radio", { name: "6 of 8" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("Note")).toHaveValue("Busy by the weights");

  // ✕ throws the draft away.
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(`/practices/${w.p.id}/tasks/${w.gym.id}`);
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await expect(page.getByRole("button", { name: "Did it" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Change something edits the same rep, never a second one", async ({ page }) => {
  const w = gymWorld();
  const db = await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await pick(page, "Actual difficulty", 6);
  await pick(page, "Remaining difficulty", 5);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect.poll(() => db.reps.length).toBe(3);
  await page.getByRole("button", { name: "Change something" }).click();
  await pick(page, "Remaining difficulty", 4);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect(page.getByText("now it's a 4.")).toBeVisible();
  await expect.poll(() => db.reps.at(-1)?.remaining).toBe(4);
  expect(db.reps).toHaveLength(3);
});

test("with the prediction check on: 'Did it happen?', your words back, and it clears for next time", async ({
  page,
}) => {
  const w = gymWorld({
    settings: { prediction_check: true },
    next_prediction: "Everyone will stare and I'll leave.",
  });
  const db = await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await expect(page.getByText("“Everyone will stare and I'll leave.”")).toBeVisible();
  await page
    .getByRole("group", { name: "Did it happen?" })
    .getByRole("button", { name: "No" })
    .click();
  await pick(page, "Actual difficulty", 7);
  await pick(page, "Remaining difficulty", 6);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect(page.locator(".db-celebration")).toContainText(
    "You thought: “Everyone will stare and I'll leave.” It didn't happen.",
  );
  await expect.poll(() => db.reps.at(-1)?.prediction_outcome).toBe("no");
  expect(db.reps.at(-1)).toMatchObject({
    prediction: "Everyone will stare and I'll leave.",
    prediction_likelihood: "very",
  });
  await expect.poll(() => db.tasks[0]!.next_prediction).toBeNull();
});

test("with the prediction check off, nothing about predictions shows", async ({ page }) => {
  const w = gymWorld({ next_prediction: "Written before the check was switched off" });
  await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps: w.reps });
  await page.goto(`/practices/${w.p.id}/tasks/${w.gym.id}/log`);
  await expect(page.getByText("Did it happen?")).toHaveCount(0);
  await expect(page.getByText(/Written before/)).toHaveCount(0);
});
