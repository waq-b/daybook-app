import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";

const { Icon } = Daybook;

interface Props {
  /** Small caps line above the title, e.g. "Step 1 of 2". */
  label?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Canvas-only component (DESIGN.md §5): paper-raised, radius-xl top corners,
 * shadow-sheet, drag handle, safe-area padding. Escape, the scrim, or a
 * swipe down from the top of the sheet closes it with nothing saved.
 */
export function BottomSheet({ label, title, onClose, children }: Props) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const startY = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  // Swipe down from the handle or the heading to close (DESIGN.md: "Swipe down … closes it").
  const onDown = (e: PointerEvent) => {
    startY.current = e.clientY;
  };
  const onMove = (e: PointerEvent) => {
    if (startY.current !== null) setDrag(Math.max(0, e.clientY - startY.current));
  };
  const onUp = () => {
    if (drag > 80) onClose();
    startY.current = null;
    setDrag(0);
  };

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
      <section
        className="db-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      >
        <div
          className="db-sheet-grab"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <span className="db-sheet-handle" aria-hidden="true" />
          {label && <span className="t-label db-sheet-label">{label}</span>}
          <div className="db-sheet-titlebar">
            <h2 id={titleId} ref={titleRef} tabIndex={-1} className="t-title db-sheet-title">
              {title}
            </h2>
            <button
              type="button"
              className="db-sheet-close"
              aria-label={copy.sheet.close}
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
