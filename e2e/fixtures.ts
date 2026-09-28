// E2E runs against a build made with VITE_SUPABASE_URL=http://localhost:54321
// (see playwright.config.ts). Nothing real is ever called: every Supabase
// request is answered here, and "signed in" is a stored session.
import { test as base, type Page } from "@playwright/test";

export const SUPABASE_URL = "http://localhost:54321";
const STORAGE_KEY = "sb-localhost-auth-token";

export const TEST_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "test@example.com",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: "2026-09-27T00:00:00Z",
};

export function testSession() {
  return {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 4102444800, // 2100: never refreshes during a test
    user: TEST_USER,
  };
}

/** Answers every Supabase request; tests override specific routes first. */
export async function mockSupabase(page: Page) {
  await page.route(`${SUPABASE_URL}/**`, (route) => {
    // Table reads get an empty list, everything else an empty object.
    const read = route.request().method() === "GET" && route.request().url().includes("/rest/v1/");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: read ? "[]" : "{}",
    });
  });
}

export const test = base;

/** Signs the page in: a stored session, every Supabase call answered. */
export async function signIn(page: Page, { installPromptSeen = true } = {}) {
  await mockSupabase(page);
  if (installPromptSeen) {
    await page.addInitScript(() => localStorage.setItem("daybook.install-prompt.dismissed", "1"));
  }
  await page.addInitScript(
    ([key, session]) => localStorage.setItem(key as string, JSON.stringify(session)),
    [STORAGE_KEY, testSession()] as const,
  );
}

/** Tests that start signed in, past the install prompt. */
export const signedInTest = base.extend<{ signedIn: void }>({
  signedIn: [
    async ({ page }, use) => {
      await signIn(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";

export interface FakeSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  at: string;
  notes: string | null;
  anything_else: string | null;
  assigned_note: string | null;
  done_at: string | null;
}

/** A session row as the database would hold it, for seeding the fake. */
export function sessionRow(at: Date, extra: Partial<FakeSession> = {}): FakeSession {
  const stamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: TEST_USER.id,
    created_at: stamp,
    updated_at: stamp,
    archived_at: null,
    at: at.toISOString(),
    notes: null,
    anything_else: null,
    assigned_note: null,
    done_at: null,
    ...extra,
  };
}

/**
 * Just enough of PostgREST's /rest/v1/sessions for the Sessions screens:
 * select (all, or id=eq.), insert, update by id. Returns the live array so a
 * test can see what was written. Register after signIn() so it wins.
 */
export async function fakeSessions(page: Page, rows: FakeSession[] = []) {
  const store = [...rows];
  await page.route(`${SUPABASE_URL}/rest/v1/sessions*`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const one = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    const reply = (status: number, list: FakeSession[]) => {
      if (one && list.length !== 1) {
        return route.fulfill({
          status: 406,
          contentType: "application/json",
          body: JSON.stringify({ code: "PGRST116", message: "0 rows" }),
        });
      }
      return route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(one ? list[0] : list),
      });
    };

    if (req.method() === "GET") {
      let list = store.filter((r) => !r.archived_at);
      if (id) list = list.filter((r) => r.id === id);
      list.sort((a, b) => b.at.localeCompare(a.at));
      return reply(200, list);
    }
    if (req.method() === "POST") {
      const body = req.postDataJSON();
      const row = sessionRow(new Date(), Array.isArray(body) ? body[0] : body);
      store.push(row);
      return reply(201, [row]);
    }
    if (req.method() === "PATCH") {
      const row = store.find((r) => r.id === id);
      if (row) Object.assign(row, req.postDataJSON(), { updated_at: new Date().toISOString() });
      return reply(200, row ? [row] : []);
    }
    return route.fulfill({ status: 405, body: "" });
  });
  return store;
}

export type Row = { id: string; archived_at?: string | null; [key: string]: unknown };

/**
 * A generic stand-in for PostgREST tables (practices, tasks, reps …):
 * GET with id=eq. / archived_at=is.null / order, POST (plain insert, or an
 * upsert that ignores rows already there, as the outbox sends), PATCH by id.
 * Returns the live arrays so tests can see exactly what reached "the server".
 */
