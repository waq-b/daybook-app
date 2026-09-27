import { expect, signedInTest as test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Settings");
});

test("shows the signed-in email, the install row and the version", async ({ page }) => {
  await expect(page.getByText("test@example.com")).toBeVisible();
  await expect(page.getByRole("link", { name: /Add to home screen/ })).toHaveAttribute(
    "href",
    "/install",
  );
  await expect(page.getByText(/^Version /)).toBeVisible();
  await expect(
    page.getByText("Daybook is a logbook, not a coach and not emergency support."),
  ).toBeVisible();
});

test("Export my data downloads everything as JSON", async ({ page }) => {
  await page.route("**/rest/v1/rpc/export_everything", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ app: "Daybook", schema_version: 1, sessions: [], reps: [] }),
    }),
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export my data/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^daybook-export-\d{4}-\d{2}-\d{2}\.json$/);
  const body = JSON.parse(
    await new Response((await file.createReadStream()) as unknown as ReadableStream).text(),
  );
  expect(body).toMatchObject({ app: "Daybook", sessions: [] });
  await expect(page.getByRole("status")).toHaveText("Exported. Check your downloads or Files.");
});

test("Delete everything takes two real steps and can be backed out of at each", async ({
  page,
}) => {
  let deleteCalls: unknown[] = [];
  await page.route("**/rest/v1/rpc/delete_everything", async (route) => {
    deleteCalls.push(route.request().postDataJSON());
    await route.fulfill({ status: 204, body: "" });
  });

  // Step 1, then back out.
  await page.getByRole("button", { name: /Delete everything/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading")).toHaveText("Delete everything?");
  await expect(sheet.getByText("Step 1 of 2")).toBeVisible();
  await sheet.getByRole("button", { name: "Keep everything" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Step 2, then back out.
  await page.getByRole("button", { name: /Delete everything/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText("Last check");
  const confirm = page.getByRole("dialog").getByRole("button", { name: "Delete everything" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("Type DELETE to confirm.").fill("DELET");
  await expect(confirm).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(deleteCalls).toEqual([]);

  // All the way.
  await page.getByRole("button", { name: /Delete everything/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Type DELETE to confirm.").fill("DELETE");
  await page.getByRole("dialog").getByRole("button", { name: "Delete everything" }).click();
  await expect(page).toHaveURL("/sign-in");
  expect(deleteCalls).toEqual([{ confirm: "delete" }]);
  deleteCalls = [];
});

test("offline, delete says nothing was deleted", async ({ page, context }) => {
  await page.getByRole("button", { name: /Delete everything/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Type DELETE to confirm.").fill("delete");
  await context.setOffline(true);
  await page.getByRole("dialog").getByRole("button", { name: "Delete everything" }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText(
    "Deleting needs a connection. Nothing has been deleted.",
  );
  await context.setOffline(false);
});

test("Sign out goes to sign in", async ({ page }) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/sign-in");
});
