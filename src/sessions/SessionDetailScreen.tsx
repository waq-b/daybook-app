import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { formatLongDate, formatTime } from "../data/dates";
import { canMarkDone, sessionStatus, type Session } from "../data/sessionRules";
import { getSession, markSessionDone } from "../data/sessions";

const { Button, Icon } = Daybook;
const t = copy.sessionDetail;

type Load = { state: "loading" | "offline" | "missing" } | { state: "ready"; session: Session };
type Mark = "idle" | "busy" | "offline" | "failed";

const BADGE = {
  today: { text: t.today, className: "is-today" },
  upcoming: { text: t.upcoming, className: "" },
  done: { text: t.done, className: "" },
  past: { text: t.notMarkedDone, className: "" },
} as const;

/**
 * Boards SessionDetail (today) and SessionDetailPast (done), 0b parts only:
 * flags, "Open briefing" and assigned practice cards come in 0c and 0d.
 */
export function SessionDetailScreen() {
  const { id = "" } = useParams();
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [mark, setMark] = useState<Mark>("idle");

  useEffect(() => {
    let live = true;
    void getSession(id).then((result) => {
      if (!live) return;
      if (!result.ok) return setLoad({ state: "offline" });
      setLoad(result.data ? { state: "ready", session: result.data } : { state: "missing" });
    });
    return () => {
      live = false;
    };
  }, [id]);

  if (load.state === "loading") return null;
  if (load.state !== "ready") {
    return (
      <main className="screen session-detail">
        <p className="session-detail-note" role="status">
          {load.state === "offline" ? copy.sessionEdit.loadOffline : copy.sessionEdit.notFound}
        </p>
        <Link to="/sessions" className="session-edit-back">
          {copy.sessionEdit.backToSessions}
        </Link>
      </main>
    );
  }

  const { session } = load;
  const now = new Date();
  const at = new Date(session.at);
  const badge = BADGE[sessionStatus(session, now)];
  const markable = canMarkDone(session, now);

  async function onMarkDone() {
    if (mark === "busy") return;
    setMark("busy");
    const result = await markSessionDone(session.id);
    if (!result.ok) return setMark(result.reason);
    setLoad({ state: "ready", session: result.data });
    setMark("idle");
  }

  const markLine =
    mark === "offline" ? t.markOffline : mark === "failed" ? t.markFailed : t.markNote;

  return (
    <main className={`screen session-detail${markable ? " has-bar" : ""}`}>
      <div className="session-detail-top">
        <Link to="/sessions" className="session-detail-link">
          <Icon name="back" size={20} />
          {t.back}
        </Link>
        <Link to={`/sessions/${session.id}/edit`} className="session-detail-link">
          {t.edit}
        </Link>
      </div>

      <header className="session-detail-header">
        <span className={`session-badge ${badge.className}`}>{badge.text}</span>
        <h1 className="t-title-lg session-detail-title">{formatLongDate(at)}</h1>
        <p className="session-detail-time">{formatTime(at)}</p>
      </header>

      <section className="session-detail-section">
        <h2 className="t-heading session-detail-h">{t.notes}</h2>
        {session.notes ? (
          <p className="session-detail-notes">{session.notes}</p>
        ) : (
          <p className="session-detail-muted">{t.noNotes}</p>
        )}
      </section>

      {session.assigned_note && (
        <section className="session-detail-section">
          <h2 className="t-heading session-detail-h">{t.assigned}</h2>
          {/* Assigned practice cards and "Link a practice" arrive in 0c. */}
          <p className="session-detail-assigned">{session.assigned_note}</p>
        </section>
      )}

      {/* "Flagged (n)" / "Talked through (n)" and "Open briefing" arrive in 0d. */}

      {markable && (
        <div className="session-detail-bar">
          <Button variant="primary" size="lg" block onClick={onMarkDone} disabled={mark === "busy"}>
            {mark === "busy" ? t.marking : t.markDone}
          </Button>
          <p className="session-detail-bar-note" role="status">
            {markLine}
          </p>
        </div>
      )}
    </main>
  );
}
