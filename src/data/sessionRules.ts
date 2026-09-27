// What the Sessions screens derive from the rows (plan 0b). Pure, so it's
// tested with fixed clocks; nothing here touches the network.
import type { Tables } from "../lib/database.types";
import { addDays, calendarDaysBetween, startOfDay } from "./dates";

export type Session = Tables<"sessions">;

const at = (s: Pick<Session, "at">) => new Date(s.at);

export interface SplitSessions {
  /** The earliest session not done and not before today: the teal card. */
  next: Session | null;
  /** Other sessions after `next`, soonest first. */
  later: Session[];
  /** Everything else, newest first. */
  past: Session[];
}

export function splitSessions(sessions: Session[], now: Date): SplitSessions {
  const today = startOfDay(now);
  const live = sessions.filter((s) => !s.archived_at);
  const upcoming = live
    .filter((s) => !s.done_at && at(s) >= today)
    .sort((a, b) => at(a).getTime() - at(b).getTime());
  const [next = null, ...later] = upcoming;
  const past = live
    .filter((s) => !upcoming.includes(s))
    .sort((a, b) => at(b).getTime() - at(a).getTime());
  return { next, later, past };
}

export type Countdown = { kind: "today" } | { kind: "tomorrow" } | { kind: "days"; days: number };

/** The next-session card's number: calendar days, not 24-hour blocks. */
export function countdown(session: Pick<Session, "at">, now: Date): Countdown {
  const days = calendarDaysBetween(now, at(session));
  if (days <= 0) return { kind: "today" };
  if (days === 1) return { kind: "tomorrow" };
  return { kind: "days", days };
}

/**
 * Plan 0b D4: the next date after today on the most recent session's weekday,
 * at its time. Null for a first-ever session (the form starts blank).
 */
export function defaultNewSession(sessions: Session[], now: Date): Date | null {
  const latest = sessions
    .filter((s) => !s.archived_at)
    .sort((a, b) => at(b).getTime() - at(a).getTime())[0];
  if (!latest) return null;
  const last = at(latest);
  const today = startOfDay(now);
  for (let i = 1; i <= 7; i++) {
    const day = addDays(today, i);
    if (day.getDay() === last.getDay()) {
      return new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        last.getHours(),
        last.getMinutes(),
      );
    }
  }
  return null; // unreachable: one of the next seven days has the weekday
}

/** Plan 0b D6: today's session, or an earlier one, that isn't done yet. */
export function canMarkDone(session: Pick<Session, "at" | "done_at">, now: Date): boolean {
  return !session.done_at && startOfDay(at(session)) <= startOfDay(now);
}

export type SessionStatus = "today" | "upcoming" | "done" | "past";

/** The detail badge. "past" is an earlier session nobody marked done. */
export function sessionStatus(session: Pick<Session, "at" | "done_at">, now: Date): SessionStatus {
  if (session.done_at) return "done";
  const days = calendarDaysBetween(now, at(session));
  if (days === 0) return "today";
  return days > 0 ? "upcoming" : "past";
}

/** Plan 0b D2: a past row's title is the first line of its notes. */
export function rowTitle(session: Pick<Session, "notes">): string | null {
  const line = session.notes
    ?.split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  return line ?? null;
}
