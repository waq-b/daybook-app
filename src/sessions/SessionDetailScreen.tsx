import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { formatLongDate, formatTime } from "../data/dates";
import { canMarkDone, sessionStatus, type Session } from "../data/sessionRules";
import { getSession, markSessionDone } from "../data/sessions";
import { setPracticeSession } from "../data/practices";
import { BottomSheet } from "../components/BottomSheet";
import { ladderHref } from "../hierarchy/links";
import { useHierarchy } from "../hierarchy/store";

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
  const { loaded: hierarchy, reload: reloadPractices } = useHierarchy();
  const [linking, setLinking] = useState<"closed" | "open" | "offline">("closed");

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

  const practices = hierarchy.state === "ready" ? hierarchy.data.practices : [];
  const assigned = practices.filter((p) => p.session_id === session.id);
  const unlinked = practices.filter((p) => p.session_id !== session.id);
  const canLink = sessionStatus(session, now) === "today";

  async function link(practiceId: string) {
    const result = await setPracticeSession(practiceId, session.id);
    if (!result.ok) return setLinking("offline");
    setLinking("closed");
    reloadPractices();
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

      {(assigned.length > 0 || session.assigned_note || canLink) && (
        <section className="session-detail-section">
          <h2 className="t-heading session-detail-h">{t.assigned}</h2>
          {assigned.map((p) => (
            <Link key={p.id} to={ladderHref(p.id)} className="session-practice">
              <span className={`practice-option-tile is-${p.type}`}>
                <Icon name={`practice-${p.type}`} size={22} />
              </span>
              <span className="practice-option-text">
                <span className="practice-option-name">{p.name}</span>
                <span className="practice-option-line">{t.practiceType[p.type]}</span>
              </span>
              <Icon name="chevron-right" size={20} />
            </Link>
          ))}
          {session.assigned_note && (
            <p className="session-detail-assigned">{session.assigned_note}</p>
          )}
          {canLink && (
            <div className="session-link">
              <Button variant="quiet" icon="plus" onClick={() => setLinking("open")}>
                {t.linkPractice}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* "Flagged (n)" / "Talked through (n)" and "Open briefing" arrive in 0d. */}

      {linking !== "closed" && (
        <BottomSheet title={t.linkTitle} onClose={() => setLinking("closed")}>
          {unlinked.length === 0 && <p className="practices-sheet-lead">{t.linkNone}</p>}
          {unlinked.map((p) => (
            <button
              key={p.id}
              type="button"
              className="practice-option"
              onClick={() => void link(p.id)}
            >
              <span className={`practice-option-tile is-${p.type}`}>
                <Icon name={`practice-${p.type}`} />
              </span>
              <span className="practice-option-text">
                <span className="practice-option-name">{p.name}</span>
                <span className="practice-option-line">{t.practiceType[p.type]}</span>
              </span>
            </button>
          ))}
          {linking === "offline" && (
            <p className="practices-sheet-note" role="status">
              {t.linkOffline}
            </p>
          )}
        </BottomSheet>
      )}

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
