import { useId, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { copy } from "../copy";

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> {
  label: string;
  /** Section-sized label (board SessionEdit's "Session notes") instead of the field label. */
  heading?: boolean;
  optional?: boolean;
  /** Smaller, muted label (board SessionEdit's "Anything else, not a practice yet"). */
  quietLabel?: boolean;
}

/**
 * Canvas-only component (DESIGN.md §5): label above, paper-raised, 1.5px
 * line-strong border, radius-md. Grows with its text; never scrolls inside.
 */
export function TextArea({ label, heading, optional, quietLabel, rows = 4, ...area }: Props) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 3}px`; // + the 1.5px borders
  }, [area.value]);

  const labelClass = heading ? "t-heading" : quietLabel ? "db-field-label-quiet" : "db-field-label";
  return (
    <div className="db-field">
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="db-field-optional"> {copy.fields.optional}</span>}
      </label>
      <textarea id={id} ref={ref} rows={rows} className="db-field-input db-textarea" {...area} />
    </div>
  );
}
