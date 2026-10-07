import {
  expect,
  fakeTables,
  needsServiceWorker,
  practiceRow,
  repRow,
  signIn,
  taskRow,
  test,
} from "./fixtures";

// Monday 28 September 2026, 10am in London.
const NOW = new Date("2026-09-28T09:00:00Z");
const at = (iso: string) => new Date(iso);

function world() {
  const p = practiceRow();
  const gig = taskRow(p.id, "Go to a concert", 8);
  const phone = taskRow(p.id, "Phone the dentist", 7, { target_date: "2026-09-30" });
  const gym = taskRow(p.id, "Go to the gym at 6pm", 7, { repeating: true, reps_per_week: 4 });
  const coffee = taskRow(p.id, "Walk to the shop", 5, {
    repeating: true,
    reps_per_week: 2,
  });
  const bus = taskRow(p.id, "Get the bus into town", 5);
  const reps = [
    repRow(gym.id, at("2026-09-22T17:00:00Z"), 7, 6),
    repRow(gym.id, at("2026-09-28T07:00:00Z"), 6, 5), // this morning
    repRow(gym.id, at("2026-09-24T17:00:00Z"), 7, 7, { left_early: true }),
    repRow(coffee.id, at("2026-09-26T10:00:00Z"), 5, 4),
    repRow(bus.id, at("2026-09-12T10:00:00Z"), 3, 2),
  ];
  return { p, gig, phone, gym, coffee, bus, reps };
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("empty ladder: the canvas's empty state, Add the first task, prediction check off", async ({
  page,
}) => {
  const p = practiceRow();
  await fakeTables(page, { practices: [p], tasks: [], reps: [] });
  await page.goto(`/practices/${p.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Activity hierarchy");
  await expect(page.getByText("No tasks yet. Add the first rung.")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Prediction check" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(page.getByRole("button", { name: "Add the first task" })).toBeVisible();
  // Where it goes is tested with the Add a task screen (0c.6).
});

test("easiest first with UP NEXT; hardest first reverses and is remembered", async ({ page }) => {
  const w = world();
  await fakeTables(page, {
    practices: [w.p],
    tasks: [w.gig, w.phone, w.gym, w.coffee, w.bus],
    reps: w.reps,
  });
  await page.goto(`/practices/${w.p.id}`);

  const active = page.locator("ol.ladder-rungs:not(.is-done) > li");
  await expect(active).toHaveCount(4);
  await expect(active.nth(0)).toContainText("Up next");
  await expect(active.nth(0)).toContainText("Walk to the shop");
  await expect(active.nth(0)).toContainText("0 of 2 this week");
  await expect(active.nth(1)).toContainText("Phone the dentist");
  await expect(active.nth(1)).toContainText("One-off · by Wed");
  await expect(active.nth(2)).toContainText("Go to the gym at 6pm");
  await expect(active.nth(2)).toContainText("1 of 4 this week");
  await expect(active.nth(3)).toContainText("Go to a concert");

  await page.getByRole("button", { name: "Hardest first" }).click();
  await expect(active.nth(0)).toContainText("Go to a concert");
  await expect(page.getByText("Up next")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Hardest first" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("done rungs sit under the 4 line with their date", async ({ page }) => {
  const w = world();
  await fakeTables(page, { practices: [w.p], tasks: [w.gym, w.bus], reps: w.reps });
  await page.goto(`/practices/${w.p.id}`);
  await expect(page.getByRole("separator", { name: "Under 4 is done" })).toBeVisible();
  const done = page.getByRole("region", { name: "Done" });
  await expect(done).toContainText("Get the bus into town");
  await expect(done).toContainText("Done 12 Sep");
});

test("a later left-early attempt at 3 neither shows nor finishes the rung (D2)", async ({
  page,
}) => {
  const w = world();
  const reps = [
    repRow(w.gym.id, at("2026-09-28T07:00:00Z"), 6, 5),
    repRow(w.gym.id, at("2026-09-28T08:00:00Z"), 4, 3, { left_early: true }),
  ];
  await fakeTables(page, { practices: [w.p], tasks: [w.gym], reps });
  await page.goto(`/practices/${w.p.id}`);
  await expect(page.getByLabel("Remaining difficulty 5")).toBeVisible();
  await expect(page.getByRole("separator", { name: "Under 4 is done" })).toHaveCount(0);
  await expect(page.getByLabel("1 rep, 1 attempt")).toBeVisible();
});

test("the prediction check switch saves to the practice", async ({ page }) => {
  const w = world();
  const db = await fakeTables(page, { practices: [w.p], tasks: [], reps: [] });
  await page.goto(`/practices/${w.p.id}`);
  await page.getByRole("switch", { name: "Prediction check" }).click();
  await expect
    .poll(() => (db.practices[0]!.settings as { prediction_check: boolean }).prediction_check)
    .toBe(true);
  await expect(page.getByRole("switch", { name: "Prediction check" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("just completed: the celebration and the ringed rung show once", async ({ page }) => {
  const w = world();
  await fakeTables(page, { practices: [w.p], tasks: [w.bus], reps: w.reps });
  await page.goto(`/practices/${w.p.id}`);
  await page.evaluate((id) => {
    history.replaceState(
      { usr: { justCompleted: id }, key: "done", idx: 0 },
      "",
      location.pathname,
    );
  }, w.bus.id);
  await page.reload();
  await expect(page.getByRole("status")).toContainText("That one's done.");
  await expect(page.getByRole("status")).toContainText(
    "Get the bus into town. Remaining 2, under the 4 line.",
  );
  await expect(page.getByRole("status")).toContainText("5 → 2");
  await expect(page.locator(".ladder-rung.is-just-done")).toHaveCount(1);

  await page.reload();
  await expect(page.getByText("That one's done.")).toHaveCount(0);
});

test("opens offline from the phone's copy", async ({ page, context }, info) => {
  needsServiceWorker(info);
  const w = world();
  await fakeTables(page, { practices: [w.p], tasks: [w.gym, w.coffee], reps: w.reps });
  await page.goto(`/practices/${w.p.id}`);
  await expect(page.getByText("Walk to the shop")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Walk to the shop")).toBeVisible();
  await expect(page.getByText("Go to the gym at 6pm")).toBeVisible();
  await context.setOffline(false);
});
