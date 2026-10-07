// 0c close-out: every hierarchy screen and state, axe clean at WCAG 2.2 AA,
// no sideways scroll at 390, and still usable at 200% text.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
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

const NOW = new Date("2026-09-28T17:00:00Z");
const d = (iso: string) => new Date(iso);

const p = practiceRow({ settings: { prediction_check: true } });
const gym = taskRow(p.id, "Go to the gym at 6pm", 7, {
  repeating: true,
  reps_per_week: 4,
  target_date: "2026-10-31",
  next_prediction: "Everyone by the weights will stare and I'll have to leave.",
  next_prediction_likelihood: "very",
});
const coffee = taskRow(p.id, "Walk to the shop", 5, { comments: "Sat in the window." });
const phone = taskRow(p.id, "Phone the dentist to book a check-up before the weekend", 8, {
  target_date: "2026-09-30",
});
const reps = [
  repRow(gym.id, d("2026-09-01T17:10:00Z"), 8, 7, {
    note: "Turned round at the door once, then went in.",
    flagged: true,
  }),
  repRow(gym.id, d("2026-09-07T17:20:00Z"), 7, 7, { left_early: true, coping: ["Earphones in"] }),
  repRow(gym.id, d("2026-09-22T17:40:00Z"), 5, 5),
  repRow(coffee.id, d("2026-09-05T10:00:00Z"), 6, 5),
  repRow(coffee.id, d("2026-09-26T09:30:00Z"), 4, 3),
];
const session = sessionRow(d("2026-09-28T15:00:00Z"));

async function check(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(
    axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.addStyleTag({ content: "html { zoom: 2 }" });
  expect(await overflow()).toBeLessThanOrEqual(0);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.emulateMedia({ reducedMotion: "reduce" }); // checked at rest, not mid-fade
  await signIn(page);
  await fakeSessions(page, [session]);
});

const SCREENS: Array<[string, string, string | RegExp]> = [
  ["practices", "/practices", "Practices"],
  ["ladder", `/practices/${p.id}`, "Activity hierarchy"],
  ["add task", `/practices/${p.id}/tasks/new`, "Add a task"],
  ["edit task", `/practices/${p.id}/tasks/${gym.id}/edit`, "Edit task"],
  [
    "task in progress (prediction on)",
    `/practices/${p.id}/tasks/${gym.id}`,
    "Go to the gym at 6pm",
  ],
  ["task done", `/practices/${p.id}/tasks/${coffee.id}`, "Walk to the shop"],
  ["task not tried", `/practices/${p.id}/tasks/${phone.id}`, /Phone the dentist/],
  ["log a rep", `/practices/${p.id}/tasks/${gym.id}/log`, "Go to the gym at 6pm"],
  ["session edit with practice chips", `/sessions/${session.id}/edit`, "Edit session"],
  ["session detail with Link a practice", `/sessions/${session.id}`, /Monday 28 September/],
];

for (const [name, path, heading] of SCREENS) {
  test(`${name}`, async ({ page }) => {
    await fakeTables(page, { practices: [p], tasks: [gym, coffee, phone], reps });
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await check(page);
  });
}

test("empty practices and empty ladder", async ({ page }) => {
  const empty = practiceRow();
  await fakeTables(page, { practices: [], tasks: [], reps: [] });
  await page.goto("/practices");
  await expect(page.getByText("No practices yet")).toBeVisible();
  await check(page);
  await page.unroute(/rest\/v1\/practices/);
  await fakeTables(page, { practices: [empty], tasks: [], reps: [] });
  await page.goto(`/practices/${empty.id}`);
  await expect(page.getByText("No tasks yet. Add the first rung.")).toBeVisible();
  await check(page);
});

test("add-a-practice sheet", async ({ page }) => {
  await fakeTables(page, { practices: [], tasks: [], reps: [] });
  await page.goto("/practices");
  await page.getByRole("button", { name: "Add the first practice" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await check(page);
});

test("high-rung note on Add a task", async ({ page }) => {
  await fakeTables(page, { practices: [p], tasks: [gym], reps: [] });
  await page.goto(`/practices/${p.id}/tasks/new`);
  await page.getByRole("radio", { name: "8 of 8" }).click();
  await expect(page.getByText(/This one's high up/)).toBeVisible();
  await check(page);
});

test("log a rep: fields open, then logged with the celebration and saved on the phone", async ({
  page,
  context,
}) => {
  await fakeTables(page, { practices: [p], tasks: [gym], reps });
  await page.goto(`/practices/${p.id}/tasks/${gym.id}/log`);
  await page.getByRole("button", { name: "Note, or anything that made it easier" }).click();
  await check(page);
  await page.reload();
  await page
    .getByRole("radiogroup", { name: "Actual difficulty" })
    .getByRole("radio", { name: "5 of 8" })
    .click();
  await page
    .getByRole("radiogroup", { name: "Remaining difficulty" })
    .getByRole("radio", { name: "3 of 8" })
    .click();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Save rep" }).click();
  await expect(page.getByText("Saved on this phone, will sync")).toBeVisible();
  await check(page);
  await context.setOffline(false);
});

test("ladder just completed", async ({ page }) => {
  await fakeTables(page, { practices: [p], tasks: [gym, coffee], reps });
  await page.goto(`/practices/${p.id}`);
  await page.evaluate(
    (id) =>
      history.replaceState({ usr: { justCompleted: id }, key: "c", idx: 0 }, "", location.pathname),
    coffee.id,
  );
  await page.reload();
  await expect(page.getByText("That one's done.")).toBeVisible();
  await check(page);
});
