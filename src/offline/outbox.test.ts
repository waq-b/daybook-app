import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A tiny stand-in for Supabase: records what reaches "the server", can fail on demand.
const server = {
  rows: new Map<string, Record<string, unknown>>(),
  calls: [] as string[],
  failNext: 0,
  user: "user-a" as string | null,
};
vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: server.user ? { user: { id: server.user } } : null },
      }),
    },
    from: () => ({
      upsert: async (row: Record<string, unknown>) => {
        server.calls.push(`upsert ${row.id as string}`);
        if (server.failNext > 0)
          return (server.failNext--, { error: { message: "Failed to fetch" } });
        if (!server.rows.has(row.id as string)) server.rows.set(row.id as string, row); // ignoreDuplicates
        return { error: null };
      },
      update: (patch: Record<string, unknown>) => ({
        eq: async (_col: string, id: string) => {
          server.calls.push(`update ${id}`);
          if (server.failNext > 0)
            return (server.failNext--, { error: { message: "Failed to fetch" } });
          server.rows.set(id, { ...server.rows.get(id), ...patch });
          return { error: null };
        },
      }),
    }),
  },
}));

vi.stubGlobal("navigator", { onLine: true });

async function fresh() {
  vi.resetModules();
  globalThis.indexedDB = new IDBFactory();
  server.rows.clear();
  server.calls = [];
  server.failNext = 0;
  server.user = "user-a";
  const outbox = await import("./outbox");
  const store = await import("./db");
  return { ...outbox, ...store };
}

beforeEach(() => {
  (navigator as { onLine: boolean }).onLine = true;
});

