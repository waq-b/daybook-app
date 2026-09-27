import { copy } from "../copy";
import { PlaceholderScreen } from "./PlaceholderScreen";

export function TodayScreen() {
  return <PlaceholderScreen icon="nav-today" {...copy.today} />;
}

export function PracticesScreen() {
  return <PlaceholderScreen icon="nav-practices" {...copy.practices} />;
}

export function SessionsScreen() {
  return <PlaceholderScreen icon="nav-sessions" {...copy.sessions} />;
}

export function HistoryScreen() {
  return <PlaceholderScreen icon="nav-history" {...copy.history} />;
}
