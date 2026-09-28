import { copy } from "../copy";
import { PlaceholderScreen } from "./PlaceholderScreen";

export function TodayScreen() {
  return <PlaceholderScreen icon="nav-today" {...copy.today} />;
}

export function HistoryScreen() {
  return <PlaceholderScreen icon="nav-history" {...copy.history} />;
}
