/** Every data call returns an outcome instead of throwing, so screens can say calmly what happened. */
export type Result<T> = { ok: true; data: T } | { ok: false; reason: "offline" | "failed" };

export function failure<T>(): Result<T> {
  return { ok: false, reason: navigator.onLine ? "failed" : "offline" };
}
