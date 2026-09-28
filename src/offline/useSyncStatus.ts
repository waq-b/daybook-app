import { useEffect, useRef, useState } from "react";
import { onPendingChange } from "./outbox";

/** How long "Synced" shows after the last entry reaches the server (SyncStatus fades it). */
const SYNCED_FOR_MS = 3000;

/** SyncStatus's state: "saved-local" while anything waits, "synced" briefly after, then nothing. */
export function useSyncStatus(): { state: "saved-local" | "synced" | null; pending: number } {
  const [pending, setPending] = useState(0);
  const [justSynced, setJustSynced] = useState(false);
  const previous = useRef(0);

  useEffect(
    () =>
      onPendingChange((n) => {
        if (previous.current > 0 && n === 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), SYNCED_FOR_MS);
        }
        previous.current = n;
        setPending(n);
      }),
    [],
  );

  return { pending, state: pending > 0 ? "saved-local" : justSynced ? "synced" : null };
}
