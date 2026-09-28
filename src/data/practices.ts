// Practices through the Supabase client under RLS. Creating one needs a
// connection (plan 0c D26); reading for the ladder also comes from the
// phone's copy (src/offline, D25).
import type { Json, Tables } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { failure, type Result } from "./result";

export type Practice = Tables<"practices">;

export interface PracticeSettings {
  /** D1: off by default; switched per practice at the foot of the ladder. */
  prediction_check: boolean;
}

export const DEFAULT_SETTINGS: PracticeSettings = { prediction_check: false };

/** A practice's settings with defaults filled in, whatever is stored. */
export function settingsOf(practice: Pick<Practice, "settings">): PracticeSettings {
  const s = (practice.settings ?? {}) as Partial<PracticeSettings>;
  return { prediction_check: s.prediction_check === true };
}

export async function listPractices(): Promise<Result<Practice[]>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("practices")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });
  return error || !Array.isArray(data) ? failure() : { ok: true, data };
}

export async function createPractice(fields: {
  id?: string;
  type: Practice["type"];
  name: string;
}): Promise<Result<Practice>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("practices")
    .insert({ ...fields, settings: DEFAULT_SETTINGS as unknown as Json })
    .select()
    .single();
  return error || !data ? failure() : { ok: true, data };
}

/** Optional link to the session it was assigned in (plan 0c task 9); null unlinks. */
export async function setPracticeSession(
  id: string,
  sessionId: string | null,
): Promise<Result<Practice>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("practices")
    .update({ session_id: sessionId })
    .eq("id", id)
    .select()
    .single();
  return error || !data ? failure() : { ok: true, data };
}
