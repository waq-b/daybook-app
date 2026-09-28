import { useEffect, useState } from "react";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { onUpdateReady, updateNow } from "../pwa";
import { Note } from "./Note";

const { Button } = Daybook;

/** Shows at the top of every screen once a new version of Daybook is waiting. */
export function UpdateNote() {
  const [ready, setReady] = useState(false);
  useEffect(() => onUpdateReady(setReady), []);
  if (!ready) return null;
  return (
    <div className="update-note">
      <Note
        action={
          <Button variant="quiet" onClick={updateNow}>
            {copy.update.now}
          </Button>
        }
      >
        {copy.update.ready}
      </Note>
    </div>
  );
}
