import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { copy } from "./copy";
import { allStrings, voiceProblems } from "./voice";

describe("voice rules", () => {
  it.each(allStrings(copy))("copy.%s passes", (_path, text) => {
    expect(voiceProblems(text)).toEqual([]);
  });

  it("index.html passes", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const text = html.replace(/<[^>]*>/g, " ").replace("<!doctype html>", "");
    expect(voiceProblems(text)).toEqual([]);
  });
});

describe("voiceProblems", () => {
  it("catches each rule", () => {
    expect(voiceProblems("Great job!")).toEqual(["exclamation mark"]);
    expect(voiceProblems("Logged 🎉")).toEqual(["emoji"]);
    expect(voiceProblems("Your Journey continues")).toEqual(['banned word "journey"']);
    expect(voiceProblems("Three streaks")).toEqual(['banned word "streak"']);
    expect(voiceProblems("Some self-care")).toEqual(['banned word "self-care"']);
  });

  it("leaves plain copy alone", () => {
    expect(voiceProblems("Logged. Thought 7, it was 5, now it's a 2.")).toEqual([]);
    expect(voiceProblems("Saved on this phone, will sync.")).toEqual([]);
  });
});
