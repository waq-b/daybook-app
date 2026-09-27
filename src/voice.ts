// The voice rules from CLAUDE.md hard line 8, as code, so tests can apply them
// to copy.ts and anything else that reaches the user.

export const BANNED_WORDS = ["journey", "healing", "self-care", "mindful", "wellness", "streak"];

/** Returns why `text` breaks the voice rules, or an empty list if it doesn't. */
export function voiceProblems(text: string): string[] {
  const problems: string[] = [];
  if (text.includes("!")) problems.push("exclamation mark");
  if (/\p{Extended_Pictographic}/u.test(text)) problems.push("emoji");
  for (const word of BANNED_WORDS) {
    // Whole word, any case, plurals and -s/-ed/-ing forms included ("streaks", "journeys").
    if (new RegExp(`\\b${word}(s|ed|ing)?\\b`, "i").test(text))
      problems.push(`banned word "${word}"`);
  }
  return problems;
}

/** Every string inside a nested copy object, with its dotted path. */
export function allStrings(value: unknown, path = ""): Array<[string, string]> {
  if (typeof value === "string") return [[path, value]];
  // Copy that takes a value (e.g. an email) is checked with a sample filled in.
  if (typeof value === "function") return allStrings(value("name@example.com"), path);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, v]) =>
      allStrings(v, path ? `${path}.${key}` : key),
    );
  }
  return [];
}
