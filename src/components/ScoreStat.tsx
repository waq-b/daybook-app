import { copy } from "../copy";

/** A worksheet score as a header stat: caps label, num-lg number, its ramp strip ("–" and grey before there's one). */
export function ScoreStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="task-stat">
      <span className="t-label task-stat-label">{label}</span>
      <span className="t-num-lg">{value ?? copy.taskDetail.noScore}</span>
      <span
        className="task-stat-strip"
        style={{ background: value === null ? "var(--line)" : `var(--difficulty-${value})` }}
        aria-hidden="true"
      />
    </div>
  );
}
