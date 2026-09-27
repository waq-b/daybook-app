import { useId, type InputHTMLAttributes } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  label: string;
  /**
   * "code": the large centred one-time-code field (board SignInCode).
   * "confirm": the heavy typed-word field (board SettingsDelete2).
   */
  variant?: "default" | "code" | "confirm";
}

/**
 * Canvas-only component (DESIGN.md §5): paper-raised, 1.5px border,
 * radius-md, label above. There is no error state; the action it feeds
 * explains itself instead.
 */
export function TextField({ label, variant = "default", ...input }: Props) {
  const id = useId();
  return (
    <div className="db-field">
      <label htmlFor={id} className="db-field-label">
        {label}
      </label>
      <input id={id} className={`db-field-input db-field-${variant}`} {...input} />
    </div>
  );
}
