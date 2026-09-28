import type { ReactNode } from "react";
import { Daybook } from "../design/daybook";

const { Icon } = Daybook;

/** Canvas-only (DESIGN.md §5): dashed line-strong border, teal text ("+ Other", "+ Add a practice"). */
export function AddChip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="db-add-chip" onClick={onClick}>
      <Icon name="plus" size={18} />
      {children}
    </button>
  );
}
