// The activity hierarchy worksheet's rules (plan 0c, D2–D8, D13, D17, D18,
// D21). Pure, so they're tested with fixed clocks; nothing here touches the
// network or decides what anything means for the person (hard line 3).
import type { Tables } from "../lib/database.types";
import { startOfWeek } from "./dates";

export type Task = Tables<"tasks">;
export type Rep = Tables<"reps">;
export type Order = "easiest" | "hardest";

/** Under 4 of 8 is done (hard line 1). */
export const DONE_BELOW = 4;

const time = (r: Pick<Rep, "at" | "created_at">) => new Date(r.at).getTime();

/** A task's reps, oldest first (ties by when they were saved). */
export function repsOf(task: Pick<Task, "id">, reps: Rep[]): Rep[] {
  return reps
    .filter((r) => r.task_id === task.id && !r.archived_at)
    .sort((a, b) => time(a) - time(b) || a.created_at.localeCompare(b.created_at));
}

/** Full reps only: a "started, left early" attempt doesn't finish a rung (D2). */
const full = (reps: Rep[]) => reps.filter((r) => !r.left_early);

/** The remaining score the rung shows: the latest full rep's, or null if none yet. */
export function latestRemaining(taskReps: Rep[]): number | null {
  const last = full(taskReps).at(-1);
  return last ? last.remaining : null;
}

/** D2: done when the latest full rep's remaining is under 4. */
export function isDone(taskReps: Rep[]): boolean {
  const r = latestRemaining(taskReps);
  return r !== null && r < DONE_BELOW;
}

/**
 * D4: the rep that took it under 4 and kept it there. Later reps under 4
 * don't move it; a rep at 4 or over un-does the rung.
 */
export function completedAt(taskReps: Rep[]): Date | null {
  if (!isDone(taskReps)) return null;
  const reps = full(taskReps);
  let start = 0;
  reps.forEach((r, i) => {
    if (r.remaining >= DONE_BELOW) start = i + 1;
  });
  return new Date(reps[start]!.at);
}

export interface Tally {
  reps: number;
  attempts: number;
  /** In the order they happened. */
  marks: Array<"rep" | "attempt">;
}

/** D6: "4" or "4 + 1", every rep and attempt in order. */
export function tally(taskReps: Rep[]): Tally {
  const marks = taskReps.map((r): "rep" | "attempt" => (r.left_early ? "attempt" : "rep"));
  return {
    reps: marks.filter((m) => m === "rep").length,
    attempts: marks.filter((m) => m === "attempt").length,
    marks,
  };
}

export function tallyText(t: Pick<Tally, "reps" | "attempts">): string {
  return t.attempts ? `${t.reps} + ${t.attempts}` : `${t.reps}`;
}

/** D7: this week (Monday to Sunday, local). Attempts count towards the target. */
export function thisWeek(taskReps: Rep[], now: Date): { count: number; leftEarly: number } {
  const from = startOfWeek(now).getTime();
  const week = taskReps.filter((r) => time(r) >= from && time(r) <= now.getTime());
  return { count: week.length, leftEarly: week.filter((r) => r.left_early).length };
}

/** D8: rep numbers count attempts ("rep 6" is the sixth entry). */
export function nextRepNumber(taskReps: Rep[]): number {
  return taskReps.length + 1;
}

export interface LadderTask {
  task: Task;
  reps: Rep[];
  remaining: number | null;
  done: boolean;
  completedAt: Date | null;
  tally: Tally;
  week: { count: number; leftEarly: number };
}

export interface Ladder {
  /** Not done yet, in the chosen order. With "easiest", the first is UP NEXT. */
  active: LadderTask[];
  /** Done, most recently completed first (they stay under the "under 4" line). */
  done: LadderTask[];
}

const byAdded = (a: Task, b: Task) => a.created_at.localeCompare(b.created_at);

export function buildLadder(tasks: Task[], reps: Rep[], order: Order, now: Date): Ladder {
  const rows: LadderTask[] = tasks
    .filter((t) => !t.archived_at)
    .map((task) => {
      const own = repsOf(task, reps);
      return {
        task,
        reps: own,
        remaining: latestRemaining(own),
        done: isDone(own),
        completedAt: completedAt(own),
        tally: tally(own),
        week: thisWeek(own, now),
      };
    });
  const sign = order === "easiest" ? 1 : -1;
  const active = rows
    .filter((r) => !r.done)
    .sort((a, b) => sign * (a.task.predicted - b.task.predicted) || byAdded(a.task, b.task));
  const done = rows
    .filter((r) => r.done)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  return { active, done };
}

