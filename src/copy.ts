// Every user-facing string in Daybook. Components import from here; nothing
// user-facing is a literal in a component (CLAUDE.md protocol 5).
// Voice: plain, warm, British. Sentence case. No exclamation marks, no emoji.
// src/copy.test.ts checks every string in this file.

export const copy = {
  app: {
    name: "Daybook",
  },
  scaffold: {
    placeholder: "Daybook is being set up.",
  },
} as const;
