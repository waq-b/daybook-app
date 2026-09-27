import { useCallback, useState } from "react";
import { Link } from "react-router";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { useSession } from "../auth/AuthProvider";
import { BottomSheet } from "../components/BottomSheet";
import { TextField } from "../components/TextField";
import { isStandalone } from "../install/platform";
import {
  confirmsDelete,
  deleteEverything,
  exportEverything,
  signOutHere,
  type Outcome,
} from "../settings/account";

const { Icon, Button } = Daybook;
const t = copy.settings;
const d = t.delete;

const VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";

const EXPORT_NOTE: Record<Outcome, string> = {
  ok: t.exportDone,
  offline: t.exportOffline,
  failed: t.exportFailed,
};

/** Boards Settings, SettingsDelete1, SettingsDelete2 (0a rows only). */
export function SettingsScreen() {
  const session = useSession();
  const email = session?.user.email ?? "";

  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteNote, setDeleteNote] = useState<string | null>(null);

  const onExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportNote(null);
    const outcome = await exportEverything();
    setExporting(false);
    setExportNote(EXPORT_NOTE[outcome]);
  };

  const closeSheet = useCallback(() => {
    setStep(0);
    setTyped("");
    setDeleteNote(null);
  }, []);

  const onDelete = async () => {
    if (deleting || !confirmsDelete(typed, d.confirmWord)) return;
    setDeleting(true);
    setDeleteNote(null);
    const outcome = await deleteEverything();
    // On success the session ends and the app goes to sign-in on its own.
    if (outcome !== "ok") {
      setDeleting(false);
      setDeleteNote(outcome === "offline" ? d.offline : d.failed);
    }
  };

  return (
    <main className="screen settings">
      <h1 className="t-title-lg screen-title">{t.title}</h1>

      <section className="settings-card settings-account">
        <span className="settings-avatar" aria-hidden="true">
          {email.charAt(0).toUpperCase()}
        </span>
        <span className="settings-account-email">{email}</span>
      </section>

      <section className="settings-card">
        <Link to="/install" className="settings-row">
          <span className="settings-row-text">
            <span className="settings-row-title">{t.installRow}</span>
            <span className="settings-row-meta">
              {isStandalone() ? t.installed : t.notInstalled}
            </span>
          </span>
          <Icon name="chevron-right" />
        </Link>
      </section>

      <section className="settings-group">
        <h2 className="t-heading settings-heading">{t.dataHeading}</h2>
        <div className="settings-card">
          <button type="button" className="settings-row" onClick={onExport} disabled={exporting}>
            <span className="settings-row-text">
              <span className="settings-row-title">{t.exportRow}</span>
              <span className="settings-row-meta">{exporting ? t.exporting : t.exportMeta}</span>
            </span>
            <Icon name="download" />
          </button>
          <button type="button" className="settings-row" onClick={() => setStep(1)}>
            <span className="settings-row-text">
              <span className="settings-row-title">{t.deleteRow}</span>
              <span className="settings-row-meta">{t.deleteMeta}</span>
            </span>
            <Icon name="chevron-right" />
          </button>
        </div>
        {exportNote && (
          <p className="settings-note" role="status">
            {exportNote}
          </p>
        )}
      </section>

      <section className="settings-card">
        <div className="settings-row settings-row-static">
          <span className="settings-row-title">{t.about}</span>
          <span className="settings-row-meta">{t.version(VERSION)}</span>
        </div>
        <button type="button" className="settings-row" onClick={() => void signOutHere()}>
          <span className="settings-row-title">{t.signOut}</span>
        </button>
      </section>

      <p className="settings-footer">{t.footer}</p>

      {step === 1 && (
        <BottomSheet label={d.step1Label} title={d.step1Title} onClose={closeSheet}>
          <p className="settings-sheet-text">{d.step1Body}</p>
          <p className="settings-sheet-text settings-muted">{d.step1Hint}</p>
          {exportNote && (
            <p className="settings-sheet-text" role="status">
              {exportNote}
            </p>
          )}
          <div className="settings-sheet-pair">
            <Button variant="secondary" size="lg" block onClick={onExport} disabled={exporting}>
              {exporting ? t.exporting : d.exportFirst}
            </Button>
            <Button variant="secondary" size="lg" block onClick={() => setStep(2)}>
              {d.continue}
            </Button>
          </div>
          <Button variant="quiet" block onClick={closeSheet}>
            {d.keep}
          </Button>
        </BottomSheet>
      )}

      {step === 2 && (
        <BottomSheet label={d.step2Label} title={d.step2Title} onClose={closeSheet}>
          <TextField
            label={d.confirmLabel}
            variant="confirm"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          {deleteNote && (
            <p className="settings-sheet-text" role="status">
              {deleteNote}
            </p>
          )}
          <button
            type="button"
            className="db-ink-button"
            onClick={onDelete}
            disabled={!confirmsDelete(typed, d.confirmWord) || deleting}
          >
            {deleting ? d.deleting : d.confirm}
          </button>
          <Button variant="quiet" block onClick={closeSheet}>
            {d.keep}
          </Button>
        </BottomSheet>
      )}
    </main>
  );
}
