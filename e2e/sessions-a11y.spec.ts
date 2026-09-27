// 0b close-out: every Sessions screen at 390px and at 200% text, and axe
// (the accessibility engine Lighthouse uses) on each signed-in state.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, fakeSessions, sessionRow, signIn, test } from "./fixtures";

// Tuesday 29 September 2026, 10am in London.
const NOW = new Date("2026-09-29T09:00:00Z");

const today = sessionRow(new Date("2026-09-29T15:00:00Z"), {
  notes: "Gym is working, keep it at 4 a week.\nPhone the landlord before next time.",
  assigned_note: "Notice when I check my phone to avoid talking",
});
const upcoming = sessionRow(new Date("2026-10-06T15:00:00Z"));
const done = sessionRow(new Date("2026-09-15T15:00:00Z"), {
  notes:
    "Bus is done. Keep coffee going twice a week, and a long first line that has to be cut short.",
  done_at: "2026-09-15T16:00:00Z",
});

const SCREENS: Array<[string, string, string]> = [
  ["list", "/sessions", "Sessions"],
  ["today's detail", `/sessions/${today.id}`, "Tuesday 29 September"],
  ["upcoming detail", `/sessions/${upcoming.id}`, "Tuesday 6 October"],
  ["done detail", `/sessions/${done.id}`, "Tuesday 15 September"],
  ["new", "/sessions/new", "New session"],
  ["edit", `/sessions/${today.id}/edit`, "Edit session"],
];

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await signIn(page);
});

for (const [name, path, heading] of SCREENS) {
  test(`${name}: axe clean, fits at 390, survives 200% text`, async ({ page }) => {
    await fakeSessions(page, [today, upcoming, done]);
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

    await noSidewaysScroll(page);
    await page.addStyleTag({ content: "html { zoom: 2 }" });
    await noSidewaysScroll(page);
    // The screen's action is still reachable.
    const action = page.getByRole("button", {
      name: /Add a session|Mark session as done|Save session/,
    });
    if ((await action.count()) > 0) {
      await action.first().scrollIntoViewIfNeeded();
      await expect(action.first()).toBeInViewport();
    }
  });
}

test("empty list: axe clean and fits at 200%", async ({ page }) => {
  await fakeSessions(page);
  await page.goto("/sessions");
  await expect(page.getByText("No sessions yet")).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await page.addStyleTag({ content: "html { zoom: 2 }" });
  await noSidewaysScroll(page);
});
