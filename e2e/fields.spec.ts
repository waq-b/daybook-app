import { expect, test } from "./fixtures";

test("DateTimeField shows the picked date and time in words", async ({ page }) => {
  await page.goto("/dev/states");
  const date = page.getByLabel("Pick a date");
  const time = page.getByLabel("Pick a time");
  await expect(date).toHaveAttribute("type", "date");
  await expect(time).toHaveAttribute("type", "time");

  await date.fill("2026-09-29");
  await time.fill("16:00");
  await expect(page.getByLabel("Date, Tuesday 29 September. Change").first()).toBeAttached();
  await expect(page.getByText("Tuesday 29 September").first()).toBeVisible();
  await expect(page.getByText("4:00pm").first()).toBeVisible();

  // Each field's whole 56px box is the tap target.
  const box = await page.getByLabel("Date, Tuesday 29 September. Change").first().boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(56);
});

test("TextArea grows with its text and never zooms iOS", async ({ page }) => {
  await page.goto("/dev/states");
  const area = page.getByLabel("Session notes");
  const before = (await area.boundingBox())!.height;
  await area.fill(Array.from({ length: 12 }, (_, i) => `Line ${i + 1}`).join("\n"));
  const after = (await area.boundingBox())!.height;
  expect(after).toBeGreaterThan(before);
  expect(await area.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  expect(
    await area.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
});
