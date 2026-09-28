import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { copy } from "../copy";
import { Daybook, type Difficulty } from "../design/daybook";
import { AddChip } from "../components/AddChip";
import { Celebration } from "../components/Celebration";
import { PredictionAfter } from "../components/PredictionCheck";
import { ScoreStat } from "../components/ScoreStat";
import { SegmentedControl } from "../components/SegmentedControl";
import { Tally } from "../components/Tally";
import { TextField } from "../components/TextField";
import {
  celebrates,
  confirmation,
  isDone,
  nextRepNumber,
  quickPicks,
  repsOf,
  tally,
  tallyText,
  thisWeek,
  type Outcome,
  type Rep,
  type Task,
} from "../data/ladderRules";
import { settingsOf, type Practice } from "../data/practices";
import { clearDraft, readDraft, writeDraft } from "../offline/drafts";
import { enqueue } from "../offline/outbox";
import { useSyncStatus } from "../offline/useSyncStatus";
import { ladderHref, taskHref, type JustCompleted } from "./links";
import { useHierarchy, type Hierarchy } from "./store";

const { Button, Chip, FlagToggle, Icon, RatingScale, SyncStatus } = Daybook;
const t = copy.logRep;

/** Everything on the form; kept on the phone as a draft until saved (plan 0c D27). */
interface Draft {
  repId: string;
  leftEarly: boolean;
  actual: Difficulty | null;
  remaining: Difficulty | null;
  coping: string[];
  extraPicks: string[];
  note: string;
  fieldsOpen: boolean;
  flagged: boolean;
  outcome: Outcome | null;
}

const draftKey = (taskId: string) => `rep:${taskId}`;

function freshDraft(): Draft {
  return {
    repId: crypto.randomUUID(),
    leftEarly: false,
    actual: null,
    remaining: null,
    coping: [],
    extraPicks: [],
    note: "",
    fieldsOpen: false,
    flagged: false,
    outcome: null,
  };
}

/** Board LogRep: loads the task and any draft, then the form starts from it. */
export function LogRepScreen() {
  const { id: practiceId = "", taskId = "" } = useParams();
  const { loaded } = useHierarchy();
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let live = true;
    void readDraft<Draft>(draftKey(taskId)).then((saved) => {
      if (live) setDraft(saved ?? freshDraft());
    });
    return () => {
      live = false;
    };
  }, [taskId]);

  if (loaded.state === "loading" || !draft) return null;
  const data: Hierarchy | null = loaded.state === "ready" ? loaded.data : null;
  const practice = data?.practices.find((p) => p.id === practiceId);
  const task = data?.tasks.find((x) => x.id === taskId);
  if (!data || !practice || !task) {
    return (
      <main className="screen log-rep">
        <p role="status">{t.notFound}</p>
        <Link to={ladderHref(practiceId)} className="session-edit-back">
          {copy.ladder.backToPractices}
        </Link>
      </main>
    );
  }
  return <LogRep practice={practice} task={task} data={data} initial={draft} />;
}

