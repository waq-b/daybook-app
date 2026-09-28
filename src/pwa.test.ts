import { beforeEach, describe, expect, it, vi } from "vitest";

type Options = {
  onNeedRefresh?: () => void;
  onRegisteredSW?: (url: string, r: { update: () => Promise<void> } | undefined) => void;
};
const registerSW = vi.fn<(options: Options) => (reload?: boolean) => Promise<void>>();
vi.mock("virtual:pwa-register", () => ({ registerSW }));

const listeners: Record<string, () => void> = {};
vi.stubGlobal("document", {
  visibilityState: "visible",
  addEventListener: (name: string, fn: () => void) => (listeners[name] = fn),
});
vi.stubGlobal("navigator", { onLine: true });

beforeEach(() => {
  vi.resetModules();
  registerSW.mockReset();
});

async function load() {
  vi.stubEnv("DEV", false);
  const apply = vi.fn(async () => undefined);
  registerSW.mockReturnValue(apply);
  const pwa = await import("./pwa");
  pwa.registerServiceWorker();
  const options = registerSW.mock.calls[0]![0];
  return { pwa, apply, options };
}

describe("app updates", () => {
  it("tells listeners when a new version is waiting, including ones that subscribe later", async () => {
    const { pwa, options } = await load();
    const early = vi.fn();
    pwa.onUpdateReady(early);
    expect(early).toHaveBeenLastCalledWith(false);
    options.onNeedRefresh!();
    expect(early).toHaveBeenLastCalledWith(true);
    const late = vi.fn();
    pwa.onUpdateReady(late);
    expect(late).toHaveBeenLastCalledWith(true);
  });

  it("only takes the update when asked, and reloads into it", async () => {
    const { pwa, apply, options } = await load();
    options.onNeedRefresh!();
    expect(apply).not.toHaveBeenCalled();
    pwa.updateNow();
    expect(apply).toHaveBeenCalledWith(true);
  });

  it("checks for a new version whenever the app comes back to the front", async () => {
    vi.useFakeTimers();
    const { options } = await load();
    const update = vi.fn(async () => undefined);
    options.onRegisteredSW!("/sw.js", { update });
    listeners.visibilitychange!();
    expect(update).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(update).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
