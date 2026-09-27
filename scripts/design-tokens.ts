// Reads colour values from design/tokens.json for build-time code (manifest,
// icons, theme-color) so no hex is ever typed outside design/.
import { readFileSync } from "node:fs";

interface TokensFile {
  color: { tokens: Array<{ name: string; value: string }> };
}

const tokens = JSON.parse(
  readFileSync(new URL("../design/tokens.json", import.meta.url), "utf8"),
) as TokensFile;

export const colours: Record<string, string> = Object.fromEntries(
  tokens.color.tokens.map((t) => [t.name, t.value]),
);

export function colour(name: string): string {
  const value = colours[name];
  if (!value) throw new Error(`No colour token "${name}" in design/tokens.json`);
  return value;
}

/** Replaces var(--name) with the token's value, for renderers without CSS (resvg). */
export function resolveVars(svg: string): string {
  return svg.replace(/var\(--([a-z0-9-]+)\)/g, (_, name: string) => colour(name));
}
