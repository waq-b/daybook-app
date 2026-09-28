import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { copy } from "../copy";
import { Daybook, type Difficulty } from "../design/daybook";
import { PredictionBefore } from "../components/PredictionCheck";
import { RepChart } from "../components/RepChart";
import { TextArea } from "../components/TextArea";
import { formatEntryTime, formatShortDate, fromDateColumn, shortTarget } from "../data/dates";
import { buildLadder, chartStory, tallyText, type LadderTask } from "../data/ladderRules";
import { settingsOf } from "../data/practices";
import { enqueue } from "../offline/outbox";
import { editTaskHref, ladderHref, logRepHref } from "./links";
import { useHierarchy } from "./store";

const { Button, EntryCard, Icon } = Daybook;
const t = copy.taskDetail;
type Likelihood = "not_very" | "fairly" | "very";

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="task-stat">
      <span className="t-label task-stat-label">{label}</span>
      <span className="t-num-lg">{value ?? t.noScore}</span>
      <span
        className="task-stat-strip"
        style={{ background: value === null ? "var(--line)" : `var(--difficulty-${value})` }}
        aria-hidden="true"
      />
    </div>
  );
}

function metaLine(row: LadderTask, now: Date): string {
  const { task } = row;
  const parts: string[] = [];
  parts.push(task.repeating && task.reps_per_week ? t.repeating(task.reps_per_week) : t.oneOff);
  if (row.done) {
    // Board TaskDetailDone: once done, the week no longer applies; the count does.
    parts.push(t.repCount(row.tally.reps));
  } else {
    if (task.repeating && task.reps_per_week)
      parts.push(t.week(row.week.count, task.reps_per_week));
    if (task.target_date) parts.push(t.by(shortTarget(fromDateColumn(task.target_date), now)));
  }
  return parts.join(t.metaJoin);
}

