import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { Celebration } from "../components/Celebration";
import { SegmentedControl } from "../components/SegmentedControl";
import { Toggle } from "../components/Toggle";
import { formatShortDate, fromDateColumn, shortTarget, startOfDay } from "../data/dates";
import { buildLadder, type LadderTask, type Order } from "../data/ladderRules";
import { setPredictionCheck, settingsOf } from "../data/practices";
import { newTaskHref, taskHref, type JustCompleted } from "./links";
import { useHierarchy } from "./store";

const { Button, EmptyState, Icon, LadderRung } = Daybook;
const t = copy.ladder;

const ORDER_KEY = "daybook.ladder-order";

function savedOrder(): Order {
  try {
    return localStorage.getItem(ORDER_KEY) === "hardest" ? "hardest" : "easiest";
  } catch {
    return "easiest";
  }
}

/** The rung's right-hand text: the week's target, or one-off and when it's for. */
function rightText(row: LadderTask, now: Date): string {
  const { task } = row;
  if (task.repeating && task.reps_per_week) return t.week(row.week.count, task.reps_per_week);
  if (task.target_date) return t.oneOffBy(shortTarget(fromDateColumn(task.target_date), now));
  return t.oneOff;
}

function completedOn(row: LadderTask, now: Date): string | undefined {
  if (!row.completedAt) return undefined;
  return startOfDay(row.completedAt).getTime() === startOfDay(now).getTime()
    ? t.today
    : formatShortDate(row.completedAt);
}

/** Boards Ladder (filled, easiest / hardest first), LadderEmpty and LadderDone. */
export function LadderScreen() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loaded, reload } = useHierarchy();
  const [order, setOrder] = useState<Order>(savedOrder);
  const [checkNote, setCheckNote] = useState<string | null>(null);
  // D19: after the rep that finished a rung, once. Cleared from history so a reload doesn't repeat it.
  const [justCompleted] = useState(
    () => (location.state as JustCompleted | null)?.justCompleted ?? null,
  );
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const chooseOrder = (next: Order) => {
    setOrder(next);
    try {
      localStorage.setItem(ORDER_KEY, next);
    } catch {
      // Per-phone convenience only.
    }
  };

  if (loaded.state === "loading") return null;
  const practice =
    loaded.state === "ready" ? loaded.data.practices.find((p) => p.id === id) : undefined;
  if (!practice || loaded.state !== "ready") {
    return (
      <main className="screen ladder">
        <p className="ladder-note" role="status">
          {loaded.state === "unavailable" ? t.loadOffline : t.notFound}
        </p>
        <Link to="/practices" className="session-edit-back">
          {t.backToPractices}
        </Link>
      </main>
    );
  }

  const now = new Date();
  const tasks = loaded.data.tasks.filter((task) => task.practice_id === practice.id);
  const ids = new Set(tasks.map((task) => task.id));
  const reps = loaded.data.reps.filter((rep) => ids.has(rep.task_id));
  const ladder = buildLadder(tasks, reps, order, now);
  const empty = tasks.length === 0;
  const finished = justCompleted ? ladder.done.find((r) => r.task.id === justCompleted) : undefined;
  const settings = settingsOf(practice);

  const rung = (row: LadderTask, done: boolean) => (
    <LadderRung
      name={row.task.name}
      predicted={row.task.predicted as 0}
      remaining={row.remaining as 0 | null}
      reps={row.tally.reps}
      attempts={row.tally.attempts}
      done={done}
      completedOn={done ? completedOn(row, now) : undefined}
      right={done ? undefined : rightText(row, now)}
      onClick={() => navigate(taskHref(practice.id, row.task.id))}
    />
  );

  async function onPredictionCheck(on: boolean) {
    setCheckNote(null);
    const result = await setPredictionCheck(practice!, on);
    if (!result.ok) return setCheckNote(t.predictionOffline);
    reload();
  }

  return (
    <main className={`screen ladder${finished ? " has-celebration" : ""}`}>
      <Link to="/practices" className="session-detail-link ladder-back">
        <Icon name="back" size={20} />
        {t.back}
      </Link>

      <header className="ladder-header">
        <Icon name="practice-hierarchy" size={28} />
        <h1 className="t-title-lg ladder-title">{practice.name}</h1>
        <p className="ladder-rule">{t.rule}</p>
      </header>

      {empty ? (
        <div className="ladder-empty">
          <EmptyState icon="practice-hierarchy" title={t.emptyTitle} body={t.emptyBody} />
        </div>
      ) : (
        <>
          <SegmentedControl
            label={t.order}
            value={order}
            onChange={chooseOrder}
            options={[
              { value: "easiest", label: t.easiest },
              { value: "hardest", label: t.hardest },
            ]}
          />
          <ul className="ladder-legend" aria-hidden="true">
            <li>
              <span className="ladder-legend-swatch" />
              {t.legendRemaining}
            </li>
            <li>
              <span className="db-tally-mark is-rep" />
              {t.legendRep}
            </li>
            <li>
              <span className="db-tally-mark is-attempt" />
              {t.legendAttempt}
            </li>
          </ul>

          {ladder.active.length > 0 && (
            <ol className="ladder-rungs">
              {ladder.active.map((row, i) => (
                <li key={row.task.id} className="ladder-rung">
                  {order === "easiest" && i === 0 && (
                    <span className="t-label ladder-up-next">{t.upNext}</span>
                  )}
                  {rung(row, false)}
                </li>
              ))}
            </ol>
          )}

          {ladder.done.length > 0 && (
            <>
              <div className="ladder-separator" role="separator" aria-label={t.doneBandLabel}>
                <span className="t-label" aria-hidden="true">
                  {t.doneBand}
                </span>
              </div>
              <section aria-label={t.doneSection}>
                <ol className="ladder-rungs is-done">
                  {ladder.done.map((row) => (
                    <li
                      key={row.task.id}
                      className={`ladder-rung${row.task.id === justCompleted ? " is-just-done" : ""}`}
                    >
                      {rung(row, true)}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </>
      )}

      <div className="ladder-setting">
        <Toggle
          label={t.predictionCheck}
          description={t.predictionCheckHint}
          checked={settings.prediction_check}
          onChange={onPredictionCheck}
        />
        {checkNote && (
          <p className="ladder-note" role="status">
            {checkNote}
          </p>
        )}
      </div>

      <div className="ladder-bar">
        {finished && finished.remaining !== null && (
          <Celebration
            heading={t.celebrationHeading}
            line={t.celebrationLine(finished.task.name, finished.remaining)}
            from={finished.task.predicted}
            to={finished.remaining}
          />
        )}
        <Button
          variant="primary"
          size="lg"
          block
          icon="plus"
          onClick={() => navigate(newTaskHref(practice.id))}
        >
          {empty ? t.addFirst : t.add}
        </Button>
      </div>
    </main>
  );
}
