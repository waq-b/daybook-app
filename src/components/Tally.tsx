import { copy } from "../copy";

interface Props {
  marks: Array<"rep" | "attempt">;
  /** "4" or "4 + 1" (plan 0c D6). */
  text: string;
}

/**
 * Canvas-only (DESIGN.md §5): a solid 4×18 mark per rep and a hollow one per
 * "started, left early", in the order they happened, then the count.
 */
export function Tally({ marks, text }: Props) {
  const reps = marks.filter((m) => m === "rep").length;
  const attempts = marks.length - reps;
  return (
    <span
      className="db-tally-standalone"
      role="img"
      aria-label={copy.controls.tallyLabel(reps, attempts)}
    >
      <span className="db-tally-marks" aria-hidden="true">
        {marks.map((m, i) => (
          <span key={i} className={`db-tally-mark is-${m}`} />
        ))}
      </span>
      <span className="t-label db-tally-count" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
