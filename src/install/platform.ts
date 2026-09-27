// Which install prompt this phone needs, if any, and Android's deferred
// install event. Imported from main.tsx so the listener is in place before
// Chrome fires beforeinstallprompt (it only fires once, early).

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "ios" | "android" | null;

const DISMISSED_KEY = "daybook.install-prompt.dismissed";

let deferred: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // Daybook shows its own screen instead of Chrome's mini-bar.
    deferred = e as BeforeInstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    dismissInstallPrompt();
  });
}

/** Opened from the home screen (or installed on Android). */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** Phones only: a desktop browser gets no prompt. */
export function installPlatform(ua = navigator.userAgent): InstallPlatform {
  const iPadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOs) return "ios";
  if (/Android/.test(ua)) return "android";
  return null;
}

// Per-viewer convenience only: if storage is blocked, the prompt just shows again.
export function installPromptDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Nothing to do: it will simply ask again next time.
  }
}

/** Shows Chrome's install dialog if it offered one. Returns false if it didn't. */
export async function promptAndroidInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") dismissInstallPrompt();
  return true;
}

/** Whether the prompt belongs in front of the app right now. */
export function shouldShowInstallPrompt(): boolean {
  return installPlatform() !== null && !isStandalone() && !installPromptDismissed();
}
