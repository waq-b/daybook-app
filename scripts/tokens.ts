// DESIGN.md §1: every var(--x) that bundle.css reads must be defined. Amended
// (plan D13): "defined" also covers variables bundle.js sets inline on an
// element ("--c", "--on") and variables always read with a fallback
// (var(--c-edge, var(--line-strong))).

/** Custom properties declared in a stylesheet, e.g. `--paper: #fbf6ec;`. */
export function declaredProperties(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]!));
}

/** Custom properties a script sets inline, e.g. `{ "--c": colour }`. */
export function inlineProperties(js: string): Set<string> {
  return new Set([...js.matchAll(/["'](--[a-z0-9-]+)["']\s*:/gi)].map((m) => m[1]!));
}

/** Every var() read in a stylesheet, and whether that read has a fallback. */
export function propertyReads(css: string): Array<{ name: string; fallback: boolean }> {
  return [...css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,)?/gi)].map((m) => ({
    name: m[1]!,
    fallback: m[2] === ",",
  }));
}

/** Names bundle.css reads that nothing defines. Empty means the check passes. */
export function undefinedTokens(tokensCss: string, bundleCss: string, bundleJs: string): string[] {
  const defined = new Set([
    ...declaredProperties(tokensCss),
    ...declaredProperties(bundleCss),
    ...inlineProperties(bundleJs),
  ]);
  const missing = propertyReads(bundleCss)
    .filter((read) => !read.fallback && !defined.has(read.name))
    .map((read) => read.name);
  return [...new Set(missing)].sort();
}
