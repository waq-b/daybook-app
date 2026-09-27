import { describe, expect, it } from "vitest";
import {
  canMarkDone,
  countdown,
  defaultNewSession,
  rowTitle,
  sessionStatus,
  splitSessions,
  type Session,
} from "./sessionRules";

let n = 0;
function session(at: Date, extra: Partial<Session> = {}): Session {
  n += 1;
  return {
    id: `s${n}`,
    user_id: "u",
    created_at: at.toISOString(),
    updated_at: at.toISOString(),
    archived_at: null,
    at: at.toISOString(),
    notes: null,
    anything_else: null,
    assigned_note: null,
    done_at: null,
    ...extra,
  };
}

// Saturday 26 September 2026, 10am.
const NOW = new Date(2026, 8, 26, 10, 0);

describe("splitSessions", () => {
  it("puts the earliest not-done session from today on as next, later ones after it, the rest in past", () => {
    const old = session(new Date(2026, 8, 15, 16), { done_at: "2026-09-15T17:00:00Z" });
    const forgot = session(new Date(2026, 8, 22, 16)); // earlier, never marked done
    const next = session(new Date(2026, 8, 29, 16));
    const later = session(new Date(2026, 9, 6, 16));
    const archived = session(new Date(2026, 8, 28, 16), { archived_at: "2026-09-20T00:00:00Z" });
    const split = splitSessions([later, old, next, archived, forgot], NOW);
    expect(split.next?.id).toBe(next.id);
    expect(split.later.map((s) => s.id)).toEqual([later.id]);
    expect(split.past.map((s) => s.id)).toEqual([forgot.id, old.id]);
  });

  it("keeps today's session as next even after its time, until it's marked done", () => {
    const earlierToday = session(new Date(2026, 8, 26, 8));
    expect(splitSessions([earlierToday], NOW).next?.id).toBe(earlierToday.id);
    const done = session(new Date(2026, 8, 26, 8), { done_at: "2026-09-26T09:00:00Z" });
    const split = splitSessions([done], NOW);
    expect(split.next).toBeNull();
    expect(split.past.map((s) => s.id)).toEqual([done.id]);
  });

  it("is empty with nothing", () => {
    expect(splitSessions([], NOW)).toEqual({ next: null, later: [], past: [] });
  });
});

describe("countdown", () => {
  it.each([
    [new Date(2026, 8, 26, 18), { kind: "today" }],
    [new Date(2026, 8, 27, 9), { kind: "tomorrow" }],
    [new Date(2026, 8, 29, 16), { kind: "days", days: 3 }],
  ])("%s", (at, expected) => {
    expect(countdown(session(at), NOW)).toEqual(expected);
  });

  it("counts calendar days across the October clock change", () => {
    expect(countdown(session(new Date(2026, 9, 27, 16)), new Date(2026, 9, 24, 20))).toEqual({
      kind: "days",
      days: 3,
    });
  });
});

describe("defaultNewSession", () => {
  it("is blank for a first-ever session", () => {
    expect(defaultNewSession([], NOW)).toBeNull();
  });

  it("is the next date after today on the last session's weekday, at its time", () => {
    const tuesday4pm = session(new Date(2026, 8, 22, 16, 0));
    expect(defaultNewSession([tuesday4pm], NOW)).toEqual(new Date(2026, 8, 29, 16, 0));
  });

  it("goes a full week on when today is that weekday", () => {
    const saturday = session(new Date(2026, 8, 19, 11, 30));
    expect(defaultNewSession([saturday], NOW)).toEqual(new Date(2026, 9, 3, 11, 30));
  });

  it("uses the most recent session, done or not", () => {
    const olderTue = session(new Date(2026, 8, 8, 16), { done_at: "2026-09-08T17:00:00Z" });
    const newerThu = session(new Date(2026, 8, 24, 9, 15));
    expect(defaultNewSession([olderTue, newerThu], NOW)).toEqual(new Date(2026, 9, 1, 9, 15));
  });

  it("keeps the local time across the clock change", () => {
    const tueBst = session(new Date(2026, 9, 20, 16, 0));
    expect(defaultNewSession([tueBst], new Date(2026, 9, 21, 12))).toEqual(
      new Date(2026, 9, 27, 16, 0),
    );
  });
});

describe("canMarkDone and sessionStatus", () => {
  it("allows today and earlier, never later, never twice", () => {
    expect(canMarkDone(session(new Date(2026, 8, 26, 18)), NOW)).toBe(true);
    expect(canMarkDone(session(new Date(2026, 8, 22, 16)), NOW)).toBe(true);
    expect(canMarkDone(session(new Date(2026, 8, 27, 9)), NOW)).toBe(false);
    expect(canMarkDone(session(new Date(2026, 8, 22), { done_at: "x" }), NOW)).toBe(false);
  });

  it("names the badge", () => {
    expect(sessionStatus(session(new Date(2026, 8, 26, 18)), NOW)).toBe("today");
    expect(sessionStatus(session(new Date(2026, 8, 29, 16)), NOW)).toBe("upcoming");
    expect(sessionStatus(session(new Date(2026, 8, 22, 16)), NOW)).toBe("past");
    expect(sessionStatus(session(new Date(2026, 8, 29), { done_at: "x" }), NOW)).toBe("done");
  });
});

describe("rowTitle", () => {
  it("is the first non-empty line of the notes", () => {
    expect(rowTitle({ notes: "\n  Bus is done.  \nKeep coffee going" })).toBe("Bus is done.");
  });
  it("is null with no notes", () => {
    expect(rowTitle({ notes: null })).toBeNull();
    expect(rowTitle({ notes: "  \n " })).toBeNull();
  });
});
