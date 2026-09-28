import { useId } from "react";
import { copy } from "../copy";

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Canvas-only (DESIGN.md §5): a switch, 52×32 track in a 44px target,
 * "On"/"Off" printed beside it so it never relies on colour. On is teal.
 */
export function Toggle({ label, description, checked, onChange, disabled }: Props) {
  const id = useId();
  return (
    <div className="db-toggle-row">
      <span className="db-toggle-text">
        <span id={id} className="db-field-label">
          {label}
        </span>
        {description && <span className="db-toggle-description">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        className="db-toggle"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="db-toggle-state" aria-hidden="true">
          {checked ? copy.controls.on : copy.controls.off}
        </span>
        <span className="db-toggle-track" aria-hidden="true">
          <span className="db-toggle-knob" />
        </span>
      </button>
    </div>
  );
}
