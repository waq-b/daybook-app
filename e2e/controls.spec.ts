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

test("every control on the page passes axe", async ({ page }) => {
  // Checked at rest: mid-fade, the celebration's text is briefly translucent.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(
    axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
});
