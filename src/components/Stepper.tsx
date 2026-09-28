import { useId } from "react";
import { copy } from "../copy";

interface Props {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** Canvas-only (DESIGN.md §5): − value +, 48px buttons, clamped (reps a week 1 to 7). */
export function Stepper({ label, hint, value, min, max, onChange }: Props) {
  const id = useId();
  return (
    <div className="db-stepper-row">
      <span className="db-stepper-text">
        <span id={id} className="db-field-label">
          {label}
        </span>
        {hint && <span className="db-stepper-hint">{hint}</span>}
      </span>
      <div className="db-stepper" role="group" aria-labelledby={id}>
        <button
          type="button"
          aria-label={copy.controls.fewer}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          {copy.controls.minus}
        </button>
        <span className="t-num-md db-stepper-value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={copy.controls.more}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          {copy.controls.plus}
        </button>
      </div>
    </div>
  );
}
