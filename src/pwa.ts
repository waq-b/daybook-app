import { registerSW } from "virtual:pwa-register";

// The service worker caches the app so it opens offline. A new version
// installs in the background and then waits: it never swaps the page out by
// itself, because that could interrupt an entry. Instead the app says an
// update is ready and the person chooses when (UpdateNote).
//
// An installed iPhone app is rarely fully closed, so waiting for "every
// window closed" isn't enough; that's why it checks for a new version on
// open, whenever the app comes back to the front, and hourly.

const CHECK_EVERY_MS = 60 * 60 * 1000;

type Listener = (ready: boolean) => void;

let ready = false;
let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<Listener>();

function setReady() {
  ready = true;
  for (const listener of listeners) listener(true);
}

export function registerServiceWorker() {
  if (import.meta.env.DEV) return;
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh: setReady,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => undefined);
      };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });
}

/** Calls `listener` now and whenever a new version is waiting. Returns an unsubscribe. */
export function onUpdateReady(listener: Listener): () => void {
  listeners.add(listener);
  listener(ready);
  return () => listeners.delete(listener);
}

/** Lets the waiting version take over, then reloads into it. */
export function updateNow() {
  void applyUpdate?.(true);
}
