// Every user-facing string in Daybook. Components import from here; nothing
// user-facing is a literal in a component (CLAUDE.md protocol 5).
// Voice: plain, warm, British. Sentence case. No exclamation marks, no emoji.
// src/copy.test.ts checks every string in this file.

export const copy = {
  app: {
    name: "Daybook",
    description: "A logbook for the practical side of therapy.",
  },
  // Placeholder screens for the tabs whose content arrives in later phases.
  // Each is replaced when its phase builds the real screen.
  today: {
    title: "Today",
    emptyTitle: "Nothing to log yet",
    emptyBody: "Once a practice is set up, what's on for today shows here.",
  },
  practices: {
    title: "Practices",
    emptyTitle: "No practices yet",
    emptyBody: "Practices from your sessions will be listed here.",
  },
  sessions: {
    title: "Sessions",
    emptyTitle: "No sessions yet",
    emptyBody: "Your appointments, and what to bring to them, will be listed here.",
  },
  history: {
    title: "History",
    emptyTitle: "Nothing logged yet",
    emptyBody: "Everything you log is kept here, newest first.",
  },
  settings: {
    title: "Settings",
  },
} as const;
