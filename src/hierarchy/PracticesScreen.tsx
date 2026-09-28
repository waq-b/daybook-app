import { useState } from "react";
import { useNavigate } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { BottomSheet } from "../components/BottomSheet";
import { relativeDay } from "../data/dates";
import { buildLadder, lastLoggedAt, practiceCounts, practiceWeek } from "../data/ladderRules";
import { createPractice } from "../data/practices";
import { useHierarchy, type Hierarchy } from "./store";

const { Button, EmptyState, Icon, PracticeCard } = Daybook;
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
  const [adding, setAdding] = useState<"idle" | "busy" | "offline" | "failed">("idle");

  const now = new Date();
  const practices = loaded.state === "ready" ? loaded.data.practices : [];
  const hierarchy = practices.find((p) => p.type === "hierarchy");
  const empty = loaded.state === "ready" && practices.length === 0;

  async function onHierarchy() {
    // One hierarchy for now (D11): if it's there, the option opens it.
    if (hierarchy) return navigate(`/practices/${hierarchy.id}`);
    setAdding("busy");
    const result = await createPractice({
      id: crypto.randomUUID(),
      type: "hierarchy",
      name: t.hierarchyName,
    });
    if (!result.ok) return setAdding(result.reason);
    setAdding("idle");
    setSheet(false);
    reload();
    navigate(`/practices/${result.data.id}`);
  }

  const addNote = adding === "offline" ? t.addOffline : adding === "failed" ? t.addFailed : null;

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
            onClick={() => navigate(`/practices/${p.id}`)}
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
        <BottomSheet
          title={t.sheetTitle}
          onClose={() => {
            setSheet(false);
            setAdding("idle");
          }}
        >
          <p className="practices-sheet-lead">{t.sheetLead}</p>
          {/* Feelings and Gratitude join this list in phase 1 (D10). */}
          <button
            type="button"
            className="practice-option"
            onClick={onHierarchy}
            disabled={adding === "busy"}
          >
            <span className="practice-option-tile is-hierarchy">
              <Icon name="practice-hierarchy" />
            </span>
            <span className="practice-option-text">
              <span className="practice-option-name">{t.hierarchyName}</span>
              <span className="practice-option-line">
                {adding === "busy" ? t.adding : hierarchy ? t.alreadyAdded : t.hierarchyLine}
              </span>
            </span>
          </button>
          {addNote && (
            <p className="practices-sheet-note" role="status">
              {addNote}
            </p>
          )}
          <p className="practices-sheet-footer">{t.sheetFooter}</p>
        </BottomSheet>
      )}
    </main>
  );
}
