import { describe, expect, it } from "vitest";
import {
  buildLadder,
  celebrates,
  chartStory,
  completedAt,
  confirmation,
  highRungNote,
  isDone,
  lastLoggedAt,
  latestRemaining,
  nextRepNumber,
  practiceCounts,
  practiceWeek,
  quickPicks,
  repsOf,
  tally,
  tallyText,
  thisWeek,
  whereItLands,
  type Rep,
  type Task,
} from "./ladderRules";

let n = 0;
function task(name: string, predicted: number, extra: Partial<Task> = {}): Task {
  n += 1;
  const stamp = new Date(2026, 7, 1, 12, n).toISOString();
  return {
    id: `t${n}`,
    user_id: "u",
    created_at: stamp,
    updated_at: stamp,
    archived_at: null,
    practice_id: "p",
    name,
    predicted,
    repeating: false,
    reps_per_week: null,
    target_date: null,
    notes: null,
    completed_at: null,
    comments: null,
    next_prediction: null,
    next_prediction_likelihood: null,
    ...extra,
  };
}
function rep(t: Task, at: Date, actual: number, remaining: number, extra: Partial<Rep> = {}): Rep {
  n += 1;
  return {
    id: `r${n}`,
    user_id: "u",
    created_at: at.toISOString(),
    updated_at: at.toISOString(),
    archived_at: null,
    task_id: t.id,
    at: at.toISOString(),
    actual,
    remaining,
    left_early: false,
    coping: [],
    note: null,
    prediction: null,
    prediction_likelihood: null,
    prediction_outcome: null,
    flagged: false,
    ...extra,
  };
}
const day = (d: number, h = 18) => new Date(2026, 8, d, h); // September 2026

describe("done and remaining (D2)", () => {
  const gym = task("Gym", 7);
  it("is the latest full rep's remaining", () => {
    const reps = [rep(gym, day(1), 8, 7), rep(gym, day(3), 6, 5)];
    expect(latestRemaining(reps)).toBe(5);
    expect(isDone(reps)).toBe(false);
  });
  it("a left-early attempt doesn't finish a rung, even at 3", () => {
    const reps = [rep(gym, day(1), 6, 5), rep(gym, day(3), 4, 3, { left_early: true })];
    expect(latestRemaining(reps)).toBe(5);
    expect(isDone(reps)).toBe(false);
  });
  it("4 is not done; 3 is", () => {
    expect(isDone([rep(gym, day(1), 5, 4)])).toBe(false);
    expect(isDone([rep(gym, day(1), 5, 3)])).toBe(true);
  });
  it("no reps: nothing to show, not done", () => {
    expect(latestRemaining([])).toBeNull();
    expect(isDone([])).toBe(false);
  });
});

describe("date completed (D4)", () => {
  const coffee = task("Coffee", 5);
  it("is the rep that took it under 4", () => {
    const reps = [rep(coffee, day(5), 6, 5), rep(coffee, day(9), 5, 3), rep(coffee, day(20), 4, 2)];
    expect(completedAt(reps)).toEqual(day(9));
  });
  it("moves if it went back over 4 and came down again", () => {
    const reps = [
      rep(coffee, day(5), 5, 3),
      rep(coffee, day(9), 6, 5),
      rep(coffee, day(20), 4, 3),
      rep(coffee, day(26), 4, 2),
    ];
    expect(completedAt(reps)).toEqual(day(20));
  });
  it("ignores attempts, and is null when not done", () => {
    const reps = [rep(coffee, day(5), 5, 3), rep(coffee, day(6), 7, 6, { left_early: true })];
    expect(completedAt(reps)).toEqual(day(5));
    expect(completedAt([rep(coffee, day(5), 5, 4)])).toBeNull();
  });
});

