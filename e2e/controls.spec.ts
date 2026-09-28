import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/dev/states");
});

test("SegmentedControl presses one option at a time", async ({ page }) => {
  const group = page.getByRole("group", { name: "Order" });
  await expect(group.getByRole("button", { name: "Easiest first" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await group.getByRole("button", { name: "Hardest first" }).click();
  await expect(group.getByRole("button", { name: "Hardest first" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(group.getByRole("button", { name: "Easiest first" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("Stepper stays between 1 and 7", async ({ page }) => {
  const more = page.getByRole("button", { name: "More" });
  const fewer = page.getByRole("button", { name: "Fewer" });
  for (let i = 0; i < 5; i++) await more.click({ force: true });
  await expect(page.getByRole("group", { name: "Reps per week" })).toContainText("7");
  await expect(more).toBeDisabled();
  for (let i = 0; i < 8; i++) await fewer.click({ force: true });
  await expect(page.getByRole("group", { name: "Reps per week" })).toContainText("1");
  await expect(fewer).toBeDisabled();
});

test("Toggle is a switch that says On or Off", async ({ page }) => {
  const sw = page.getByRole("switch", { name: "Prediction check" });
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await expect(sw).toContainText("Off");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await expect(sw).toContainText("On");
});

test("RepChart and Tally read out in words", async ({ page }) => {
  await expect(
    page.getByRole("img", {
      name: "Thought 7. The first one was an 8, the latest a 5. Remaining has gone from 7 to 5.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "4 reps, 1 attempt" })).toBeVisible();
});

test("PredictionCheck, before and after", async ({ page }) => {
  await page.getByLabel("What do you think will happen?").fill("They'll stare");
  await page
    .getByRole("group", { name: "How likely does that feel?" })
    .getByRole("button", { name: "Very", exact: true })
    .click();
  await expect(
    page
      .getByRole("group", { name: "How likely does that feel?" })
      .getByRole("button", { name: "Very", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("group", { name: "Did it happen?" })
    .getByRole("button", { name: "No" })
    .click();
  await expect(
    page.getByRole("group", { name: "Did it happen?" }).getByRole("button", { name: "No" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("RatingScale selects on tap; FlagToggle turns to 'Flagged for session'", async ({ page }) => {
  const scale = page.getByRole("radiogroup").first();
  await scale.getByRole("radio", { name: "3 of 8" }).click();
  await expect(scale.getByRole("radio", { name: "3 of 8" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  const flag = page.getByRole("button", { name: "Bring to session" }).first();
  await flag.click();
  await expect(page.getByRole("button", { name: "Flagged for session" }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the chart's numbers never overlap, whichever way round the scores are", async ({ page }) => {
  const boxes = await page.locator(".db-chart-plot").evaluateAll((charts) =>
    charts.map((chart) =>
      [...chart.querySelectorAll(".db-chart-value")].map((t) => {
        const b = t.getBoundingClientRect();
        return { x: b.left, y: b.top, w: b.width, h: b.height, text: t.textContent };
      }),
    ),
  );
  expect(boxes.length).toBeGreaterThanOrEqual(2);
  for (const labels of boxes) {
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i]!;
        const b = labels[j]!;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.text} and ${b.text}`).toBe(false);
      }
    }
  }
});

test("every control on the page passes axe", async ({ page }) => {
  // Checked at rest: mid-fade, the celebration's text is briefly translucent.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(
    axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
});
