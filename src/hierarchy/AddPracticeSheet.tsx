import { useState } from "react";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { BottomSheet } from "../components/BottomSheet";
import { createPractice, type Practice } from "../data/practices";

const { Icon } = Daybook;
const t = copy.practices;

/**
 * Board PracticesPicker: "Add a practice". Activity hierarchy only for now
 * (plan 0c D10); with one already there, the option picks that one (D11).
 * `onPicked` gets the practice, new or existing.
 */
export function AddPracticeSheet({
  existing,
  onPicked,
  onClose,
}: {
  existing: Practice[];
  onPicked: (practice: Practice, isNew: boolean) => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState<"idle" | "busy" | "offline" | "failed">("idle");
  const hierarchy = existing.find((p) => p.type === "hierarchy");

  async function onHierarchy() {
    if (hierarchy) return onPicked(hierarchy, false);
    setAdding("busy");
    const result = await createPractice({
      id: crypto.randomUUID(),
      type: "hierarchy",
      name: t.hierarchyName,
    });
    if (!result.ok) return setAdding(result.reason);
    setAdding("idle");
    onPicked(result.data, true);
  }

  const note = adding === "offline" ? t.addOffline : adding === "failed" ? t.addFailed : null;
  return (
    <BottomSheet title={t.sheetTitle} onClose={onClose}>
      <p className="practices-sheet-lead">{t.sheetLead}</p>
      {/* Feelings and Gratitude join this list in phase 1 (D10). */}
      <button
        type="button"
        className="practice-option"
        onClick={onHierarchy}
        disabled={adding === "busy"}
      >
        <span className="practice-option-tile is-hierarchy">
          <Icon name="practice-hierarchy" />
        </span>
        <span className="practice-option-text">
          <span className="practice-option-name">{t.hierarchyName}</span>
          <span className="practice-option-line">
            {adding === "busy" ? t.adding : hierarchy ? t.alreadyAdded : t.hierarchyLine}
          </span>
        </span>
      </button>
      {note && (
        <p className="practices-sheet-note" role="status">
          {note}
        </p>
      )}
      <p className="practices-sheet-footer">{t.sheetFooter}</p>
    </BottomSheet>
  );
}
