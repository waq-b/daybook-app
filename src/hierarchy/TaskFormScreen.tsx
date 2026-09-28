import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { copy } from "../copy";
import { Daybook, type Difficulty } from "../design/daybook";
import { BottomSheet } from "../components/BottomSheet";
import { DateField } from "../components/DateTimeField";
import { Note } from "../components/Note";
import { SegmentedControl } from "../components/SegmentedControl";
import { Stepper } from "../components/Stepper";
import { TextArea } from "../components/TextArea";
import { TextField } from "../components/TextField";
import { buildLadder, highRungNote, whereItLands } from "../data/ladderRules";
import { archiveTask, createTask, updateTask } from "../data/tasks";
import { ladderHref, taskHref } from "./links";
import { useHierarchy, type Hierarchy } from "./store";
import type { Task } from "../data/tasks";

const { Button, Icon, RatingScale, Score } = Daybook;
const t = copy.addTask;

type Status = "idle" | "busy" | "offline" | "failed";
const orNull = (text: string) => (text.trim() ? text.trim() : null);

/**
 * Boards AddTask and AddTaskWarning (/practices/:id/tasks/new), and editing
 * (…/tasks/:taskId/edit, plan 0c D12). Full screen, no nav. Saving needs a
 * connection and keeps the form (D26).
 */
export function TaskFormScreen() {
  const { id: practiceId = "", taskId } = useParams();
  const { loaded } = useHierarchy();

  if (loaded.state === "loading") return null;
  const data: Hierarchy =
    loaded.state === "ready" ? loaded.data : { practices: [], tasks: [], reps: [] };
  const task = taskId ? data.tasks.find((x) => x.id === taskId) : undefined;
  if (taskId && !task) {
    return (
      <main className="screen task-form">
        <p role="status">{t.notFound}</p>
        <Link to={ladderHref(practiceId)} className="session-edit-back">
          {copy.ladder.backToPractices}
        </Link>
      </main>
    );
  }
  return <TaskForm practiceId={practiceId} task={task} data={data} />;
}

/** The form itself, starting from the task being edited (or blank). */
function TaskForm({
  practiceId,
  task,
  data,
}: {
  practiceId: string;
  task?: Task;
  data: Hierarchy;
}) {
  const editing = Boolean(task);
  const navigate = useNavigate();

  const [name, setName] = useState(task?.name ?? "");
  const [predicted, setPredicted] = useState<Difficulty | null>(
    (task?.predicted as Difficulty) ?? null,
  );
  const [repeating, setRepeating] = useState(task?.repeating ?? false);
  const [perWeek, setPerWeek] = useState(task?.reps_per_week ?? 4);
  const [target, setTarget] = useState(task?.target_date ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [archiving, setArchiving] = useState<"closed" | "open" | "offline">("closed");

  const tasks = data.tasks.filter((x) => x.practice_id === practiceId);
  const reps = data.reps;
  const others = tasks.filter((x) => x.id !== task?.id);
  const ladder = buildLadder(others, reps, "easiest", new Date());
  const lands =
    predicted === null
      ? []
      : whereItLands(
          ladder.active.map((r) => r.task),
          { predicted, name: name.trim() || t.unnamed },
        );
  const note = predicted === null ? null : highRungNote(predicted, ladder);
  const ready = name.trim() !== "" && predicted !== null;
  const busy = status === "busy";
  const closeTo = task ? taskHref(practiceId, task.id) : ladderHref(practiceId);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setStatus("busy");
    const fields = {
      name: name.trim(),
      predicted: predicted!,
      repeating,
      reps_per_week: repeating ? perWeek : null,
      target_date: target || null,
      notes: orNull(notes),
    };
    const result = task ? await updateTask(task.id, fields) : await createTask(practiceId, fields);
    if (!result.ok) return setStatus(result.reason);
    navigate(task ? taskHref(practiceId, task.id) : ladderHref(practiceId), { replace: true });
  }

  async function onArchive() {
    const result = await archiveTask(task!.id);
    if (!result.ok) return setArchiving("offline");
    navigate(ladderHref(practiceId), { replace: true });
  }

  const saveNote = status === "offline" ? t.offline : status === "failed" ? t.failed : null;

  return (
    <form className="screen task-form" onSubmit={onSave} noValidate>
      <header className="session-edit-header">
        <Link to={closeTo} className="session-edit-close" aria-label={t.close}>
          <Icon name="close" />
        </Link>
        <h1 className="t-title session-edit-title">{editing ? t.editTitle : t.newTitle}</h1>
      </header>

      <TextField
        label={t.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="off"
      />

      <RatingScale
        label={t.predicted}
        value={predicted}
        onChange={setPredicted}
        showValue
        ends={false}
      />

      {lands.length > 0 && (
        <section className="task-lands" aria-label={t.landsLabel}>
          <span className="t-label task-lands-title">{t.landsTitle}</span>
          <ol className="task-lands-list">
            {lands.map((row, i) => (
              <li key={i} className={`task-lands-row${row.isNew ? " is-new" : ""}`}>
                <Score value={row.predicted as Difficulty} size="sm" />
                <span className="task-lands-name">{row.name}</span>
                {row.isNew && <span className="t-label task-lands-tag">{t.newTag}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {note && <Note>{t.highRung(note.low, note.high)}</Note>}

      <div className="task-form-group">
        <span className="db-field-label">{t.howOften}</span>
        <SegmentedControl
          label={t.howOften}
          value={repeating ? "repeating" : "one-off"}
          onChange={(v) => setRepeating(v === "repeating")}
          options={[
            { value: "one-off", label: t.oneOff },
            { value: "repeating", label: t.repeating },
          ]}
        />
      </div>

      {repeating && (
        <Stepper
          label={t.repsPerWeek}
          hint={t.repsHint}
          value={perWeek}
          min={1}
          max={7}
          onChange={setPerWeek}
        />
      )}

      <div className="task-form-group">
        <span className="db-field-label">
          {t.targetDate}
          <span className="db-field-optional"> {copy.fields.optional}</span>
        </span>
        <DateField label={t.targetDate} date={target} onChange={setTarget} />
        {target && (
          <div className="task-form-clear">
            <Button variant="quiet" onClick={() => setTarget("")}>
              {t.noTarget}
            </Button>
          </div>
        )}
      </div>

      <TextArea
        label={t.notes}
        optional
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {task && (
        <div className="task-form-archive">
          <Button variant="quiet" onClick={() => setArchiving("open")}>
            {t.archive}
          </Button>
        </div>
      )}

      <div className="session-edit-bar">
        {saveNote && (
          <p className="session-edit-note" role="status">
            {saveNote}
          </p>
        )}
        <Button variant="primary" size="lg" block type="submit" disabled={!ready || busy}>
          {busy ? (editing ? t.saving : t.adding) : ready ? (editing ? t.save : t.add) : t.needs}
        </Button>
      </div>

      {archiving !== "closed" && (
        <BottomSheet title={t.archiveTitle} onClose={() => setArchiving("closed")}>
          <p className="task-form-sheet-text">{t.archiveBody}</p>
          {archiving === "offline" && (
            <p className="task-form-sheet-text" role="status">
              {t.archiveOffline}
            </p>
          )}
          <div className="settings-sheet-pair">
            <Button variant="secondary" size="lg" block onClick={() => setArchiving("closed")}>
              {t.archiveKeep}
            </Button>
            <Button variant="secondary" size="lg" block onClick={onArchive}>
              {t.archiveConfirm}
            </Button>
          </div>
        </BottomSheet>
      )}
    </form>
  );
}
