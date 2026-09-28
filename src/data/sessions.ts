// Sessions through the Supabase client under RLS. Every call returns an
// outcome instead of throwing, so screens can say calmly what happened.
import type { TablesInsert, TablesUpdate } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import type { Session } from "./sessionRules";

import { failure, type Result } from "./result";

export type { Result } from "./result";

export type SessionFields = Pick<TablesInsert<"sessions">, "at" | "notes" | "assigned_note">;

export async function listSessions(): Promise<Result<Session[]>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .is("archived_at", null)
    .order("at", { ascending: false });
  return error || !Array.isArray(data) ? failure() : { ok: true, data };
}

export async function getSession(id: string): Promise<Result<Session | null>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  return error ? failure() : { ok: true, data };
}

export async function createSession(fields: SessionFields): Promise<Result<Session>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase.from("sessions").insert(fields).select().single();
  return error || !data ? failure() : { ok: true, data };
}

export async function updateSession(
  id: string,
  fields: Pick<TablesUpdate<"sessions">, "at" | "notes" | "assigned_note">,
): Promise<Result<Session>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("sessions")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  return error || !data ? failure() : { ok: true, data };
}

/** Plan 0b D6: records that the session happened. Nothing else changes. */
export async function markSessionDone(id: string): Promise<Result<Session>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("sessions")
    .update({ done_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return error || !data ? failure() : { ok: true, data };
}
