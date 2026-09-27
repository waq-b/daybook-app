import { defineConfig } from "vitest/config";

// Database tests: need TEST_DATABASE_URL (CI runs a postgres:17 service).
export default defineConfig({
  test: {
    include: ["supabase/tests/**/*.test.ts"],
    testTimeout: 20_000,
  },
});
