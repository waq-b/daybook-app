import { registerSW } from "virtual:pwa-register";

// Registers the service worker that caches the app shell and fonts. A new
// version installs in the background and takes over the next time the app
// opens fresh; nothing reloads the page while it's in use.
export function registerServiceWorker() {
  if (import.meta.env.DEV) return;
  registerSW({ immediate: true });
}
