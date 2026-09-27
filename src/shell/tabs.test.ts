import { describe, expect, it } from "vitest";
import { tabForPath } from "./tabs";

describe("tabForPath", () => {
  it.each([
    ["/", "today"],
    ["/practices", "practices"],
    ["/sessions", "sessions"],
    ["/sessions/abc", "sessions"],
    ["/history", "history"],
    ["/settings", "settings"],
    ["/settingsx", "today"],
  ])("%s → %s", (path, tab) => {
    expect(tabForPath(path)).toBe(tab);
  });
});
