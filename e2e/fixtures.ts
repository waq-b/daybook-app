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

/** Tests that start signed in (a stored session, every Supabase call answered). */
export const signedInTest = base.extend<{ signedIn: void }>({
  signedIn: [
    async ({ page }, use) => {
      await mockSupabase(page);
      await page.addInitScript(
        ([key, session]) => {
          localStorage.setItem(key as string, JSON.stringify(session));
        },
        [STORAGE_KEY, testSession()] as const,
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
