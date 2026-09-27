import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "./app";

const webRoot = mkdtempSync(join(tmpdir(), "daybook-web-"));
writeFileSync(join(webRoot, "index.html"), "<div id=root></div>");
writeFileSync(join(webRoot, "app.js"), "console.log(1)");

const app = buildApp({ webRoot, version: "abc1234" });
afterAll(() => app.close());

describe("server", () => {
  it("reports health with the version", async () => {
    const res = await app.inject({ url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, version: "abc1234" });
  });

  it("serves built files", async () => {
    const res = await app.inject({ url: "/app.js" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("console.log(1)");
  });

  it("falls back to index.html for app routes", async () => {
    const res = await app.inject({ url: "/settings" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("id=root");
  });

  it("404s unknown API routes instead of returning the app", async () => {
    const res = await app.inject({ url: "/api/nope" });
    expect(res.statusCode).toBe(404);
  });
});
