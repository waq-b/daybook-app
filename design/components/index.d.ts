// Daybook components (v9): window.Daybook. Needs React 18 on the page, tokens.css and components/bundle.css.
import type { ReactNode } from "react";

export type Difficulty = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type PracticeType = "hierarchy" | "feelings" | "gratitude";
export type IconName =
  | "practice-hierarchy" | "practice-feelings" | "practice-gratitude"
  | "nav-today" | "nav-practices" | "nav-sessions" | "nav-history" | "nav-settings"
  | "flag" | "plus" | "check" | "chevron-right" | "bell" | "saved-local" | "archive" | "phone"
  | "close" | "back" | "share" | "download" | "info" | "cloud" | "pause" | "chevron-down";

export declare function Logo(props: { variant?: "lockup" | "mark" | "word"; size?: number }): JSX.Element;
export declare function Icon(props: { name: IconName; size?: number; label?: string; filled?: boolean; className?: string }): JSX.Element;
export declare function Button(props: { variant?: "primary" | "secondary" | "quiet"; size?: "lg"; block?: boolean; icon?: IconName; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; children: ReactNode }): JSX.Element;
export declare function RatingScale(props: { label?: string; hint?: string; value?: Difficulty | null; defaultValue?: Difficulty; onChange?: (v: Difficulty) => void; max?: number; lowLabel?: string; highLabel?: string; showValue?: boolean; ends?: boolean }): JSX.Element;
export declare function Score(props: { value: Difficulty; size?: "sm"; ghost?: boolean; title?: string }): JSX.Element;
export declare function FlagToggle(props: { on?: boolean; defaultOn?: boolean; onChange?: (on: boolean) => void; compact?: boolean }): JSX.Element;
export declare function Chip(props: { selected?: boolean; onClick?: () => void; icon?: IconName; children: ReactNode }): JSX.Element;
export declare function TargetProgress(props: { done: number; of: number; period?: string }): JSX.Element;
export declare function PracticeCard(props: { type: PracticeType; name: string; meta?: string; lastLogged?: string; due?: string; target?: { done: number; of: number }; onClick?: () => void }): JSX.Element;
export declare function EntryCard(props: { type: PracticeType; title: string; time: string; predicted?: Difficulty; actual?: Difficulty; remaining?: Difficulty; intensity?: Difficulty; note?: string; attempt?: boolean; flagged?: boolean; onFlag?: (on: boolean) => void }): JSX.Element;
export declare function LadderRung(props: { name: string; predicted: Difficulty; remaining?: Difficulty | null; reps?: number; attempts?: number; targetDate?: string; completedOn?: string; done?: boolean; right?: ReactNode; onClick?: () => void }): JSX.Element;
export declare function BottomNav(props: { active: "today" | "practices" | "sessions" | "history" | "settings"; badges?: Partial<Record<"today" | "practices" | "sessions" | "history" | "settings", number>>; onNavigate?: (id: string) => void }): JSX.Element;
export declare function EmptyState(props: { icon?: IconName; title: string; body?: string; action?: string; onAction?: () => void }): JSX.Element;
export declare function NotificationCard(props: { title?: string; body: string; time?: string; actions?: string[]; onAction?: (index: number) => void }): JSX.Element;
export declare function CrisisFooter(): JSX.Element;
export declare function SyncStatus(props: { state?: "saved-local" | "synced"; count?: number }): JSX.Element;
