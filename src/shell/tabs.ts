// The five tabs. Ids match BottomNav's.
export type TabId = "today" | "practices" | "sessions" | "history" | "settings";

export const TAB_PATHS: Record<TabId, string> = {
  today: "/",
  practices: "/practices",
  sessions: "/sessions",
  history: "/history",
  settings: "/settings",
};

/** The tab a path belongs to; nested paths (e.g. /sessions/abc) keep their tab lit. */
export function tabForPath(pathname: string): TabId {
  const match = (Object.entries(TAB_PATHS) as Array<[TabId, string]>).find(
    ([, path]) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
  return match?.[0] ?? "today";
}

export function isTabId(id: string): id is TabId {
  return id in TAB_PATHS;
}
