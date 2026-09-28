import { useState } from "react";
import { useNavigate } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { relativeDay } from "../data/dates";
import { buildLadder, lastLoggedAt, practiceCounts, practiceWeek } from "../data/ladderRules";
import { AddPracticeSheet } from "./AddPracticeSheet";
import { ladderHref } from "./links";
import { useHierarchy, type Hierarchy } from "./store";

const { Button, EmptyState, PracticeCard } = Daybook;
const t = copy.practices;

function cardProps(data: Hierarchy, practiceId: string, now: Date) {
  const tasks = data.tasks.filter((task) => task.practice_id === practiceId);
  const taskIds = new Set(tasks.map((task) => task.id));
  const reps = data.reps.filter((rep) => taskIds.has(rep.task_id));
  const ladder = buildLadder(tasks, reps, "easiest", now);
  const counts = practiceCounts(ladder);
  const week = practiceWeek(ladder);
  const last = lastLoggedAt(reps);
  return {
    meta: t.meta(counts.onTheGo, counts.done),
    lastLogged: last ? relativeDay(last, now) : undefined,
    target: week ? { done: week.done, of: week.of } : undefined,
  };
}

/** Boards Practices (filled), PracticesEmpty and PracticesPicker (the add sheet). */
export function PracticesScreen() {
  const navigate = useNavigate();
  const { loaded, reload } = useHierarchy();
  const [sheet, setSheet] = useState(false);

  const now = new Date();
  const practices = loaded.state === "ready" ? loaded.data.practices : [];
  const empty = loaded.state === "ready" && practices.length === 0;

  return (
    <main className="screen practices">
      <header className="practices-header">
        <h1 className="t-title-lg screen-title">{t.title}</h1>
        {practices.length > 0 && <p className="practices-sub">{t.active(practices.length)}</p>}
      </header>

      {loaded.state === "unavailable" && (
        <p className="practices-note" role="status">
          {t.loadOffline}
        </p>
      )}

      {empty && (
        <div className="practices-empty">
          <EmptyState icon="nav-practices" title={t.emptyTitle} body={t.emptyBody} />
        </div>
      )}

      {loaded.state === "ready" &&
        practices.map((p) => (
          <PracticeCard
            key={p.id}
            type={p.type}
            name={p.name}
            {...cardProps(loaded.data, p.id, now)}
            onClick={() => navigate(ladderHref(p.id))}
          />
        ))}

      {loaded.state === "ready" && (
        <div className="practices-bar">
          <Button variant="primary" size="lg" block icon="plus" onClick={() => setSheet(true)}>
            {empty ? t.addFirst : t.add}
          </Button>
        </div>
      )}

      {sheet && (
        <AddPracticeSheet
          existing={practices}
          onClose={() => setSheet(false)}
          onPicked={(practice, isNew) => {
            setSheet(false);
            if (isNew) reload();
            navigate(ladderHref(practice.id));
          }}
        />
      )}
    </main>
  );
}
