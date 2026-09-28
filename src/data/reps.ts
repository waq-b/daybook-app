// Reading reps. Writing them always goes through the outbox (src/offline,
// plan 0c D24): a rep saves on the phone first and never waits for signal.
import type { Tables } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { failure, type Result } from "./result";

export type Rep = Tables<"reps">;

/** Every rep on a practice's tasks, oldest first. */
export async function listPracticeReps(practiceId: string): Promise<Result<Rep[]>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("reps")
    .select("*, tasks!inner(practice_id)")
    .eq("tasks.practice_id", practiceId)
    .is("archived_at", null)
    .order("at", { ascending: true });
  if (error || !Array.isArray(data)) return failure();
  return { ok: true, data: data.map(({ tasks, ...rep }) => rep) };
}
