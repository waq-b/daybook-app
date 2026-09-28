// The real Supabase, as a signed-out stranger would reach it with the public
// key that ships in the app. Every table and function must refuse them, and
// nobody new can get a sign-in code (sign-up is closed).
import { expect, test } from "@playwright/test";

const URL = process.env.SUPABASE_URL ?? "https://your-project-ref.supabase.co";
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

const TABLES = [
  "sessions",
  "practices",
  "tasks",
  "reps",
  "misses",
  "checkins",
  "seeds",
  "gratitude_entries",
  "reminders",
  "push_subscriptions",
];

test.beforeAll(() => {
  test.skip(!KEY, "SUPABASE_PUBLISHABLE_KEY isn't set");
});

// The database checks only need running once, not per phone.
// eslint-disable-next-line no-empty-pattern -- Playwright's idiom for "no fixtures, just testInfo"
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "phone", "Runs once, on the first project.");
});

const headers = () => ({ apikey: KEY, "Content-Type": "application/json" });

test("signed out, every table refuses reads and writes", async ({ request }) => {
  for (const table of TABLES) {
    const read = await request.get(`${URL}/rest/v1/${table}?select=id&limit=1`, {
      headers: headers(),
    });
    expect([401, 403], `read ${table}`).toContain(read.status());
    const write = await request.post(`${URL}/rest/v1/${table}`, { headers: headers(), data: {} });
    expect([401, 403], `write ${table}`).toContain(write.status());
  }
});

test("signed out, export and delete everything refuse", async ({ request }) => {
  for (const fn of ["export_everything", "delete_everything"]) {
    const res = await request.post(`${URL}/rest/v1/rpc/${fn}`, {
      headers: headers(),
      data: fn === "delete_everything" ? { confirm: "delete" } : {},
    });
    expect(res.ok(), fn).toBe(false);
    expect([401, 403, 404], fn).toContain(res.status());
  }
});

test("sign-up is closed: a new email can't get a code", async ({ request }) => {
  const res = await request.post(`${URL}/auth/v1/otp`, {
    headers: headers(),
    data: { email: `signup-check-${Date.now()}@example.com`, create_user: true },
  });
  expect(res.ok()).toBe(false);
  const body = await res.json();
  expect(JSON.stringify(body)).toMatch(/signup|not allowed/i);
});
