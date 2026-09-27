import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { DateTimeField } from "../components/DateTimeField";
import { TextArea } from "../components/TextArea";
import { fromInputs, toDateInput, toTimeInput, weekdayName } from "../data/dates";
import { defaultNewSession } from "../data/sessionRules";
import { createSession, getSession, listSessions, updateSession } from "../data/sessions";
import { sessionHref } from "./links";

const { Button, Icon } = Daybook;
const t = copy.sessionEdit;

type Load = "loading" | "ready" | "offline" | "missing";
type Status = "idle" | "saving" | "offline" | "failed";

/** Empty text is stored as null, not "". */
const orNull = (text: string) => (text.trim() ? text.trim() : null);

/**
 * Boards SessionEdit (new, /sessions/new) and SessionEditPast (edit,
 * /sessions/:id/edit). Saving needs a connection (plan 0b D5); the form keeps
 * everything until Supabase confirms.
 */
export function SessionEditScreen() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [load, setLoad] = useState<Load>("loading");
  const [hint, setHint] = useState<string | null>(null);
  const [when, setWhen] = useState({ date: "", time: "" });
  const [notes, setNotes] = useState("");
  const [assignedNote, setAssignedNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let live = true;
    const fill = (at: Date | null) =>
      setWhen(at ? { date: toDateInput(at), time: toTimeInput(at) } : { date: "", time: "" });

    if (id) {
      void getSession(id).then((result) => {
        if (!live) return;
        if (!result.ok) return setLoad("offline");
        if (!result.data) return setLoad("missing");
        fill(new Date(result.data.at));
        setNotes(result.data.notes ?? "");
        setAssignedNote(result.data.assigned_note ?? "");
        setLoad("ready");
      });
    } else {
      // A new session is set from the last one (D4). Offline, it just starts blank.
      void listSessions().then((result) => {
        if (!live) return;
        const suggested = result.ok ? defaultNewSession(result.data, new Date()) : null;
        fill(suggested);
        setHint(suggested ? t.hintDefault(weekdayName(suggested)) : t.hintFirst);
        setLoad("ready");
      });
    }
    return () => {
      live = false;
    };
  }, [id]);

  const at = fromInputs(when.date, when.time);
  const saving = status === "saving";
  const closeTo = id ? sessionHref(id) : "/sessions";

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!at || saving) return;
    setStatus("saving");
    const fields = {
      at: at.toISOString(),
      notes: orNull(notes),
      assigned_note: orNull(assignedNote),
    };
    const result = id ? await updateSession(id, fields) : await createSession(fields);
    if (!result.ok) return setStatus(result.reason);
    navigate(sessionHref(result.data.id), { replace: true });
  }

  if (load === "loading") return null;
  if (load === "offline" || load === "missing") {
    return (
      <main className="screen session-edit">
        <p className="session-edit-note" role="status">
          {load === "offline" ? t.loadOffline : t.notFound}
        </p>
        <Link to="/sessions" className="session-edit-back">
          {t.backToSessions}
        </Link>
      </main>
    );
  }

  const note = status === "offline" ? t.offline : status === "failed" ? t.failed : null;

  return (
    <form className="screen session-edit" onSubmit={onSave} noValidate>
      <header className="session-edit-header">
        <Link to={closeTo} className="session-edit-close" aria-label={t.close}>
          <Icon name="close" />
        </Link>
        <h1 className="t-title session-edit-title">{editing ? t.editTitle : t.newTitle}</h1>
      </header>

      <section className="session-edit-section" aria-labelledby="when-h">
        <h2 id="when-h" className="t-heading session-edit-h">
          {t.when}
        </h2>
        <DateTimeField date={when.date} time={when.time} onChange={setWhen} />
        {!editing && hint && <p className="session-edit-hint">{hint}</p>}
      </section>

      <section className="session-edit-section">
        <TextArea
          heading
          label={t.notesLabel}
          placeholder={t.notesPlaceholder}
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <section className="session-edit-section" aria-labelledby="assigned-h">
        <h2 id="assigned-h" className="t-heading session-edit-h">
          {t.assignedHeading}
        </h2>
        {/* Practice chips and "Add a practice" arrive in 0c. */}
        <TextArea
          quietLabel
          optional
          label={t.assignedNoteLabel}
          placeholder={t.assignedNotePlaceholder}
          rows={1}
          value={assignedNote}
          onChange={(e) => setAssignedNote(e.target.value)}
        />
      </section>

      <div className="session-edit-bar">
        {note && (
          <p className="session-edit-note" role="status">
            {note}
          </p>
        )}
        <Button variant="primary" size="lg" block type="submit" disabled={!at || saving}>
          {saving ? t.saving : at ? t.save : t.saveNeedsWhen}
        </Button>
      </div>
    </form>
  );
}
