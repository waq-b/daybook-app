// Calendar arithmetic in the phone's own time zone. Days are counted by
// calendar date, never as 24-hour blocks, so the clock changes in March and
// October don't shift "3 days" or a default time.

/** Midnight at the start of `d`'s local day. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function calendarDaysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** The same local date plus `days`, keeping the local time of day. */
export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes());
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Tuesday 29 September" (British order, no comma). */
export function formatLongDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Tuesday" */
export function weekdayName(d: Date): string {
  return WEEKDAYS[d.getDay()]!;
}

/** "4pm", "4:30pm", "12pm", "12:15am" (the canvas's style). */
export function formatTime(
  d: Date,
  { minutes = "auto" }: { minutes?: "auto" | "always" } = {},
): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? "am" : "pm";
  if (m === 0 && minutes === "auto") return `${hour12}${suffix}`;
  return `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

/** "15" and "SEP" for a list row's date block. */
export function dateBlock(d: Date): { day: string; month: string } {
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()]!.slice(0, 3).toUpperCase() };
}

/** yyyy-mm-dd and hh:mm, the values native date and time inputs use. */
export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toTimeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** A local date and time from native input values, or null if either is missing. */
export function fromInputs(date: string, time: string): Date | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})/.exec(time);
  if (!dm || !tm) return null;
  return new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]));
}

/** Monday 00:00 of the local week containing `d` (weeks roll over on Monday). */
export function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const back = (day.getDay() + 6) % 7; // Monday → 0 … Sunday → 6
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - back);
}

/** "12 Sep" */
export function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]!.slice(0, 3)}`;
}

/** "Tue 1 Sep, 18:10" for an entry's time (24-hour, as on the rep cards). */
export function formatEntryTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${WEEKDAYS[d.getDay()]!.slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]!.slice(0, 3)}, ${hh}:${mm}`;
}

/**
 * When something last happened, for "Last logged …": "today", "yesterday",
 * a weekday within the last week, otherwise "12 Sep".
 */
export function relativeDay(d: Date, now: Date): string {
  const days = calendarDaysBetween(d, now);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return WEEKDAYS[d.getDay()]!;
  return formatShortDate(d);
}

/** A target date: "Wed" within the coming week, otherwise "30 Oct". */
export function shortTarget(d: Date, now: Date): string {
  const days = calendarDaysBetween(now, d);
  if (days >= 0 && days < 7) return WEEKDAYS[d.getDay()]!.slice(0, 3);
  return formatShortDate(d);
}

/** yyyy-mm-dd (a date column) as a local date at midnight. */
export function fromDateColumn(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
