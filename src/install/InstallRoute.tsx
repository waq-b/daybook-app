import { useNavigate } from "react-router";
import { InstallScreen } from "./InstallScreen";

/** /install: the same screen, opened from Settings → Add to home screen. */
export function InstallRoute() {
  const navigate = useNavigate();
  return <InstallScreen onDone={() => navigate("/settings")} />;
}
