import type { ReactNode } from "react";
import { Daybook } from "../design/daybook";

const { Icon } = Daybook;

/**
 * Canvas-only component (DESIGN.md §5): teal info banner. teal-tint
 * background, teal icon, small text. For soft hints, never warnings.
 */
export function Note({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="db-note" role="status">
      <span className="db-note-icon" aria-hidden="true">
        <Icon name="info" size={20} />
      </span>
      <span className="db-note-text">{children}</span>
      {action && <span className="db-note-action">{action}</span>}
    </div>
  );
}
