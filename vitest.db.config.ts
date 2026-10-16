import { defineConfig } from "vitest/config";

// Database tests: need TEST_DATABASE_URL (CI runs a postgres:17 service).
export default defineConfig({
  test: {
    include: ["supabase/tests/**/*.test.ts"],
    testTimeout: 20_000,
    // Every file creates the same server-wide roles; running files one at a
    // time keeps that setup from racing. Each file still gets its own database.
    fileParallelism: false,
  },
});
