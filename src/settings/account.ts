import { supabase } from "../lib/supabase";
import { clearPhoneStore, clearReadableCopies } from "../offline/db";

/** Keys this app keeps in the phone's storage, besides Supabase's session. */
const LOCAL_PREFIX = "daybook.";

export type Outcome = "ok" | "offline" | "failed";

/** Today's export file name, e.g. daybook-export-2026-09-27.json. */
export function exportFileName(now = new Date()): string {
  const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("-");
  return `daybook-export-${day}.json`;
}

/**
 * Settings → Export my data: every row the user owns, as JSON, via the share
 * sheet where the phone has one (Save to Files on iPhone), else a download.
 */
export async function exportEverything(): Promise<Outcome> {
  if (!navigator.onLine) return "offline";
  const { data, error } = await supabase.rpc("export_everything");
  if (error || !data) return navigator.onLine ? "failed" : "offline";

  const file = new File([JSON.stringify(data, null, 2)], exportFileName(), {
    type: "application/json",
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "ok";
    } catch (err) {
      // Closing the share sheet isn't a failure; anything else falls back to a download.
      if (err instanceof DOMException && err.name === "AbortError") return "ok";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "ok";
}

/** Whether what was typed at step 2 is the word (DELETE, any case, spaces ignored). */
export function confirmsDelete(typed: string, word: string): boolean {
  return typed.trim().toLowerCase() === word;
}

/**
 * Settings → Delete everything, step 2: the one hard delete (hard line 6).
 * Removes the account and every row on the server, then this phone's copy.
 */
export async function deleteEverything(): Promise<Outcome> {
  if (!navigator.onLine) return "offline";
  const { error } = await supabase.rpc("delete_everything", { confirm: "delete" });
  if (error) return navigator.onLine ? "failed" : "offline";
  await clearPhoneStore();
  await signOutHere();
  return "ok";
}

/** Signs out on this phone and forgets what Daybook kept here. */
export async function signOutHere(): Promise<void> {
  await clearReadableCopies();
  await supabase.auth.signOut({ scope: "local" });
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(LOCAL_PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing was kept there anyway.
  }
}
