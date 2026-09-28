// The phone's copy of what logging needs to read (plan 0c D25). Refreshed
// whenever the screens load with signal; read when they can't.
import { db } from "./db";

export async function readCache<T>(key: string): Promise<{ value: T; savedAt: string } | null> {
  const row = await (await db()).get("cache", key);
  return row ? { value: row.value as T, savedAt: row.savedAt } : null;
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await (await db()).put("cache", { key, value, savedAt: new Date().toISOString() });
}
