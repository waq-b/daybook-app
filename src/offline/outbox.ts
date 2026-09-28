// Writes that save on the phone first and sync when there's signal (plan 0c
// D24). Ops are applied in the order they were made; one is only removed
// once the server has confirmed it. An insert is an upsert on an id made on
// the phone, so however many times a retry sends it, it lands once.
import { supabase } from "../lib/supabase";
import { db, type OutboxOp, type OutboxTable } from "./db";

type Listener = (pending: number) => void;
const listeners = new Set<Listener>();

async function notify() {
  const n = await pendingCount();
  for (const l of listeners) l(n);
}

/** Calls `listener` with the pending count now and whenever it changes. */
export function onPendingChange(listener: Listener): () => void {
  listeners.add(listener);
  void pendingCount().then(listener);
  return () => listeners.delete(listener);
}

export async function pendingCount(): Promise<number> {
  return (await db()).count("outbox");
}

export async function pendingOps(table?: OutboxTable): Promise<OutboxOp[]> {
  const all = await (await db()).getAll("outbox");
  return table ? all.filter((op) => op.table === table) : all;
}

/**
 * Queues a write. An update to a row that's still waiting (to be inserted or
 * updated) is folded into that write, so the server only sees the final row.
 */
export async function enqueue(op: Pick<OutboxOp, "table" | "kind" | "id" | "data">): Promise<void> {
  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user.id;
  if (!userId) throw new Error("enqueue needs a signed-in user");
  const d = await db();
  const tx = d.transaction("outbox", "readwrite");
  // The latest write still waiting for the same row: an update folds into it
  // (an insert or an earlier update), so the server gets one final version.
  const same = (await tx.store.getAll()).filter(
    (o) => o.table === op.table && o.id === op.id && o.userId === userId,
  );
  const waiting = same.at(-1);
  if (op.kind === "update" && waiting) {
    await tx.store.put({ ...waiting, data: { ...waiting.data, ...op.data } });
  } else {
    await tx.store.add({ ...op, userId, queuedAt: new Date().toISOString(), attempts: 0 });
  }
  await tx.done;
  await notify();
  void syncNow();
}

let running: Promise<void> | null = null;

/** Sends what's waiting, in order. Stops at the first failure and tries again later. */
export function syncNow(): Promise<void> {
  running ??= (async () => {
    try {
      await drain();
    } finally {
      running = null;
    }
  })();
  return running;
}

async function drain() {
  if (!navigator.onLine) return;
  // Signed out (or the session's gone): keep everything and wait.
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  const d = await db();
  for (;;) {
    const op = (await d.getAll("outbox")).find((o) => o.userId === userId);
    if (!op) break;
    const ok = await send(op);
    if (!ok) {
      await d.put("outbox", { ...op, attempts: op.attempts + 1 });
      break;
    }
    await d.delete("outbox", op.seq!);
    await notify();
  }
}

async function send(op: OutboxOp): Promise<boolean> {
  // The table name is data here, so the typed builder can't be used.
  const table = supabase.from(op.table as never) as unknown as {
    upsert: (row: unknown, o: unknown) => PromiseLike<{ error: unknown }>;
    update: (patch: unknown) => { eq: (col: string, v: string) => PromiseLike<{ error: unknown }> };
  };
  const { error } =
    op.kind === "insert"
      ? await table.upsert({ ...op.data, id: op.id }, { onConflict: "id", ignoreDuplicates: true })
      : await table.update(op.data).eq("id", op.id);
  return !error;
}

/**
 * Rows as the phone knows them: the last copy from the server with anything
 * still in the outbox laid over it.
 */
export function withPending<T extends { id: string }>(
  rows: T[],
  ops: OutboxOp[],
  table: OutboxTable,
): T[] {
  const byId = new Map(rows.map((r) => [r.id, r] as const));
  for (const op of ops) {
    if (op.table !== table) continue;
    const current = byId.get(op.id);
    if (op.kind === "insert") byId.set(op.id, { ...(current ?? {}), ...op.data, id: op.id } as T);
    else if (current) byId.set(op.id, { ...current, ...op.data });
  }
  return [...byId.values()];
}

let started = false;

/** Syncs on app start, when the connection returns, on coming back to the app, and every minute while anything waits. */
export function startSync() {
  if (started) return;
  started = true;
  void syncNow();
  window.addEventListener("online", () => void syncNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow();
  });
  setInterval(() => {
    void pendingCount().then((n) => {
      if (n > 0) void syncNow();
    });
  }, 60_000);
}
