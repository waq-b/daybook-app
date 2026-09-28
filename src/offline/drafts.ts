// A rep being filled in, kept on the phone so closing the app loses nothing
// (plan 0c D27). Cleared on save or on ✕.
import { db } from "./db";

export async function readDraft<T>(key: string): Promise<T | null> {
  const row = await (await db()).get("drafts", key);
  return row ? (row.value as T) : null;
}

export async function writeDraft<T>(key: string, value: T): Promise<void> {
  await (await db()).put("drafts", { key, value, savedAt: new Date().toISOString() });
}

export async function clearDraft(key: string): Promise<void> {
  await (await db()).delete("drafts", key);
}
