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
  await page.route(`${SUPABASE_URL}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
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