describe("outbox", () => {
  it("saves on the phone while offline, then syncs in order once online", async () => {
    const o = await fresh();
    (navigator as { onLine: boolean }).onLine = false;
    await o.enqueue({ table: "reps", kind: "insert", id: "r1", data: { actual: 5, remaining: 4 } });
    await o.enqueue({ table: "reps", kind: "insert", id: "r2", data: { actual: 4, remaining: 3 } });
    expect(await o.pendingCount()).toBe(2);
    expect(server.calls).toEqual([]);

    (navigator as { onLine: boolean }).onLine = true;
    await o.syncNow();
    expect(server.calls).toEqual(["upsert r1", "upsert r2"]);
    expect(await o.pendingCount()).toBe(0);
  });

  it("keeps an op after a failure and retries it; a repeat never makes a second row", async () => {
    const o = await fresh();
    server.failNext = 1;
    await o.enqueue({ table: "reps", kind: "insert", id: "r1", data: { actual: 5, remaining: 4 } });
    await o.syncNow();
    expect(await o.pendingCount()).toBe(1);
    expect((await o.pendingOps())[0]!.attempts).toBe(1);

    await o.syncNow();
    expect(await o.pendingCount()).toBe(0);
    expect([...server.rows.keys()]).toEqual(["r1"]);
    expect(server.calls).toEqual(["upsert r1", "upsert r1"]);
  });

  it("stops at the first failure so later ops never overtake it", async () => {
    const o = await fresh();
    (navigator as { onLine: boolean }).onLine = false;
    await o.enqueue({ table: "reps", kind: "insert", id: "r1", data: {} });
    await o.enqueue({ table: "reps", kind: "insert", id: "r2", data: {} });
    (navigator as { onLine: boolean }).onLine = true;
    server.failNext = 1;
    await o.syncNow();
    expect(server.calls).toEqual(["upsert r1"]);
    expect(await o.pendingCount()).toBe(2);
  });

  it("folds updates to the same row together", async () => {
    const o = await fresh();
    (navigator as { onLine: boolean }).onLine = false;
    await o.enqueue({ table: "tasks", kind: "update", id: "t1", data: { comments: "a" } });
    await o.enqueue({
      table: "tasks",
      kind: "update",
      id: "t1",
      data: { comments: "ab", next_prediction: "x" },
    });
    await o.enqueue({ table: "tasks", kind: "update", id: "t2", data: { comments: "other" } });
    const ops = await o.pendingOps();
    expect(ops.map((op) => [op.id, op.data])).toEqual([
      ["t1", { comments: "ab", next_prediction: "x" }],
      ["t2", { comments: "other" }],
    ]);
  });

  it("folds an update into a pending insert of the same row", async () => {
    const o = await fresh();
    (navigator as { onLine: boolean }).onLine = false;
    await o.enqueue({
      table: "reps",
      kind: "insert",
      id: "r1",
      data: { actual: 5, flagged: false },
    });
    await o.enqueue({ table: "reps", kind: "update", id: "r1", data: { flagged: true } });
    const ops = await o.pendingOps();
    expect(ops).toHaveLength(1);
    expect(ops[0]!.data).toEqual({ actual: 5, flagged: true });
  });

  it("only syncs a person's writes while they're signed in", async () => {
    const o = await fresh();
    (navigator as { onLine: boolean }).onLine = false;
    await o.enqueue({ table: "reps", kind: "insert", id: "mine", data: {} });
    (navigator as { onLine: boolean }).onLine = true;
    server.user = null;
    await o.syncNow();
    expect(server.calls).toEqual([]);
    server.user = "user-b";
    await o.syncNow();
    expect(server.calls).toEqual([]);
    expect(await o.pendingCount()).toBe(1);
    server.user = "user-a";
    await o.syncNow();
    expect(server.calls).toEqual(["upsert mine"]);
  });

  it("lays pending writes over the last copy from the server", async () => {
    const o = await fresh();
    (navigator as { onLine: boolean }).onLine = false;
    await o.enqueue({ table: "reps", kind: "insert", id: "new", data: { actual: 3 } });
    await o.enqueue({
      table: "tasks",
      kind: "update",
      id: "t1",
      data: { comments: "Sat in the window" },
    });
    await o.enqueue({ table: "reps", kind: "update", id: "old", data: { flagged: true } });
    const ops = await o.pendingOps();
    const reps = o.withPending([{ id: "old", flagged: false }], ops, "reps");
    expect(reps).toEqual([
      { id: "old", flagged: true },
      { id: "new", actual: 3 },
    ]);
    expect(o.withPending([{ id: "t1", comments: null }], ops, "tasks")).toEqual([
      { id: "t1", comments: "Sat in the window" },
    ]);
  });

  it("tells listeners the pending count as it changes", async () => {
    const o = await fresh();
    const seen: number[] = [];
    (navigator as { onLine: boolean }).onLine = false;
    o.onPendingChange((n) => seen.push(n));
    await o.enqueue({ table: "reps", kind: "insert", id: "r1", data: {} });
    (navigator as { onLine: boolean }).onLine = true;
    await o.syncNow();
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual([0, 1, 0]);
  });
});

describe("drafts and cache", () => {
  it("round-trip and clear", async () => {
    await fresh();
    const drafts = await import("./drafts");
    const cache = await import("./cache");
    await drafts.writeDraft("rep:t1", { actual: 5 });
    expect(await drafts.readDraft("rep:t1")).toEqual({ actual: 5 });
    await drafts.clearDraft("rep:t1");
    expect(await drafts.readDraft("rep:t1")).toBeNull();
    await cache.writeCache("ladder:p1", { tasks: [1] });
    expect((await cache.readCache("ladder:p1"))!.value).toEqual({ tasks: [1] });
  });

  it("sign-out forgets copies and drafts but keeps unsynced writes; Delete everything clears all", async () => {
    const o = await fresh();
    const drafts = await import("./drafts");
    (navigator as { onLine: boolean }).onLine = false;
    await o.enqueue({ table: "reps", kind: "insert", id: "r1", data: {} });
    await drafts.writeDraft("rep:t1", { actual: 5 });
    await o.clearReadableCopies();
    expect(await drafts.readDraft("rep:t1")).toBeNull();
    expect(await o.pendingCount()).toBe(1);
    await o.clearPhoneStore();
    expect(await o.pendingCount()).toBe(0);
  });
});
