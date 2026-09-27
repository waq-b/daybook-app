import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { undefinedTokens } from "./tokens";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("design tokens (DESIGN.md §1)", () => {
  it("every var() in bundle.css is defined by tokens.css, set inline by bundle.js, or has a fallback", () => {
    expect(
      undefinedTokens(
        read("design/tokens.css"),
        read("design/components/bundle.css"),
        read("design/components/bundle.js"),
      ),
    ).toEqual([]);
  });

  it("catches a token nothing defines", () => {
    expect(undefinedTokens(":root { --paper: #fff; }", ".a { color: var(--nope); }", "")).toEqual([
      "--nope",
    ]);
  });

  it("accepts inline-set and fallback variables", () => {
    const css = ".a { background: var(--c); border-color: var(--c-edge, var(--paper)); }";
    expect(
      undefinedTokens(":root { --paper: #fff; }", css, 'h("i", { style: { "--c": x } })'),
    ).toEqual([]);
  });
});