export interface LandingRow {
  predicted: number;
  name: string;
  isNew: boolean;
}

/**
 * "Where it lands" (board AddTask): the active rungs easiest first, with the
 * new one placed after any at the same score.
 */
export function whereItLands(
  active: Array<Pick<Task, "predicted" | "name" | "created_at">>,
  newTask: { predicted: number; name: string },
): LandingRow[] {
  const rows = [...active]
    .sort((a, b) => a.predicted - b.predicted || a.created_at.localeCompare(b.created_at))
    .map((t) => ({ predicted: t.predicted, name: t.name, isNew: false }));
  const at = rows.findIndex((r) => r.predicted > newTask.predicted);
  const row = { ...newTask, isNew: true };
  if (at === -1) rows.push(row);
  else rows.splice(at, 0, row);
  return rows;
}

/**
 * D13: the soft high-rung note. Returns the two scores to name ("nothing at
 * {low} or {high} is done yet"), or null when there's no note.
 */
export function highRungNote(
  predicted: number,
  ladder: Pick<Ladder, "done">,
): { low: number; high: number } | null {
  if (predicted < 6) return null;
  const low = predicted - 2;
  const high = predicted - 1;
  const stepDone = ladder.done.some((d) => d.task.predicted === low || d.task.predicted === high);
  return stepDone ? null : { low, high };
}

export type Outcome = "no" | "a_bit" | "yes";

/** D18, the board's rule: a full rep easier than predicted or under 4, or a prediction that didn't happen. */
export function celebrates(rep: {
  leftEarly: boolean;
  actual: number;
  remaining: number;
  predicted: number;
  outcome: Outcome | null;
}): boolean {
  return (
    (!rep.leftEarly && (rep.actual < rep.predicted || rep.remaining < DONE_BELOW)) ||
    rep.outcome === "no"
  );
}

/** Which confirmation line a saved rep gets (board LogRep, in priority order). */
export function confirmation(rep: {
  leftEarly: boolean;
  remaining: number;
}): "leftEarly" | "done" | "logged" {
  if (rep.leftEarly) return "leftEarly";
  if (rep.remaining < DONE_BELOW) return "done";
  return "logged";
}

/**
 * D21: the chart's story, as data for the copy. With one rep, first and
 * latest are the same rep.
 */
export function chartStory(
  predicted: number,
  taskReps: Rep[],
): {
  predicted: number;
  first: number;
  latest: number;
  fromRemaining: number;
  toRemaining: number;
  count: number;
} | null {
  if (taskReps.length === 0) return null;
  const first = taskReps[0]!;
  const last = taskReps.at(-1)!;
  return {
    predicted,
    first: first.actual,
    latest: last.actual,
    fromRemaining: first.remaining,
    toRemaining: last.remaining,
    count: taskReps.length,
  };
}

/** "a 5", "an 8": the article for a score read aloud. */
export function article(n: number): "a" | "an" {
  return n === 8 ? "an" : "a";
}

/** The practice card's line: how many rungs are on the go and how many are done. */
export function practiceCounts(ladder: Ladder): { onTheGo: number; done: number } {
  return { onTheGo: ladder.active.length, done: ladder.done.length };
}

/**
 * The practice card's weekly target: across repeating rungs still on the go,
 * reps this week (capped per rung at its own target) of the reps planned.
 * Null when nothing repeats.
 */
export function practiceWeek(ladder: Ladder): { done: number; of: number } | null {
  const repeating = ladder.active.filter((r) => r.task.repeating && r.task.reps_per_week);
  if (repeating.length === 0) return null;
  let done = 0;
  let of = 0;
  for (const r of repeating) {
    const target = r.task.reps_per_week!;
    of += target;
    done += Math.min(r.week.count, target);
  }
  return { done, of };
}

/** When anything on this practice was last logged, or null. */
export function lastLoggedAt(reps: Rep[]): Date | null {
  const live = reps.filter((r) => !r.archived_at);
  if (live.length === 0) return null;
  return new Date(Math.max(...live.map(time)));
}

/** D17: coping picks you've used before, most used first, then most recent. */
export function quickPicks(reps: Rep[]): string[] {
  const seen = new Map<string, { count: number; last: number }>();
  for (const r of reps) {
    for (const pick of r.coping) {
      const key = pick.trim();
      if (!key) continue;
      const entry = seen.get(key) ?? { count: 0, last: 0 };
      entry.count += 1;
      entry.last = Math.max(entry.last, time(r));
      seen.set(key, entry);
    }
  }
  return [...seen.entries()]
    .sort(([, a], [, b]) => b.count - a.count || b.last - a.last)
    .map(([pick]) => pick);
}
