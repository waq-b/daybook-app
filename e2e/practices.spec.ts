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

// Tuesday 29 September 2026, 10am in London.
const NOW = new Date("2026-09-29T09:00:00Z");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

test("empty: no therapist wording, and adding the hierarchy with the prediction check off", async ({
  page,
}) => {
  const db = await fakeTables(page, { practices: [], tasks: [], reps: [] });
  await page.goto("/practices");
  await expect(page.getByText("No practices yet")).toBeVisible();
  await expect(
    page.getByText(
      "Each worksheet becomes a practice, whether it came from a session or not. Add the first one.",
    ),
  ).toBeVisible();
  await expect(page.getByText(/therapist/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Add the first practice" }).click();
  const sheet = page.getByRole("dialog", { name: "Add a practice" });
  await expect(sheet.getByText("Which worksheet is it?")).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Feelings|Gratitude/ })).toHaveCount(0);
  await sheet.getByRole("button", { name: /Activity hierarchy/ }).click();

  await expect.poll(() => db.practices.length).toBe(1);
  expect(db.practices[0]).toMatchObject({
    type: "hierarchy",
    name: "Activity hierarchy",
    settings: { prediction_check: false },
  });
  expect(db.practices[0]!.session_id ?? null).toBeNull(); // never tied to a session
});

test("filled: the card's meta, last logged and this week's target", async ({ page }) => {
  const p = practiceRow();
  const gym = taskRow(p.id, "Gym", 7, { repeating: true, reps_per_week: 4 });
  const walk = taskRow(p.id, "Walk", 3);
  await fakeTables(page, {
    practices: [p],
    tasks: [gym, walk],
    reps: [
      repRow(walk.id, new Date("2026-09-10T17:00:00Z"), 2, 1),
      repRow(gym.id, new Date("2026-09-28T17:00:00Z"), 6, 5), // Monday this week
      repRow(gym.id, new Date("2026-09-24T17:00:00Z"), 7, 6), // last week
    ],
  });
  await page.goto("/practices");
  await expect(page.getByText("1 active")).toBeVisible();
  const card = page.getByRole("button", { name: /Activity hierarchy/ });
  await expect(card).toContainText("1 task on the go, 1 done");
  await expect(card).toContainText("Last logged yesterday");
  await expect(card).toContainText("1 of 4");
});

test("with the hierarchy already there, the option opens it instead of adding another", async ({
  page,
}) => {
  const p = practiceRow();
  const db = await fakeTables(page, { practices: [p], tasks: [], reps: [] });
  await page.goto("/practices");
  await page.getByRole("button", { name: "Add a practice" }).click();
  await expect(page.getByText("Already on your list. Tap to open it.")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Activity hierarchy/ })
    .click();
  expect(db.practices).toHaveLength(1);
});

test("offline: opens from the phone's copy; adding says it needs a connection", async ({
  page,
  context,
}, info) => {
  needsServiceWorker(info);
  const p = practiceRow();
  await fakeTables(page, { practices: [p], tasks: [taskRow(p.id, "Gym", 7)], reps: [] });
  await page.goto("/practices");
  await expect(page.getByText("1 task on the go, 0 done")).toBeVisible(); // copy saved on the phone
  // The service worker must be in control for the app itself to open offline.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByText("1 task on the go, 0 done")).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("1 task on the go, 0 done")).toBeVisible();
  await context.setOffline(false);
});

test("first open with no signal and nothing on the phone says so", async ({ page, context }) => {
  await fakeTables(page, { practices: [], tasks: [], reps: [] });
  await page.goto("/");
  await context.setOffline(true);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Practices" })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Practices need a connection the first time. After that they open on this phone.",
  );
  await context.setOffline(false);
});

test("adding offline says it needs a connection", async ({ page, context }) => {
  const db = await fakeTables(page, { practices: [], tasks: [], reps: [] });
  await page.goto("/practices");
  await page.getByRole("button", { name: "Add the first practice" }).click();
  await context.setOffline(true);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Activity hierarchy/ })
    .click();
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText(
    "Adding a practice needs a connection. Try again when you're back online.",
  );
  expect(db.practices).toHaveLength(0);
  await context.setOffline(false);
});
