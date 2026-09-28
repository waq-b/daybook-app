interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  /** Names the group for screen readers ("Order", "How did it go?"). */
  label: string;
  options: Array<Option<T>>;
  value: T | null;
  onChange: (value: T) => void;
}

/**
 * Canvas-only (DESIGN.md §5): 2–3 options on a paper-sunk track; the
 * selected segment is paper-raised with an ink border. A group of pressed
 * buttons, 44px targets.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div
      className="db-segmented"
      role="group"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="db-segment"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
