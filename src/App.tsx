import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireNoSession, RequireSession } from "./auth/guards";
import { DevStates } from "./dev/DevStates";
import { InstallGate } from "./install/InstallGate";
import { InstallRoute } from "./install/InstallRoute";
import { AppShell } from "./shell/AppShell";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { SessionEditScreen } from "./sessions/SessionEditScreen";
import { HistoryScreen, PracticesScreen, SessionsScreen, TodayScreen } from "./screens/tabs";

export function App() {
  // The bundle's styles are scoped to .db (DESIGN.md §2).
  return (
    <div className="db">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="sign-in"
              element={
                <RequireNoSession>
                  <SignInScreen />
                </RequireNoSession>
              }
            />
            <Route
              element={
                <RequireSession>
                  <InstallGate>
                    <AppShell />
                  </InstallGate>
                </RequireSession>
              }
            >
              <Route index element={<TodayScreen />} />
              <Route path="practices" element={<PracticesScreen />} />
              <Route path="sessions" element={<SessionsScreen />} />
              <Route path="history" element={<HistoryScreen />} />
              <Route path="settings" element={<SettingsScreen />} />
            </Route>
            {/* Full-screen forms: no bottom nav (board SessionEdit). */}
            <Route
              path="sessions/new"
              element={
                <RequireSession>
                  <SessionEditScreen />
                </RequireSession>
              }
            />
            <Route
              path="sessions/:id/edit"
              element={
                <RequireSession>
                  <SessionEditScreen />
                </RequireSession>
              }
            />
            <Route
              path="install"
              element={
                <RequireSession>
                  <InstallRoute />
                </RequireSession>
              }
            />
            <Route path="dev/states" element={<DevStates />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
