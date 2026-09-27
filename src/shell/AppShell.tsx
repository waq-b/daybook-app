import { Outlet, useLocation, useNavigate } from "react-router";
import { Daybook } from "../design/daybook";
import { TAB_PATHS, isTabId, tabForPath } from "./tabs";

const { BottomNav } = Daybook;

/** Shared chrome: the page, then the bottom nav fixed over the home indicator. */
export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <div className="shell-page">
        <Outlet />
      </div>
      <div className="shell-nav">
        {/* No badges until flags exist (phase 0d); none shows at 0. */}
        <BottomNav
          active={tabForPath(pathname)}
          onNavigate={(id) => {
            if (isTabId(id)) navigate(TAB_PATHS[id]);
          }}
        />
      </div>
    </div>
  );
}
