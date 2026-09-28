// Everything the hierarchy screens read, from the server when there's signal
// (and then kept on the phone), otherwise from the phone's copy (plan 0c
// D25). Either way, writes still waiting in the outbox are laid on top, so
// a rep logged in the car park shows straight away.
import { useCallback, useEffect, useState } from "react";
import { listPractices, type Practice } from "../data/practices";
import { listAllReps, type Rep } from "../data/reps";
import { listAllTasks, type Task } from "../data/tasks";
import { readCache, writeCache } from "../offline/cache";
import { onPendingChange, pendingOps, withPending } from "../offline/outbox";

export interface Hierarchy {
  practices: Practice[];
  tasks: Task[];
  reps: Rep[];
}

const KEY = "hierarchy";

export type Loaded =
  | { state: "loading" }
  /** Nothing from the server and no copy on the phone (first open with no signal). */
  | { state: "unavailable" }
  | { state: "ready"; data: Hierarchy; from: "server" | "phone" };

export async function loadHierarchy(): Promise<Loaded> {
  const [p, t, r] = await Promise.all([listPractices(), listAllTasks(), listAllReps()]);
  let base: Hierarchy | null = null;
  let from: "server" | "phone" = "server";
  if (p.ok && t.ok && r.ok) {
    base = { practices: p.data, tasks: t.data, reps: r.data };
    await writeCache(KEY, base);
  } else {
    const copy = await readCache<Hierarchy>(KEY);
    if (copy) {
      base = copy.value;
      from = "phone";
    }
  }
  if (!base) return { state: "unavailable" };
  const ops = await pendingOps();
  return {
    state: "ready",
    from,
    data: {
      practices: base.practices,
      tasks: withPending(base.tasks, ops, "tasks").filter((task) => !task.archived_at),
      reps: withPending(base.reps, ops, "reps").filter((rep) => !rep.archived_at),
    },
  };
}

/** The hierarchy for a screen; reloads when something is saved or synced. */
export function useHierarchy(): { loaded: Loaded; reload: () => void } {
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });
  const reload = useCallback(() => {
    void loadHierarchy().then(setLoaded);
  }, []);
  useEffect(() => {
    let first = true; // onPendingChange calls straight away; the first load is already under way
    reload();
    return onPendingChange(() => {
      if (first) first = false;
      else reload();
    });
  }, [reload]);
  return { loaded, reload };
}
