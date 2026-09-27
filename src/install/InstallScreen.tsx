import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { dismissInstallPrompt, installPlatform, promptAndroidInstall } from "./platform";

const { Logo, Icon, Button } = Daybook;
const t = copy.install;

/**
 * Boards Install (iOS) and InstallAndroid. Shown after sign-in on a phone
 * that isn't running Daybook from the home screen, and from Settings.
 */
export function InstallScreen({ onDone }: { onDone: () => void }) {
  const platform = installPlatform() ?? "ios";

  const notNow = () => {
    dismissInstallPrompt();
    onDone();
  };

  return (
    <main className="install">
      <Logo variant="mark" size={64} />
      <div className="install-head">
        <h1 className="t-title-lg install-title">{t.title}</h1>
        <p className="install-intro">{t.intro}</p>
      </div>

      {platform === "ios" ? (
        <>
          <ol className="install-steps">
            <li>
              <span className="install-n" aria-hidden="true">
                {1}
              </span>
              <span>
                {t.iosStep1Before}{" "}
                <span className="install-share">
                  <Icon name="share" size={18} label={t.shareLabel} />
                </span>{" "}
                {t.iosStep1After}
              </span>
            </li>
            <li>
              <span className="install-n" aria-hidden="true">
                {2}
              </span>
              <span>
                {t.iosStep2Before} <strong>{t.iosStep2Strong}</strong>
                {t.iosStep2After}
              </span>
            </li>
            <li>
              <span className="install-n" aria-hidden="true">
                {3}
              </span>
              <span>
                {t.iosStep3Before} <strong>{t.iosStep3Strong}</strong>
                {t.iosStep3After}
              </span>
            </li>
          </ol>
          <div className="install-spacer" />
          <div className="install-quiet">
            <Button variant="quiet" onClick={notNow}>
              {t.notNow}
            </Button>
          </div>
          <div className="install-hint" aria-hidden="true">
            <span>{t.shareHint}</span>
            <Icon name="chevron-down" size={28} />
          </div>
        </>
      ) : (
        <>
          <div className="install-card">
            <span className="install-card-title">{t.androidCardTitle}</span>
            <span className="install-card-body">{t.androidCardBody}</span>
          </div>
          <div className="install-spacer" />
          <p className="install-fallback">
            {t.androidFallbackBefore} <strong>{t.androidFallbackMenu}</strong>{" "}
            {t.androidFallbackMiddle} <strong>{t.androidFallbackStrong}</strong>
            {t.androidFallbackAfter}
          </p>
          <Button
            variant="primary"
            size="lg"
            block
            // If Chrome hasn't offered an install, the line above says how to do it by hand.
            onClick={() => void promptAndroidInstall()}
          >
            {t.androidInstall}
          </Button>
          <div className="install-quiet">
            <Button variant="quiet" onClick={notNow}>
              {t.notNow}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
