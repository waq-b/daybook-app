import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Date helpers are tested in the time zone the app is used in, clock changes included.
    env: { TZ: "Europe/London" },
    include: ["src/**/*.test.ts", "server/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