/** Boards TaskDetail (in progress), TaskDetailDone and TaskDetailNew. */
export function TaskDetailScreen() {
  const { id: practiceId = "", taskId = "" } = useParams();
  const navigate = useNavigate();
  const { loaded } = useHierarchy();
  const [comments, setComments] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);

  if (loaded.state === "loading") return null;
  const data = loaded.state === "ready" ? loaded.data : null;
  const practice = data?.practices.find((p) => p.id === practiceId);
  const task = data?.tasks.find((x) => x.id === taskId);
  if (!data || !practice || !task) {
    return (
      <main className="screen task-detail">
        <p role="status">{t.notFound}</p>
        <Link to={ladderHref(practiceId)} className="session-edit-back">
          {copy.ladder.backToPractices}
        </Link>
      </main>
    );
  }

  const now = new Date();
  const ladder = buildLadder([task], data.reps, "easiest", now);
  const row = (ladder.active[0] ?? ladder.done[0])!;
  const { reps } = row;
  const story = chartStory(task.predicted, reps);
  const predictionOn = settingsOf(practice).prediction_check && !row.done;
  const savedComments = task.comments ?? "";
  const shownComments = comments ?? savedComments;

  const saveTask = (patch: Record<string, unknown>) =>
    void enqueue({ table: "tasks", kind: "update", id: task.id, data: patch });

  const button = row.done ? (
    <Button
      variant="secondary"
      size="lg"
      block
      onClick={() => navigate(logRepHref(practiceId, task.id))}
    >
      {t.logAnother}
    </Button>
  ) : (
    <Button
      variant="primary"
      size="lg"
      block
      icon="plus"
      onClick={() => navigate(logRepHref(practiceId, task.id))}
    >
      {!task.repeating && reps.length === 0 ? t.logIt : t.logRep}
    </Button>
  );

  return (
    <main className="screen task-detail">
      <div className="session-detail-top">
        <Link to={ladderHref(practiceId)} className="session-detail-link">
          <Icon name="back" size={20} />
          {practice.name}
        </Link>
        <Link to={editTaskHref(practiceId, task.id)} className="session-detail-link">
          {t.edit}
        </Link>
      </div>

      <header className={`task-header${row.done ? " is-done" : ""}`}>
        {row.done && row.remaining !== null && (
          <p className="task-done-line">
            <Icon name="check" size={20} />
            {t.doneLine(row.remaining)}
          </p>
        )}
        <h1 className="t-title-lg task-title">{task.name}</h1>
        <div className="task-stats">
          <Stat label={t.predicted} value={task.predicted} />
          <span className="t-num-md task-stat-arrow" aria-hidden="true">
            {copy.controls.arrow}
          </span>
          <Stat label={t.remaining} value={row.remaining} />
          <div className="task-stat task-stat-tally">
            <span className="t-label task-stat-label">{t.tally}</span>
            <span className="t-num-lg">{tallyText(row.tally)}</span>
          </div>
        </div>
        <p className="task-meta">{metaLine(row, now)}</p>
        {task.notes && <p className="task-notes">{task.notes}</p>}
      </header>

      {predictionOn && (
        <PredictionBefore
          text={guess ?? task.next_prediction ?? ""}
          likelihood={task.next_prediction_likelihood as Likelihood | null}
          onText={setGuess}
          onTextDone={() => {
            // Saved when you leave the box, not on every key.
            if (guess !== null && guess !== (task.next_prediction ?? "")) {
              saveTask({ next_prediction: guess.trim() ? guess : null });
            }
          }}
          onLikelihood={(v) => saveTask({ next_prediction_likelihood: v })}
        />
      )}

      {story && (
        <section className="task-card">
          <RepChart
            predicted={task.predicted}
            reps={reps.map((r) => ({
              actual: r.actual,
              remaining: r.remaining,
              leftEarly: r.left_early,
            }))}
            story={
              story.count === 1
                ? t.storyOne(story.predicted, story.first, story.toRemaining)
                : t.storyMany(
                    story.predicted,
                    story.first,
                    story.latest,
                    story.fromRemaining,
                    story.toRemaining,
                  )
            }
          />
        </section>
      )}

      {row.done && row.completedAt && (
        <section className="task-comments">
          <div className="task-comments-head">
            <span className="t-heading">{t.comments}</span>
            <span className="task-comments-date">
              {t.dateCompleted(formatShortDate(row.completedAt))}
            </span>
          </div>
          <TextArea
            label={t.comments}
            rows={3}
            value={shownComments}
            onChange={(e) => setComments(e.target.value)}
          />
          {shownComments !== savedComments && (
            <div className="task-form-clear">
              <Button
                variant="quiet"
                onClick={() => {
                  saveTask({ comments: shownComments.trim() ? shownComments : null });
                  setComments(null);
                }}
              >
                {t.saveComments}
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="task-reps">
        <h2 className="t-heading task-reps-h">{t.reps}</h2>
        {reps.length === 0 ? (
          <div className="task-no-reps">
            <p className="task-no-reps-title">{t.noReps}</p>
            <p className="task-no-reps-body">{t.noRepsBody(task.predicted)}</p>
          </div>
        ) : (
          [...reps]
            .reverse()
            .map((rep, i) => (
              <EntryCard
                key={rep.id}
                type="hierarchy"
                title={t.repTitle(reps.length - i)}
                time={formatEntryTime(new Date(rep.at))}
                actual={rep.actual as Difficulty}
                remaining={rep.remaining as Difficulty}
                note={[...rep.coping, rep.note ?? ""].filter(Boolean).join(t.metaJoin) || undefined}
                attempt={rep.left_early}
                flagged={rep.flagged}
                onFlag={(on) =>
                  void enqueue({ table: "reps", kind: "update", id: rep.id, data: { flagged: on } })
                }
              />
            ))
        )}
      </section>

      <div className="task-bar">{button}</div>
    </main>
  );
}
