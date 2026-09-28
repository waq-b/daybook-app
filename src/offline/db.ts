// The phone's own store (IndexedDB via idb). Three parts:
//  - outbox: writes waiting for signal (plan 0c D24)
//  - cache:  the last copy of what logging needs to read (D25)
//  - drafts: a rep being filled in, so closing the app loses nothing (D27)
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type OutboxTable = "reps" | "tasks";

export interface OutboxOp {
  seq?: number;
  table: OutboxTable;
  /** insert = upsert by id (a retry can't duplicate); update = patch by id. */
  kind: "insert" | "update";
  id: string;
  data: Record<string, unknown>;
  queuedAt: string;
  attempts: number;
  /** Whose write this is: it only ever syncs while they're signed in. */
  userId: string;
}

interface DaybookDB extends DBSchema {
  outbox: { key: number; value: OutboxOp };
  cache: { key: string; value: { key: string; savedAt: string; value: unknown } };
  drafts: { key: string; value: { key: string; savedAt: string; value: unknown } };
}

const NAME = "daybook";
let open: Promise<IDBPDatabase<DaybookDB>> | null = null;

export function db(): Promise<IDBPDatabase<DaybookDB>> {
  open ??= openDB<DaybookDB>(NAME, 1, {
    upgrade(d) {
      d.createObjectStore("outbox", { keyPath: "seq", autoIncrement: true });
      d.createObjectStore("cache", { keyPath: "key" });
      d.createObjectStore("drafts", { keyPath: "key" });
    },
  });
  return open;
}

/** Everything Daybook keeps on this phone (Delete everything). */
export async function clearPhoneStore(): Promise<void> {
  const d = await db();
  await Promise.all([d.clear("outbox"), d.clear("cache"), d.clear("drafts")]);
}

/**
 * Signing out forgets the copies and drafts but keeps unsynced writes: they
 * sync the next time the same person signs in, and never for anyone else.
 */
export async function clearReadableCopies(): Promise<void> {
  const d = await db();
  await Promise.all([d.clear("cache"), d.clear("drafts")]);
}

/** Tests only: forget the open connection. */
export function resetForTests() {
  open = null;
}
