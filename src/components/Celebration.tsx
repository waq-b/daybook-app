import { copy } from "../copy";
import type { ReactNode } from "react";

interface Props {
  heading: string;
  line?: string;
  /** "7 → 2": predicted to remaining, in num-lg. */
  from?: number;
  to?: number;
  children?: ReactNode;
}

/**
 * Canvas-only (DESIGN.md §5): one apricot-tint wash, the numbers in num-lg,
 * a 200ms fade and nothing else. States the fact; doesn't cheer.
 */
export function Celebration({ heading, line, from, to, children }: Props) {
  return (
    <div className="db-celebration" role="status">
      <p className="t-heading db-celebration-heading">{heading}</p>
      {line && <p className="db-celebration-line">{line}</p>}
      {from !== undefined && to !== undefined && (
        <p className="t-num-lg db-celebration-numbers">{copy.controls.fromTo(from, to)}</p>
      )}
      {children}
    </div>
  );
}