function LogRep({
  practice,
  task,
  data,
  initial,
}: {
  practice: Practice;
  task: Task;
  data: Hierarchy;
  initial: Draft;
}) {
  const navigate = useNavigate();
  const sync = useSyncStatus();
  const [form, setForm] = useState<Draft>(initial);
  const [saved, setSaved] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  // What the task looked like before this rep, fixed for the whole visit.
  const [before] = useState(() => repsOf(task, data.reps).filter((r) => r.id !== initial.repId));
  const [wasDone] = useState(() => isDone(before));
  const [prediction] = useState(() =>
    settingsOf(practice).prediction_check && task.next_prediction ? task.next_prediction : null,
  );
  const [likelihood] = useState(() => task.next_prediction_likelihood);

  const practiceTaskIds = new Set(
    data.tasks.filter((x) => x.practice_id === practice.id).map((x) => x.id),
  );
  const picks = [
    ...quickPicks(data.reps.filter((r) => practiceTaskIds.has(r.task_id))),
    ...form.extraPicks,
  ].filter((p, i, all) => all.indexOf(p) === i);

  // Keep the draft on the phone as it changes (not once it's saved).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!saved) void writeDraft(draftKey(task.id), form);
  }, [form, saved, task.id]);

  const set = (patch: Partial<Draft>) => setForm((f) => ({ ...f, ...patch }));
  const ready = form.actual !== null && form.remaining !== null;
  const now = new Date();
  const repNumber = nextRepNumber(before);
  const perWeek = task.repeating ? task.reps_per_week : null;
  const weekBefore = thisWeek(before, now);

  const thisRep: Rep | null = ready
    ? {
        id: form.repId,
        user_id: "",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        archived_at: null,
        task_id: task.id,
        at: now.toISOString(),
        actual: form.actual!,
        remaining: form.remaining!,
        left_early: form.leftEarly,
        coping: form.coping,
        note: form.note.trim() || null,
        prediction,
        prediction_likelihood: prediction ? likelihood : null,
        prediction_outcome: prediction ? form.outcome : null,
        flagged: form.flagged,
      }
    : null;

  async function onSave() {
    if (!thisRep) return;
    const row = {
      task_id: thisRep.task_id,
      at: thisRep.at,
      actual: thisRep.actual,
      remaining: thisRep.remaining,
      left_early: thisRep.left_early,
      coping: thisRep.coping,
      note: thisRep.note,
      prediction: thisRep.prediction,
      prediction_likelihood: thisRep.prediction_likelihood,
      prediction_outcome: thisRep.prediction_outcome,
      flagged: thisRep.flagged,
    };
    // Saves on the phone first, always (D24). "Change something" edits the same rep.
    if (savedOnce) {
      const { at: _keepTime, ...changes } = row;
      await enqueue({ table: "reps", kind: "update", id: form.repId, data: changes });
    } else {
      await enqueue({ table: "reps", kind: "insert", id: form.repId, data: row });
      // The prediction was for this rep; the next one starts fresh (D15).
      if (prediction) {
        await enqueue({
          table: "tasks",
          kind: "update",
          id: task.id,
          data: { next_prediction: null, next_prediction_likelihood: null },
        });
      }
    }
    await clearDraft(draftKey(task.id));
    setSavedOnce(true);
    setSaved(true);
  }

  async function onClose() {
    await clearDraft(draftKey(task.id));
    navigate(taskHref(practice.id, task.id));
  }

  function onDone() {
    const after = [...before, thisRep!];
    if (!wasDone && isDone(after)) {
      // D19: the rung this rep finished, shown once on the ladder.
      const state: JustCompleted = { justCompleted: task.id };
      navigate(ladderHref(practice.id), { replace: true, state });
    } else {
      navigate(taskHref(practice.id, task.id), { replace: true });
    }
  }

  const header = (
    <header className="log-rep-header">
      <button type="button" className="session-edit-close" aria-label={t.close} onClick={onClose}>
        <Icon name="close" />
      </button>
      <span className="t-label log-rep-kicker">{t.heading}</span>
    </header>
  );

  if (saved && thisRep) {
    const after = [...before, thisRep];
    const week = thisWeek(after, now);
    const afterTally = tally(after);
    const kind = confirmation({ leftEarly: thisRep.left_early, remaining: thisRep.remaining });
    const line =
      kind === "leftEarly"
        ? t.loggedLeftEarly
        : kind === "done"
          ? t.loggedDone(thisRep.remaining)
          : t.logged(task.predicted, thisRep.actual, thisRep.remaining);
    const wash = celebrates({
      leftEarly: thisRep.left_early,
      actual: thisRep.actual,
      remaining: thisRep.remaining,
      predicted: task.predicted,
      outcome: thisRep.prediction_outcome as Outcome | null,
    });
    const scores = (
      <div className="task-stats">
        <ScoreStat label={t.predicted} value={task.predicted} />
        <ScoreStat label={t.actualShort} value={thisRep.actual} />
        <ScoreStat label={t.remainingShort} value={thisRep.remaining} />
      </div>
    );
    const predLine =
      prediction && thisRep.prediction_outcome ? (
        <p className="log-rep-pred">
          {t.youThought(prediction)} {t.outcomeLine[thisRep.prediction_outcome as Outcome]}
        </p>
      ) : null;

    return (
      <main className="screen log-rep">
        {header}
        <h1 className="t-title log-rep-title">{task.name}</h1>
        {wash ? (
          <Celebration heading={line}>
            {predLine}
            {scores}
          </Celebration>
        ) : (
          <div className="log-rep-confirm" role="status">
            <p className="t-heading log-rep-confirm-line">{line}</p>
            {predLine}
            {scores}
          </div>
        )}
        <dl className="log-rep-summary">
          <div>
            <dt>{t.tally}</dt>
            <dd>
              <Tally marks={afterTally.marks} text={tallyText(afterTally)} />
            </dd>
          </div>
          {perWeek && (
            <div>
              <dt>{t.thisWeek}</dt>
              <dd>{t.weekAfter(week.count, perWeek, week.leftEarly)}</dd>
            </div>
          )}
          <div>
            <dt>
              <Icon name="flag" size={20} filled={thisRep.flagged} />
              {t.bringToSession}
            </dt>
            <dd>{thisRep.flagged ? t.flagged : t.notFlagged}</dd>
          </div>
        </dl>
        {sync.state && (
          <SyncStatus state={sync.state} count={sync.pending > 1 ? sync.pending : undefined} />
        )}
        <div className="log-rep-bar">
          <Button variant="quiet" block onClick={() => setSaved(false)}>
            {t.changeSomething}
          </Button>
          <Button variant="primary" size="lg" block onClick={onDone}>
            {t.done}
          </Button>
        </div>
      </main>
    );
  }

  const weekText = perWeek ? copy.ladder.week(weekBefore.count, perWeek) : null;
  return (
    <main className="screen log-rep">
      {header}
      <h1 className="t-title log-rep-title">{task.name}</h1>
      <p className="log-rep-sub">
        {weekText
          ? t.sublineWeek(task.predicted, repNumber, weekText)
          : t.subline(task.predicted, repNumber)}
      </p>

      <SegmentedControl
        label={t.howDidItGo}
        value={form.leftEarly ? "left" : "did"}
        onChange={(v) => set({ leftEarly: v === "left" })}
        options={[
          { value: "did", label: t.didIt },
          { value: "left", label: t.leftEarly },
        ]}
      />

      {prediction && (
        <PredictionAfter
          prediction={prediction}
          outcome={form.outcome}
          onOutcome={(o) => set({ outcome: o })}
        />
      )}

      {form.fieldsOpen ? (
        <section className="log-rep-fields">
          <span className="db-field-label" id="easier-h">
            {t.easier}
          </span>
          <div className="db-chips" role="group" aria-labelledby="easier-h">
            {picks.map((pick) => {
              const on = form.coping.includes(pick);
              return (
                <Chip
                  key={pick}
                  selected={on}
                  onClick={() =>
                    set({
                      coping: on ? form.coping.filter((c) => c !== pick) : [...form.coping, pick],
                    })
                  }
                >
                  {pick}
                </Chip>
              );
            })}
            {adding === null && (
              <AddChip onClick={() => setAdding("")}>{copy.controls.other}</AddChip>
            )}
          </div>
          {adding !== null && (
            <div className="log-rep-add">
              <TextField
                label={t.otherLabel}
                value={adding}
                onChange={(e) => setAdding(e.target.value)}
                autoFocus
              />
              <Button
                variant="quiet"
                disabled={!adding.trim()}
                onClick={() => {
                  const pick = adding.trim();
                  set({ extraPicks: [...form.extraPicks, pick], coping: [...form.coping, pick] });
                  setAdding(null);
                }}
              >
                {t.addPick}
              </Button>
            </div>
          )}
          <TextField
            label={t.note}
            value={form.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </section>
      ) : (
        <div className="log-rep-open">
          <Button variant="quiet" icon="plus" onClick={() => set({ fieldsOpen: true })}>
            {t.openFields}
          </Button>
        </div>
      )}

      <div className="log-rep-spacer" />

      <RatingScale
        label={t.actual}
        hint={form.actual === null ? t.actualHint : t.scoreHint(form.actual)}
        value={form.actual}
        onChange={(v) => set({ actual: v })}
        showValue={false}
        ends={false}
      />
      <RatingScale
        label={t.remaining}
        hint={form.remaining === null ? t.remainingHint : t.scoreHint(form.remaining)}
        value={form.remaining}
        onChange={(v) => set({ remaining: v })}
        showValue={false}
        lowLabel={t.low}
        highLabel={t.high}
      />
      <FlagToggle on={form.flagged} onChange={(on) => set({ flagged: on })} />

      <div className="log-rep-bar">
        <Button variant="primary" size="lg" block disabled={!ready} onClick={() => void onSave()}>
          {ready ? t.save : t.needsScores}
        </Button>
      </div>
    </main>
  );
}
