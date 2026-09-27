import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { DevStates } from "./dev/DevStates";
import { AppShell } from "./shell/AppShell";
import { SettingsScreen } from "./screens/SettingsScreen";
import { HistoryScreen, PracticesScreen, SessionsScreen, TodayScreen } from "./screens/tabs";

export function App() {
  // The bundle's styles are scoped to .db (DESIGN.md §2).
  return (
    <div className="db">
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TodayScreen />} />
            <Route path="practices" element={<PracticesScreen />} />
            <Route path="sessions" element={<SessionsScreen />} />
            <Route path="history" element={<HistoryScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
          <Route path="dev/states" element={<DevStates />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