export async function fakeTables<K extends string>(
  page: Page,
  tables: Record<K, Row[]>,
): Promise<Record<K, Row[]>> {
  const store = Object.fromEntries(
    Object.entries<Row[]>(tables).map(([k, rows]) => [k, [...rows]]),
  ) as Record<K, Row[]>;
  for (const name of Object.keys(store) as K[]) {
    await page.route(new RegExp(`${SUPABASE_URL}/rest/v1/${name}(\\?.*)?$`), async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const rows = store[name]!;
      const one = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
      const id = url.searchParams.get("id")?.replace(/^eq\./, "");
      const reply = (status: number, list: Row[]) =>
        one && list.length !== 1
          ? route.fulfill({
              status: 406,
              contentType: "application/json",
              body: JSON.stringify({ code: "PGRST116" }),
            })
          : route.fulfill({
              status,
              contentType: "application/json",
              body: JSON.stringify(one ? list[0] : list),
            });

      if (req.method() === "GET") {
        let list = rows.filter((r) => !r.archived_at);
        if (id) list = list.filter((r) => r.id === id);
        const order = url.searchParams.get("order");
        if (order) {
          const [col, dir] = order.split(".");
          list = [...list].sort(
            (a, b) => String(a[col!]).localeCompare(String(b[col!])) * (dir === "desc" ? -1 : 1),
          );
        }
        return reply(200, list);
      }
      if (req.method() === "POST") {
        const body = req.postDataJSON();
        const incoming: Row[] = Array.isArray(body) ? body : [body];
        const ignore = (req.headers()["prefer"] ?? "").includes("ignore-duplicates");
        const stamp = new Date().toISOString();
        const added: Row[] = [];
        for (const r of incoming) {
          const rowId = (r.id as string) ?? crypto.randomUUID();
          const existing = rows.find((x) => x.id === rowId);
          if (existing) {
            if (ignore) continue;
            return route.fulfill({
              status: 409,
              contentType: "application/json",
              body: JSON.stringify({ code: "23505" }),
            });
          }
          const row = {
            user_id: TEST_USER.id,
            created_at: stamp,
            updated_at: stamp,
            archived_at: null,
            ...r,
            id: rowId,
          };
          rows.push(row);
          added.push(row);
        }
        return reply(201, added);
      }
      if (req.method() === "PATCH") {
        const row = rows.find((r) => r.id === id);
        if (row) Object.assign(row, req.postDataJSON(), { updated_at: new Date().toISOString() });
        return reply(200, row ? [row] : []);
      }
      return route.fulfill({ status: 405, body: "" });
    });
  }
  return store;
}

const stamp = (d: Date) => d.toISOString();

export function practiceRow(extra: Record<string, unknown> = {}) {
  const now = stamp(new Date("2026-09-01T09:00:00Z"));
  return {
    id: crypto.randomUUID(),
    user_id: TEST_USER.id,
    created_at: now,
    updated_at: now,
    archived_at: null as string | null,
    type: "hierarchy",
    name: "Activity hierarchy",
    session_id: null as string | null,
    settings: { prediction_check: false } as Record<string, unknown>,
    ...extra,
  };
}

export function taskRow(
  practiceId: string,
  name: string,
  predicted: number,
  extra: Record<string, unknown> = {},
) {
  const now = stamp(new Date("2026-09-01T09:00:00Z"));
  return {
    id: crypto.randomUUID(),
    user_id: TEST_USER.id,
    created_at: now,
    updated_at: now,
    archived_at: null as string | null,
    practice_id: practiceId,
    name,
    predicted,
    repeating: false,
    reps_per_week: null as number | null,
    target_date: null as string | null,
    notes: null as string | null,
    completed_at: null,
    comments: null as string | null,
    next_prediction: null as string | null,
    next_prediction_likelihood: null as string | null,
    ...extra,
  };
}

export function repRow(
  taskId: string,
  at: Date,
  actual: number,
  remaining: number,
  extra: Record<string, unknown> = {},
) {
  return {
    id: crypto.randomUUID(),
    user_id: TEST_USER.id,
    created_at: stamp(at),
    updated_at: stamp(at),
    archived_at: null as string | null,
    task_id: taskId,
    at: stamp(at),
    actual,
    remaining,
    left_early: false,
    coping: [] as string[],
    note: null as string | null,
    prediction: null as string | null,
    prediction_likelihood: null as string | null,
    prediction_outcome: null as string | null,
    flagged: false,
    ...extra,
  };
}

/** True on the iPhone (WebKit) project, where the service worker is off (see playwright.config.ts). */
export function onIphone(info: { project: { name: string } }): boolean {
  return info.project.name === "iphone";
}

/** Skips a test that needs the service worker in control; Chromium covers it. */
export function needsServiceWorker(info: { project: { name: string } }) {
  test.skip(
    onIphone(info),
    "Needs the service worker; Playwright can't intercept a WebKit page it controls. Covered on Chromium.",
  );
}

/** Skips an Android/Chrome-only test on the iPhone. */
export function androidOnly(info: { project: { name: string } }) {
  test.skip(onIphone(info), "Android/Chrome behaviour; not on an iPhone.");
}
