import { useState, type FormEvent } from "react";
import { copy } from "../copy";
import { Daybook } from "../design/daybook";
import { TextField } from "../components/TextField";
import { supabase } from "../lib/supabase";

const { Logo, Button } = Daybook;
const t = copy.signIn;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "busy" | "wrongCode" | "offline" | "sendFailed" | "resent";

/** Boards SignIn (email) and SignInCode (code). Email → 6-digit code → Today. */
export function SignInScreen() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.replace(/\D/g, "");
  const emailReady = EMAIL.test(cleanEmail);
  const codeReady = cleanCode.length === 6;
  const busy = status === "busy";

  async function sendCode() {
    if (!navigator.onLine) return setStatus("offline");
    setStatus("busy");
    // Sign-up stays open until Waqar's account exists (plan D16, task 10).
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true },
    });
    if (error) return setStatus(navigator.onLine ? "sendFailed" : "offline");
    return true;
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    if (!emailReady || busy) return;
    if (await sendCode()) {
      setCode("");
      setStep("code");
      setStatus("idle");
    }
  }

  async function onResend() {
    if (busy) return;
    if (await sendCode()) setStatus("resent");
  }

  async function onCode(e: FormEvent) {
    e.preventDefault();
    if (!codeReady || busy) return;
    if (!navigator.onLine) return setStatus("offline");
    setStatus("busy");
    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: "email",
    });
    // On success the auth listener signs the app in and the route moves to Today.
    if (error) setStatus(navigator.onLine ? "wrongCode" : "offline");
  }

  const note =
    status === "wrongCode"
      ? t.wrongCode
      : status === "offline"
        ? t.offline
        : status === "sendFailed"
          ? t.sendFailed
          : status === "resent"
            ? t.resent
            : null;

  return (
    <main className="signin">
      <div className="signin-brand">
        <Logo variant="lockup" size={40} />
        <p className="signin-tagline">{copy.app.description}</p>
      </div>

      <div className="signin-spacer" />

      {step === "email" ? (
        <form className="signin-form" onSubmit={onEmail} noValidate>
          <h1 className="t-title signin-title">{t.title}</h1>
          <p className="signin-muted">{t.intro}</p>
          <TextField
            label={t.emailLabel}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "busy") setStatus("idle");
            }}
          />
          {note && (
            <p className="signin-note" role="status">
              {note}
            </p>
          )}
          <div className="signin-primary">
            <Button variant="primary" size="lg" block type="submit" disabled={!emailReady || busy}>
              {busy ? t.sending : emailReady ? t.send : t.sendNeedsEmail}
            </Button>
          </div>
        </form>
      ) : (
        <form className="signin-form" onSubmit={onCode} noValidate>
          <h1 className="t-title signin-title">{t.codeTitle}</h1>
          <p className="signin-muted">{t.codeIntro(cleanEmail)}</p>
          <TextField
            label={t.codeLabel}
            variant="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status !== "busy") setStatus("idle");
            }}
          />
          {note && (
            <p className="signin-note" role="status">
              {note}
            </p>
          )}
          <div className="signin-primary">
            <Button variant="primary" size="lg" block type="submit" disabled={!codeReady || busy}>
              {busy ? t.verifying : codeReady ? t.verify : t.verifyNeedsCode}
            </Button>
          </div>
          <div className="signin-quiet">
            <Button variant="quiet" onClick={onResend} disabled={busy}>
              {t.resend}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setStep("email");
                setStatus("idle");
              }}
            >
              {t.differentEmail}
            </Button>
          </div>
        </form>
      )}

      <p className="signin-privacy">{t.privacy}</p>
    </main>
  );
}
