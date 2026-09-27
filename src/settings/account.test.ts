import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: {} }));
const { confirmsDelete, exportFileName } = await import("./account");

describe("confirmsDelete", () => {
  it.each(["DELETE", "delete", " Delete "])("accepts %j", (typed) => {
    expect(confirmsDelete(typed, "delete")).toBe(true);
  });
  it.each(["", "DELET", "delete everything", "yes"])("refuses %j", (typed) => {
    expect(confirmsDelete(typed, "delete")).toBe(false);
  });
});

describe("exportFileName", () => {
  it("dates the file", () => {
    expect(exportFileName(new Date(2026, 8, 7))).toBe("daybook-export-2026-09-07.json");
  });
});
