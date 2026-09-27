// Every user-facing string in Daybook. Components import from here; nothing
// user-facing is a literal in a component (CLAUDE.md protocol 5).
// Voice: plain, warm, British. Sentence case. No exclamation marks, no emoji.
// src/copy.test.ts checks every string in this file.

export const copy = {
  app: {
    name: "Daybook",
    description: "A logbook for the practical side of therapy.",
  },
  // Sign in: boards SignIn and SignInCode. Headings, labels and buttons are
  // the canvas's words; the status lines fill states the canvas doesn't draw.
  signIn: {
    title: "Sign in",
    intro: "We'll email you a 6-digit code. No password to remember.",
    emailLabel: "Email",
    send: "Email me a code",
    sendNeedsEmail: "Enter your email to get a code",
    sending: "Sending a code",
    codeTitle: "Check your email",
    codeIntro: (email: string) => `We sent a code to ${email}. It works for 10 minutes.`,
    codeLabel: "6-digit code",
    verify: "Sign in",
    verifyNeedsCode: "Enter the 6-digit code",
    verifying: "Signing in",
    resend: "Send a new code",
    resent: "A new code is on its way.",
    differentEmail: "Use a different email",
    wrongCode: "That code didn't work. Check it against the latest email, or send a new one.",
    offline: "Signing in needs a connection. Try again when you're back online.",
    sendFailed: "The code couldn't be sent just now. Wait a minute, then try again.",
    privacy: "Your entries are yours. Nothing is shared unless you choose to.",
  },
  // Install prompt: boards Install (iOS) and InstallAndroid, canvas words.
  install: {
    title: "Put Daybook on your home screen",
    intro:
      "Reminders only work once it's there. It takes about ten seconds, and it opens like any other app.",
    iosStep1Before: "Tap the Share button",
    iosStep1After: "at the bottom of Safari.",
    shareLabel: "Share",
    iosStep2Before: "Scroll down and tap",
    iosStep2Strong: "Add to Home Screen",
    iosStep2After: ".",
    iosStep3Before: "Tap",
    iosStep3Strong: "Add",
    iosStep3After: ", then open Daybook from your home screen and sign in once more.",
    shareHint: "Share is down here",
    androidCardTitle: "What you get",
    androidCardBody:
      "Reminders at the times you choose. Logging works with no signal and syncs later. No browser bars.",
    androidFallbackBefore: "If the button doesn't do anything, tap",
    androidFallbackMenu: "⋮",
    androidFallbackMiddle: "in Chrome, then",
    androidFallbackStrong: "Add to Home screen",
    androidFallbackAfter: ".",
    androidInstall: "Install Daybook",
    notNow: "Not now",
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
