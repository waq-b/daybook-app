import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { dateBlock, formatLongDate, formatTime } from "../data/dates";
import { countdown, rowTitle, splitSessions, type Session } from "../data/sessionRules";
import { listSessions } from "../data/sessions";
import { sessionHref } from "./links";

const { Button, EmptyState, Icon } = Daybook;
const t = copy.sessions;

type Load =
  { state: "loading" } | { state: "ready"; sessions: Session[] } | { state: "offline" | "failed" };

function NextCard({ session, now }: { session: Session; now: Date }) {
  const at = new Date(session.at);
  const c = countdown(session, now);
  const date = formatLongDate(at);
  const time = formatTime(at);
  const when = c.kind === "today" ? t.today : c.kind === "tomorrow" ? t.tomorrow : t.inDays(c.days);
  return (
    <Link
      to={sessionHref(session.id)}
      className="next-card"
      aria-label={t.nextLabel(date, time, when)}
    >
      <span className="next-card-text" aria-hidden="true">
        <span className="t-label next-card-label">{t.next}</span>
        <span className="t-title">{date}</span>
        <span className="next-card-time">{time}</span>
      </span>
      <span className="next-card-count" aria-hidden="true">
        {c.kind === "days" ? (
          <>
            <span className="t-num-lg">{c.days}</span>
            <span className="next-card-unit">{t.days}</span>
          </>
        ) : (
          <span className="t-heading">{c.kind === "today" ? t.today : t.tomorrow}</span>
        )}
      </span>
      {/* The flagged pill and the teal Prepare button arrive in 0d. */}
    </Link>
  );
}

function SessionRow({ session, showStatus }: { session: Session; showStatus: boolean }) {
  const at = new Date(session.at);
  const block = dateBlock(at);
  const time = formatTime(at);
  return (
    <Link to={sessionHref(session.id)} className="session-row">
      <span className="session-row-date">
        <span className="t-num-md">{block.day}</span>
        <span className="t-label session-row-month">{block.month}</span>
      </span>
      <span className="session-row-text">
        <span className="session-row-title">{rowTitle(session) ?? t.noNotes}</span>
        <span className="session-row-meta">
          {showStatus ? t.rowMeta(time, session.done_at ? t.markedDone : t.notMarkedDone) : time}
        </span>
      </span>
      <Icon name="chevron-right" />
    </Link>
  );
}

/** Boards Sessions (filled) and SessionsEmpty. Reading needs the network (CLAUDE.md line 12). */
export function SessionsScreen() {
  const navigate = useNavigate();
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    let live = true;
    void listSessions().then((result) => {
      if (live)
        setLoad(result.ok ? { state: "ready", sessions: result.data } : { state: result.reason });
    });
    return () => {
      live = false;
    };
  }, []);

  const now = new Date();
  const split = load.state === "ready" ? splitSessions(load.sessions, now) : null;
  const empty =
    split !== null && !split.next && split.later.length === 0 && split.past.length === 0;

  return (
    <main className="screen sessions">
      <h1 className="t-title-lg screen-title">{t.title}</h1>

      {(load.state === "offline" || load.state === "failed") && (
        <p className="sessions-note" role="status">
          {load.state === "offline" ? t.offline : t.failed}
        </p>
      )}

      {empty && (
        <div className="sessions-empty">
          <EmptyState icon="nav-sessions" title={t.emptyTitle} body={t.emptyBody} />
        </div>
      )}

      {split?.next && <NextCard session={split.next} now={now} />}

      {split && split.later.length > 0 && (
        <section className="sessions-group">
          <h2 className="t-heading sessions-h">{t.later}</h2>
          {split.later.map((s) => (
            <SessionRow key={s.id} session={s} showStatus={false} />
          ))}
        </section>
      )}

      {split && split.past.length > 0 && (
        <section className="sessions-group">
          <h2 className="t-heading sessions-h">{t.past}</h2>
          {split.past.map((s) => (
            <SessionRow key={s.id} session={s} showStatus />
          ))}
        </section>
      )}

      {load.state === "ready" && (
        <div className="sessions-bar">
          {empty ? (
            <Button variant="primary" size="lg" block onClick={() => navigate("/sessions/new")}>
              {t.addFirst}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              block
              icon="plus"
              onClick={() => navigate("/sessions/new")}
            >
              {t.add}
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
