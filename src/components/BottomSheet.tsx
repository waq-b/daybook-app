import { useEffect, useId, useRef, type ReactNode } from "react";

interface Props {
  /** Small caps line above the title, e.g. "Step 1 of 2". */
  label?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Canvas-only component (DESIGN.md §5): paper-raised, radius-xl top corners,
 * shadow-sheet, drag handle, safe-area padding. Escape or the scrim closes it.
 */
export function BottomSheet({ label, title, onClose, children }: Props) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="db-sheet-layer">
      <div className="db-sheet-scrim" aria-hidden="true" onClick={onClose} />
      <section className="db-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <span className="db-sheet-handle" aria-hidden="true" />
        {label && <span className="t-label db-sheet-label">{label}</span>}
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className="t-title db-sheet-title">
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
