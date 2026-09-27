import { copy } from "../copy";
import { formatLongDate, formatTime, fromInputs } from "../data/dates";

const t = copy.fields;

interface Props {
  /** yyyy-mm-dd, or "" when not picked yet. */
  date: string;
  /** hh:mm, or "" when not picked yet. */
  time: string;
  onChange: (next: { date: string; time: string }) => void;
}

function dateWords(date: string): string | null {
  const d = fromInputs(date, "00:00");
  return d ? formatLongDate(d) : null;
}

function timeWords(time: string): string | null {
  const d = fromInputs("2000-01-01", time);
  return d ? formatTime(d, { minutes: "always" }) : null;
}

/** Opens the platform's own picker where the browser needs asking (desktop Chrome). */
function openPicker(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch {
    // Some browsers only allow it from certain gestures; the tap still focuses the input.
  }
}

/**
 * Canvas-only component (DESIGN.md §5, board SessionEdit): DATE and TIME as
 * two 56px fields side by side at 1.6 : 1, each showing its value in words.
 * A native input lies over each one, so tapping opens the phone's own wheel.
 */
export function DateTimeField({ date, time, onChange }: Props) {
  const d = dateWords(date);
  const tm = timeWords(time);
  return (
    <div className="db-when">
      <label className="db-when-field">
        <span className="db-when-label">{t.date}</span>
        <span className={`db-when-value${d ? "" : " is-empty"}`}>{d ?? t.pickDate}</span>
        <input
          type="date"
          className="db-when-input"
          aria-label={d ? t.dateChange(d) : t.pickDate}
          value={date}
          onClick={(e) => openPicker(e.currentTarget)}
          onChange={(e) => onChange({ date: e.target.value, time })}
        />
      </label>
      <label className="db-when-field">
        <span className="db-when-label">{t.time}</span>
        <span className={`db-when-value${tm ? "" : " is-empty"}`}>{tm ?? t.pickTime}</span>
        <input
          type="time"
          className="db-when-input"
          aria-label={tm ? t.timeChange(tm) : t.pickTime}
          value={time}
          onClick={(e) => openPicker(e.currentTarget)}
          onChange={(e) => onChange({ date, time: e.target.value })}
        />
      </label>
    </div>
  );
}