describe("tally, week, rep number (D6–D8)", () => {
  const gym = task("Gym", 7);
  const reps = [
    rep(gym, day(1), 8, 7),
    rep(gym, day(3), 7, 6),
    rep(gym, day(7), 7, 7, { left_early: true }),
    rep(gym, day(17), 6, 5),
    rep(gym, day(22), 5, 5),
  ];
  it("keeps the order and reads 4 + 1", () => {
    const t = tally(reps);
    expect(t.marks).toEqual(["rep", "rep", "attempt", "rep", "rep"]);
    expect(tallyText(t)).toBe("4 + 1");
    expect(tallyText({ reps: 3, attempts: 0 })).toBe("3");
  });
  it("counts this week from Monday, attempts included", () => {
    // Tue 22 Sep; Monday was 21 Sep.
    const week = [...reps, rep(gym, day(21, 9), 6, 6, { left_early: true })];
    expect(thisWeek(week, day(22, 20))).toEqual({ count: 2, leftEarly: 1 });
    expect(thisWeek(week, day(28, 9))).toEqual({ count: 0, leftEarly: 0 }); // new week, no reset message needed
  });
  it("numbers the next rep counting attempts", () => {
    expect(nextRepNumber(reps)).toBe(6);
  });
  it("sorts a task's reps oldest first and leaves out other tasks'", () => {
    const other = task("Other", 3);
    const mixed = [reps[2]!, rep(other, day(2), 3, 2), reps[0]!];
    expect(repsOf(gym, mixed).map((r) => r.at)).toEqual([reps[0]!.at, reps[2]!.at]);
  });
});

describe("the ladder", () => {
  const gig = task("Gig", 8);
  const phone = task("Phone the dentist", 7);
  const gym = task("Gym", 7, { repeating: true, reps_per_week: 4 });
  const shop = task("Big shop", 6, { repeating: true, reps_per_week: 1 });
  const coffee = task("Coffee", 5, { repeating: true, reps_per_week: 2 });
  const bus = task("Bus", 5);
  const walk = task("Walk", 3);
  const archived = task("Old", 2, { archived_at: "2026-09-01T00:00:00Z" });
  const reps = [
    rep(gym, day(22), 5, 5),
    rep(shop, day(19), 5, 4),
    rep(coffee, day(24), 5, 4),
    rep(bus, day(12), 3, 2),
    rep(walk, day(29 - 31 + 31), 1, 1), // 29 Sep
  ];
  const tasks = [gig, phone, gym, shop, coffee, bus, walk, archived];

  it("easiest first puts the lowest predicted first (ties by order added); done sit apart, newest first", () => {
    const l = buildLadder(tasks, reps, "easiest", day(29, 20));
    expect(l.active.map((r) => r.task.name)).toEqual([
      "Coffee",
      "Big shop",
      "Phone the dentist",
      "Gym",
      "Gig",
    ]);
    expect(l.done.map((r) => r.task.name)).toEqual(["Walk", "Bus"]);
  });

  it("hardest first reverses the active rungs only", () => {
    const l = buildLadder(tasks, reps, "hardest", day(29, 20));
    expect(l.active.map((r) => r.task.name)).toEqual([
      "Gig",
      "Phone the dentist",
      "Gym",
      "Big shop",
      "Coffee",
    ]);
    expect(l.done.map((r) => r.task.name)).toEqual(["Walk", "Bus"]);
  });

  it("gives the practice card its counts and weekly target (capped per rung)", () => {
    const l = buildLadder(
      tasks,
      [
        ...reps,
        rep(coffee, day(28), 5, 4),
        rep(coffee, day(28, 19), 5, 4),
        rep(coffee, day(28, 20), 5, 4),
      ],
      "easiest",
      day(29, 20),
    );
    expect(practiceCounts(l)).toEqual({ onTheGo: 5, done: 2 });
    // Week of Mon 28 Sep: coffee 3 (capped at 2), gym 0 of 4, shop 0 of 1.
    expect(practiceWeek(l)).toEqual({ done: 2, of: 7 });
  });

  it("has no weekly target when nothing repeats", () => {
    expect(practiceWeek(buildLadder([phone], [], "easiest", day(29)))).toBeNull();
  });
});

