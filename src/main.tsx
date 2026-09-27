import "./design/daybook";
import "./styles/app.css";
import "./components/components.css";
import "./shell/shell.css";
import "./screens/signin.css";
import "./dev/dev.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { registerServiceWorker } from "./pwa";

const root = document.getElementById("root");
if (!root) throw new Error("#root missing from index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();
