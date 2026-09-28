// Ladder rungs. Adding and editing need a connection (plan 0c D26); small
// changes made while logging (comments, "Before the next one") go through the
// outbox instead (src/offline, D24).
import type { Tables, TablesInsert, TablesUpdate } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { failure, type Result } from "./result";

export type Task = Tables<"tasks">;

export type TaskFields = Pick<
  TablesInsert<"tasks">,
  "name" | "predicted" | "repeating" | "reps_per_week" | "target_date" | "notes"
>;

export async function listTasks(practiceId: string): Promise<Result<Task[]>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("practice_id", practiceId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });
  return error || !Array.isArray(data) ? failure() : { ok: true, data };
}

export async function createTask(practiceId: string, fields: TaskFields): Promise<Result<Task>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...fields, practice_id: practiceId })
    .select()
    .single();
  return error || !data ? failure() : { ok: true, data };
}

export async function updateTask(
  id: string,
  fields: Pick<TablesUpdate<"tasks">, keyof TaskFields>,
): Promise<Result<Task>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("tasks")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  return error || !data ? failure() : { ok: true, data };
}

/** D12: archived rungs leave the ladder; their reps stay. Never deleted (hard line 6). */
export async function archiveTask(id: string): Promise<Result<Task>> {
  if (!navigator.onLine) return failure();
  const { data, error } = await supabase
    .from("tasks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return error || !data ? failure() : { ok: true, data };
}
