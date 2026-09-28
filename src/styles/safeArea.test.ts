// Every bar pinned to the bottom of the screen must clear the iPhone's home
// indicator (DESIGN.md §7 "Safe areas"): its own CSS mentions
// env(safe-area-inset-bottom), or the design-system component inside it does.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = new URL("..", import.meta.url).pathname;

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return path.endsWith(".css") ? [path] : [];
  });
}

/** `selector { body }` pairs, flat (the app's CSS has no nesting). */
function rules(css: string): Array<{ selector: string; body: string }> {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1]!.trim(),
    body: m[2]!,
  }));
}

/** position: fixed, anchored to the bottom and not the top (a bar, not a full-screen layer). */
function isBottomBar(body: string): boolean {
  if (!/position:\s*fixed/.test(body)) return false;
  const inset = /(?:^|;)\s*inset:\s*([^;]+)/.exec(body)?.[1]?.trim();
  if (inset) {
    const [top] = inset.split(/\s+(?![^(]*\))/);
    return top === "auto";
  }
  return /(?:^|;)\s*bottom:/.test(body) && !/(?:^|;)\s*top:/.test(body);
}

// Bars whose safe-area padding comes from the design-system component they wrap.
const PADDED_BY_DESIGN_SYSTEM: Record<string, RegExp> = {
  ".shell-nav": /\.db-nav\s*\{[^}]*safe-area-inset-bottom/,
};

const bundleCss = readFileSync(
  new URL("../../design/components/bundle.css", import.meta.url),
  "utf8",
);
const bars = cssFiles(SRC).flatMap((file) =>
  rules(readFileSync(file, "utf8"))
    .filter((r) => isBottomBar(r.body))
    .map((r) => ({ file: file.replace(SRC, "src/"), ...r })),
);

describe("safe areas", () => {
  it("finds the bottom bars (so this test can't silently pass on nothing)", () => {
    expect(bars.length).toBeGreaterThanOrEqual(6);
  });

  it.each(bars.map((b) => [`${b.file} ${b.selector}`, b] as const))(
    "%s clears the home indicator",
    (_, bar) => {
      const own = /safe-area-inset-bottom/.test(bar.body);
      const viaDesignSystem = PADDED_BY_DESIGN_SYSTEM[bar.selector]?.test(bundleCss) ?? false;
      expect(own || viaDesignSystem).toBe(true);
    },
  );
});
