// Reading reps. Writing them always goes through the outbox (src/offline,
// plan 0c D24): a rep saves on the phone first and never waits for signal.
import type { Tables } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { failure, type Result } from "./result";

export type Rep = Tables<"reps">;

/** Every rep you've logged (not archived), oldest first. */
export async function listAllReps(): Promise<Result<Rep[]>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("reps")
    .select("*")
    .is("archived_at", null)
    .order("at", { ascending: true });
  return error || !Array.isArray(data) ? failure() : { ok: true, data };
}
