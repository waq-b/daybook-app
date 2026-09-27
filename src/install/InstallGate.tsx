import { useState, type ReactNode } from "react";
import { InstallScreen } from "./InstallScreen";
import { shouldShowInstallPrompt } from "./platform";

/** After sign-in, a phone not running from the home screen sees the install prompt first. */
export function InstallGate({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(shouldShowInstallPrompt);
  if (show) return <InstallScreen onDone={() => setShow(false)} />;
  return children;
}
