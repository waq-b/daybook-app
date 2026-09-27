import { describe, expect, it } from "vitest";
import {
  addDays,
  calendarDaysBetween,
  dateBlock,
  formatLongDate,
  formatTime,
  fromInputs,
  toDateInput,
  toTimeInput,
} from "./dates";

describe("time zone", () => {
  it("runs in Europe/London", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("Europe/London");
  });
});

describe("calendarDaysBetween", () => {
  it("counts calendar days, not 24-hour blocks", () => {
    expect(calendarDaysBetween(new Date(2026, 8, 26, 23, 59), new Date(2026, 8, 27, 0, 1))).toBe(1);
    expect(calendarDaysBetween(new Date(2026, 8, 26, 0, 1), new Date(2026, 8, 26, 23, 59))).toBe(0);
    expect(calendarDaysBetween(new Date(2026, 8, 29), new Date(2026, 8, 26))).toBe(-3);
  });

  it("isn't thrown by the October clock change (25 Oct 2026, a 25-hour day)", () => {
    expect(calendarDaysBetween(new Date(2026, 9, 24, 16), new Date(2026, 9, 26, 16))).toBe(2);
    expect(calendarDaysBetween(new Date(2026, 9, 25, 0, 30), new Date(2026, 9, 25, 23, 30))).toBe(
      0,
    );
  });

  it("isn't thrown by the March clock change (28 Mar 2027, a 23-hour day)", () => {
    expect(calendarDaysBetween(new Date(2027, 2, 27, 16), new Date(2027, 2, 29, 16))).toBe(2);
  });
});

describe("addDays", () => {
  it("keeps the local time across a clock change", () => {
    const d = addDays(new Date(2026, 9, 20, 16, 0), 7); // Tue 20 Oct 4pm BST → Tue 27 Oct GMT
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([27, 16, 0]);
  });
});

describe("formatting", () => {
  it("writes dates the British way", () => {
    expect(formatLongDate(new Date(2026, 8, 29))).toBe("Tuesday 29 September");
    expect(dateBlock(new Date(2026, 8, 15))).toEqual({ day: "15", month: "SEP" });
  });

  it.each([
    [16, 0, "4pm", "4:00pm"],
    [16, 30, "4:30pm", "4:30pm"],
    [12, 0, "12pm", "12:00pm"],
    [0, 15, "12:15am", "12:15am"],
    [9, 5, "9:05am", "9:05am"],
  ])("%i:%i → %s / %s", (h, m, auto, always) => {
    const d = new Date(2026, 8, 29, h, m);
    expect(formatTime(d)).toBe(auto);
    expect(formatTime(d, { minutes: "always" })).toBe(always);
  });
});

describe("native input values", () => {
  it("round-trip", () => {
    const d = new Date(2026, 9, 25, 9, 5);
    expect(toDateInput(d)).toBe("2026-10-25");
    expect(toTimeInput(d)).toBe("09:05");
    expect(fromInputs("2026-10-25", "09:05")).toEqual(d);
  });

  it("need both parts", () => {
    expect(fromInputs("", "09:05")).toBeNull();
    expect(fromInputs("2026-10-25", "")).toBeNull();
  });
});