describe("where it lands and the high-rung note", () => {
  const active = [
    task("Coffee", 5),
    task("Big shop", 6),
    task("Gym", 7),
    task("Phone", 7),
    task("Gig", 8),
  ];
  it("slots the new task after any at the same score", () => {
    expect(whereItLands(active, { predicted: 7, name: "New" }).map((r) => r.name)).toEqual([
      "Coffee",
      "Big shop",
      "Gym",
      "Phone",
      "New",
      "Gig",
    ]);
    expect(whereItLands(active, { predicted: 2, name: "New" })[0]).toEqual({
      predicted: 2,
      name: "New",
      isNew: true,
    });
    expect(whereItLands([], { predicted: 4, name: "New" })).toHaveLength(1);
  });

  it("notes a high rung with nothing done one or two below (D13)", () => {
    expect(highRungNote(8, { done: [] })).toEqual({ low: 6, high: 7 });
    expect(highRungNote(5, { done: [] })).toBeNull();
    const done7 = buildLadder([task("Seven", 7)], [], "easiest", day(1));
    const withSevenDone = { done: [{ ...done7.active[0]!, done: true }] };
    expect(highRungNote(8, withSevenDone)).toBeNull();
    expect(highRungNote(6, withSevenDone)).toEqual({ low: 4, high: 5 });
  });
});

describe("after a rep", () => {
  it("celebrates exactly as the board's rule (D18)", () => {
    const base = {
      leftEarly: false,
      actual: 7,
      remaining: 5,
      predicted: 7,
      outcome: null,
    } as const;
    expect(celebrates(base)).toBe(false);
    expect(celebrates({ ...base, actual: 5 })).toBe(true); // easier than predicted
    expect(celebrates({ ...base, remaining: 3 })).toBe(true); // rung done
    expect(celebrates({ ...base, outcome: "no" })).toBe(true); // feared prediction didn't happen
    expect(celebrates({ ...base, outcome: "a_bit" })).toBe(false);
    expect(celebrates({ ...base, leftEarly: true, actual: 3, remaining: 2 })).toBe(false);
    expect(celebrates({ ...base, leftEarly: true, outcome: "no" })).toBe(true);
  });

  it("picks the confirmation line in the board's order", () => {
    expect(confirmation({ leftEarly: true, remaining: 2 })).toBe("leftEarly");
    expect(confirmation({ leftEarly: false, remaining: 3 })).toBe("done");
    expect(confirmation({ leftEarly: false, remaining: 4 })).toBe("logged");
  });
});

describe("chart story, picks, last logged", () => {
  const gym = task("Gym", 7);
  it("tells first and latest (D21)", () => {
    expect(chartStory(7, [])).toBeNull();
    const reps = [rep(gym, day(1), 8, 7), rep(gym, day(3), 7, 6), rep(gym, day(22), 5, 5)];
    expect(chartStory(7, reps)).toEqual({
      predicted: 7,
      first: 8,
      latest: 5,
      fromRemaining: 7,
      toRemaining: 5,
      count: 3,
    });
  });

  it("offers your own picks, most used first (D17)", () => {
    const reps = [
      rep(gym, day(1), 7, 6, { coping: ["Earphones in", "Stayed near the door"] }),
      rep(gym, day(3), 7, 6, { coping: ["Earphones in"] }),
      rep(gym, day(5), 7, 6, { coping: ["Went with someone", " "] }),
    ];
    expect(quickPicks(reps)).toEqual(["Earphones in", "Went with someone", "Stayed near the door"]);
    expect(quickPicks([])).toEqual([]);
  });

  it("knows when anything was last logged", () => {
    expect(lastLoggedAt([])).toBeNull();
    expect(lastLoggedAt([rep(gym, day(3), 7, 6), rep(gym, day(22), 5, 5)])).toEqual(day(22));
  });
});
