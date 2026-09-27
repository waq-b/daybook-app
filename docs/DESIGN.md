# Daybook — DESIGN.md

How the designs become code. Read after `CLAUDE.md`. The design system and the canvas are the source of truth for how things look; this file says how to use them and what the app must get right that a picture can't show.

| Source | Version | Link |
| --- | --- | --- |
| Daybook design system (tokens, 16 React components, voice) | v9 (1790512374-1158) | https://claude.ai/code/artifact/a263c454-4866-43b3-a241-78fd5d7000ce |
| Daybook canvas (every screen and state, 390 and 820) | v12 (1790512547-23b8) | https://claude.ai/artifact/1H6SemHoJi7XyBkRhfu4td |
| Design handoff (research, sources, QA) | 27 Sep 2026 | `docs/design-handoff.md` |
| Planner brief (design → build) | 27 Sep 2026 | `docs/planner-brief.md` |

Don't copy canvas HTML into the app. The canvas is the reference; the bundle is the code.

## 1. Files in the repo

Copied from the design system, unchanged, under `design/`. Re-copy on a design-system version bump and note the version in `CHANGELOG.md`.

```
design/
  tokens.json                      ← the only place a colour, size or radius is defined
  tokens.css                       ← shipped by the design system (v9+): :root custom properties, @font-face, .t-* type classes
  README.md                        ← the system's own principles, voice and colour rules
  fonts/
    AtkinsonHyperlegibleNext-Variable.woff2
    AtkinsonHyperlegibleNext-Variable-Italic.woff2   ← tokens.css references these as url("fonts/…"), so they live beside it
  components/
    bundle.js                      ← window.Daybook (needs React 18 + ReactDOM 18 on the page)
    bundle.css                     ← reads tokens.css custom properties only
    index.d.ts                     ← prop types for the 16 components
```

**tokens.css comes from the design system; don't hand-edit or regenerate it.** It defines `--paper` … `--difficulty-8`, `--space-*`, `--radius-*`, `--shadow-*`, `--font-sans`, the two `@font-face` rules (`font-display: swap`) and one class per type style: `.t-num-hero`, `.t-num-lg`, `.t-num-md`, `.t-title-lg`, `.t-title`, `.t-heading`, `.t-body`, `.t-body-strong`, `.t-small`, `.t-label`. Vite resolves the `url("fonts/…")` references relative to the CSS file and hashes the woff2 into the build. A CI check (`scripts/tokens.ts`, run by `npm test`) fails if `bundle.css` reads a `var(--x)` that nothing defines. Defined means: declared in `tokens.css`, set inline by `bundle.js` (`--c`, `--on`), or always read with a fallback (`var(--c-edge, …)`).

**No hex anywhere else.** ESLint (`no-restricted-syntax` on `#[0-9a-f]{3,8}` in string and template literals in `src/` and `server/`) and stylelint (`color-no-hex`, `color-named: never` in `src/**/*.css`) fail CI. Build-time code that needs a colour (manifest, `theme-color`, icons) reads it from `tokens.json` via `scripts/design-tokens.ts`. The dark theme later is a second block in `tokens.json`, nothing else.

## 2. Mounting the bundle

`bundle.js` sets `window.Daybook` and expects `React` and `ReactDOM` globals. In Vite:

ES imports are hoisted and run before the importing module's body, so React has to go on `window` in its own module, imported first. TypeScript also refuses an import path ending in `.d.ts`.

```ts
// src/design/globals.ts
import React from "react";
import ReactDOM from "react-dom";
window.React = React;
window.ReactDOM = ReactDOM;

// src/design/daybook.ts
import "./globals"; // must stay first
import "../../design/tokens.css";
import "../../design/components/bundle.css";
import "../../design/components/bundle.js";
import type * as DaybookComponents from "../../design/components/index";
export const Daybook = window.Daybook; // typed via a global Window declaration
```

Wrap the app root in `<div className="db">` (the bundle's styles are scoped to `.db`). Use the components as-is. If a component's API is missing something, the fix goes in the design system (next version), not in a fork. Until then, the workaround is documented in §4.

## 3. The 16 design-system components

Use these, never re-implement them. Props in `index.d.ts`; rules from each component's README, condensed.

| Component | Use it for | Rules that matter in code |
| --- | --- | --- |
| `Logo` | Sign-in, About, app icon (`mark`), notification icon, install prompt | Never recolour the ribbon; `word` only when the mark is already on screen |
| `Icon` | Every icon | 24px, `currentColor`. `label` only when it stands alone. Never apricot alone on paper. v9 adds close, back, share, download, info, cloud, pause, chevron-down |
| `Button` | primary (one per screen), secondary, quiet | Primary is `lg` + `block` in the bottom third on mobile. Labels are verbs, sentence case |
| `RatingScale` | Every 0–8 input | Radiogroup, arrow keys work. Label = the worksheet's words. Never a slider, stars or faces. Keep side gutter ≤ 16px so cells stay ≥ 39px |
| `Score` | Read-only 0–8 | `ghost` for predicted. Number always shown |
| `FlagToggle` | Bring to session | Full toggle above the save button on every log screen; `compact` top-right on every `EntryCard`. Marigold means flagged and nothing else |
| `Chip` | Quick-picks, feeling words, seeds | Missed reasons in this order: Tired, Anxious, No time, Forgot, Chose not to, Other |
| `TargetProgress` | Weekly target | Never on gratitude. Never counts down |
| `PracticeCard` | Today and Practices lists | Whole card is the target. `meta` (v9) is the second line: "5 tasks on the go, 2 done", "Once a week". Gratitude gets `lastLogged`, never `target` |
| `EntryCard` | History, session detail, Prepare | `predicted` (v9) renders first as a ghost Score labelled PREDICTED; pass it as a prop, never in `note`. `attempt` for left-early. Compact flag always present |
| `LadderRung` | The ladder | Big block = latest remaining on its ramp colour. `done` defaults to remaining < 4. `right` (v9) holds the weekly target or one-off meta: "2 of 4 this week", "One-off · by Wed"; when `right` says "by <date>", omit `targetDate` |
| `BottomNav` | The five tabs | Only badge is marigold flagged count on Sessions; none when 0 |
| `EmptyState` | One per list | Title + next small step + one action |
| `NotificationCard` | Reminders preview | Mock only; real push copy comes from `src/copy.ts` |
| `CrisisFooter` | Feelings log, bottom, above save | Nowhere else. Copy is fixed in the bundle (v9): Samaritans 116 123 · Text SHOUT to 85258 · NHS 111, mental health option · 999 |
| `SyncStatus` | Offline state | `saved-local` pill while queued, `synced` fades after a few seconds |

## 4. Accepted deviations

These are decided. Don't re-decide them in a build session. (The v8 API gaps — `LadderRung.right`, `EntryCard.predicted`, `PracticeCard.meta`, the CrisisFooter copy, the missing `tokens.css` — were all fixed in design system v9 and are no longer workarounds.)

| Item | Decision |
| --- | --- |
| `Score` has no large size | Accept: tablet feelings intensity uses the default 36px |
| `SyncStatus` too long for a header row | Accept: Log a rep shows it on its own line under the title |
| `RatingScale` cells ~39px wide at 390 | Accept; 56px tall, gapless. Revisit in the accessibility pass |
| Canvas loads fonts from Google | App self-hosts from `design/fonts/` via `tokens.css` |
| Extra icons drawn locally on the canvas | Now in `Icon` (v9); `src/components/icons/` is not needed |
| Install board's hand-drawn down arrow | `Icon` `chevron-down` (no arrow icon in the set) |
| Type sizes are px in `tokens.css`, so iOS Larger Text doesn't scale an installed PWA | Accepted for now (plan Q10). Screens are tested at 200% zoom and must not clip or scroll sideways. A rem-based type scale is a design-system request for a later version |

## 5. Canvas-only components (build locally in `src/components/`)

Each is drawn with states on the canvas Components page (`CompControls`, `CompScores`, `CompCards`, `CompChrome`, `CompIcons`), labelled "Canvas only". Build from tokens; same `.db-` naming convention; 44px targets; focus ring from `--focus`.

| Component | Spec |
| --- | --- |
| `SegmentedControl` | 2–3 options on a `paper-sunk` track, `radius-md`; selected segment `paper-raised` with 1.5px ink border and weight 650. `role="group"`, `aria-pressed`. Used for Easiest/Hardest first, Did it / Started left early, Not very / Fairly / Very |
| `Toggle` | Switch, 44px target, ink knob on `line-strong` track; on = apricot track. Reminders on/off |
| `Stepper` | − value + for reps per week (1–7). 44px buttons, `num-md` value |
| `TextField` / `TextArea` | `paper-raised`, 1.5px `line-strong` border, `radius-md`, 48px min height, label in `small` above. No error state exists; a disabled Save explains itself instead |
| `DateTimeField` | Native `<input type="datetime-local">` styled as TextField. Add/edit session |
| `AddChip` | Dashed `line-strong` border, teal text, "+ Other" / "+ Add a practice" |
| `RemovableChip` | Chip with a 44px × target; seed bank editing, assigned practices |
| `BottomSheet` | `paper-raised`, `radius-xl` top corners, `shadow-sheet`, drag handle, safe-area padding. Type picker, cadence picker |
| `Note` | Teal info banner: `teal-tint` bg, teal icon, `small` text. Soft warnings ("high rung"), hints |
| `Celebration` | `apricot-tint` wash, `radius-lg`, heading line + `num-lg` "7 → 2". Fires on: rung done, easier than predicted, feared prediction didn't happen. No animation beyond a 200ms fade |
| `RepChart` | SVG. X = rep number; predicted as a flat teal reference line; actual and remaining as points in their ramp colours joined by ink lines; the "under 4" line dashed `line-strong`. Each point carries its number. Wraps to width; min 160px tall |
| `PredictionCheck` | Card: "Before, you thought" + quoted text; "Did it happen?" + SegmentedControl No / A bit / Yes. Before-the-rep version: TextArea "What do you think will happen?" + SegmentedControl "How likely does that feel?" Not very / Fairly / Very |
| `Tally` | Standalone marks: 4×18px bars, `radius-sm`; solid ink per rep, hollow 1.5px border per attempt; count in `label` style after. `aria-label="Tally 6, 1 left early"` |
| `NavRail` (tablet) | 88px left rail, same five items as BottomNav stacked, apricot pill on active |
| `CountPill` | "4 flagged" marigold pill with ink text; hidden at 0 |

## 6. Screens

One row per canvas board group. Copy marked **verbatim** must match exactly and lives in `src/copy.ts`. Primary = the one apricot button and where it sits.

### Phase 0a

| Screen | Boards | States | Components | Verbatim copy | Primary |
| --- | --- | --- | --- | --- | --- |
| Sign in | `SignIn`, `SignInCode` | email, code | Logo lockup, TextField, Button | Canvas wording (see `src/copy.ts`) | "Email me a code" / "Sign in", bottom third |
| Install prompt | `Install`, `InstallAndroid` | iOS, Android | Logo mark, Button | Explains add-to-home-screen because reminders need it | iOS: quiet "Not now" only (Share is in Safari's bar). Android: "Install Daybook", then quiet "Not now" |
| Settings | `Settings`, `SettingsDelete1`, `SettingsDelete2` | main, delete 1, delete 2 | rows, BottomSheet, TextField, Button (secondary; ink for delete) | Delete is two real steps; step 2 types DELETE (any case accepted) | Secondary only; the ink button is the one destructive action in the app |

### Phase 0b — Sessions

| Screen | Boards | States | Components | Verbatim copy | Primary |
| --- | --- | --- | --- | --- | --- |
| Sessions | `Sessions`, `SessionsEmpty` | filled, empty | next-session card on `teal-tint`, list, EmptyState, CountPill | Empty: "No sessions yet" / "Add your next appointment so flags have somewhere to go." | "Add a session"; teal "Prepare" on the next-session card is the one teal button in the app |
| Add / edit session (10b) | `AddSession`, `EditSession`, `TabletAddSession` | new, editing past, tablet | DateTimeField, TextArea, Chip, AddChip, RemovableChip, TextField, Button | Sections: **When** · **Session notes** (placeholder "Anything worth keeping from the session") · **Assigned in session**. Title "Edit session" when editing | "Save session" |
| Session detail | `SessionDetail`, `SessionDetailPast` | today, past | EntryCard list, Button | "Mark as done" clears flags; entries stay in history | "Mark as done" (today) |

### Phase 0c — Hierarchy

| Screen | Boards | States | Components | Verbatim copy | Primary |
| --- | --- | --- | --- | --- | --- |
| Practices | `Practices`, `PracticesPicker`, `PracticesEmpty` | filled, picker, empty | PracticeCard, BottomSheet, EmptyState | Picker lists the three types with one line each | "Add a practice" |
| Ladder | `Ladder`, `LadderEmpty`, `LadderDone` | filled, empty, just completed | SegmentedControl, LadderRung, Celebration, EmptyState | Header line: "Repeat each task until remaining difficulty is under 4, then move up to the next one." · "UP NEXT" · separator "UNDER 4 · DONE" · legend "Latest remaining / Rep / Started, left early" · Empty: "No tasks yet. Add the first rung." / "Put in everything from your worksheet, in any order. They'll sort themselves, easiest first." · Done: "That one's done." "{task}. Remaining {n}, under the 4 line." | "Add a task" / "Add the first task" |
| Add a task | `AddTask`, `AddTaskWarning` | default, high-rung warning | TextField, RatingScale (Predicted difficulty), SegmentedControl (One-off / Repeating), Stepper, DateTimeField, Note | Shows where it lands on the ladder before saving. Warning is a Note, not a block | "Add to ladder" |
| Task detail | `TaskDetail`, `TaskDetailDone`, `TaskDetailNew` | in progress, done, new | Score ×2 (`num-lg` header), RepChart, Tally, PredictionCheck (before), EntryCard list, TextArea (Comments) | Header: PREDICTED / REMAINING. Card: "Before the next one". Completed: worksheet "Comments" field | "Log a rep" |
| Log a rep | `LogRep`, `LogRepAttempt`, `LogRepLogged`, `LogRepOffline` | rating, left early, logged, offline | SegmentedControl (Did it / Started, left early), PredictionCheck (after), Chip quick-picks, TextField, RatingScale ×2, FlagToggle, Button, Celebration, Tally, SyncStatus | Labels: "Actual difficulty" hint "How hard was it?" · "Remaining difficulty" hint "If you did it again now" · ends "0 easy / Under 4 is done / 8 intense" · "Anything you did to make it easier?" · "Note, or anything that made it easier" · Save disabled: "Pick both scores to save" · confirmations: "Logged. Thought {p}, it was {a}, now it's a {r}." / "That one's done. Remaining {r}, under the 4 line." / "Logged as started, left early. It still goes in the tally." · offline: "Saved on this phone, will sync." | "Save rep"; then "Done". Body scrolls, Save sticky. Draft persisted locally if the app closes |

### Phase 0d — Today and flags

| Screen | Boards | States | Components | Verbatim copy | Primary |
| --- | --- | --- | --- | --- | --- |
| Today | `Main`, `TodayMissed`, `TodayEmpty`, `TodayDone` | filled, missed, empty, all done | PracticeCard, TargetProgress, CountPill, Missed prompt inline, EmptyState | Gratitude card shows "Last one {day}", never a count | The due practice's card; no separate button |
| Missed target | `Missed`, `MissedSaved` | open, saved | Chip (reasons, fixed order), TextField, SegmentedControl (Tomorrow / a day / Leave it for now), FlagToggle | "You planned {task} yesterday. What got in the way?" · "When's the next go?" · saved state confirms the next go, no extra reminders | "Save" |
| Prepare for session | `Prepare`, `PrepareEmpty` | filled, empty | glance strip (3 tiles), EntryCard grouped by practice, TextArea, EmptyState | Title "For {day}" · subtitle "Since {date} · {n} flagged · in date order" · tiles: "{n} reps" "and {m} missed" / "{n} rung done" / "{x} of {y} predictions" "didn't happen, or only a bit" · "Anything else to raise?" · Empty: "Nothing flagged since {date}" / "Tap the flag on any entry and it'll collect here, ready for {day}." | None on phone (reading screen); tablet has "Hand-over view" |

### Phase 0e — Reminders and push

| Screen | Boards | States | Components | Verbatim copy | Primary |
| --- | --- | --- | --- | --- | --- |
| Reminders | `Reminders` | one | Toggle per practice, time rows, day chips, NotificationCard preview, Button (secondary) | "Pause everything for a week" | Secondary only |
| Notifications | `Notifications` board | 6 types × 3 variants | push payload | All 18 lines verbatim from the board into `src/copy.ts`, rotated so no line repeats two days running. Actions "Log it" / "Not today" on practice reminders | — |

### Phase 1 — Practices

| Screen | Boards | States | Components | Verbatim copy | Primary |
| --- | --- | --- | --- | --- | --- |
| Feelings log | `FeelingsLog`, `FeelingsLogWriting` | words, writing | Chip grid (25 words, 5 groups), RatingScale (Intensity), TextArea, Note (15-min hint), TextField (closing), FlagToggle, CrisisFooter | Above the box: "Write it how it is. Nobody's marking it, and feelings do pass." · closing: "One thing I can do, or one thing I have to accept" · hint after ~15 min: "One more line, then done?" · CrisisFooter copy per §4 | "Save" |
| Feelings history | `FeelingsHistory`, `FeelingsHistoryEmpty` | filled, empty | EntryCard (`intensity`), simple word-frequency list, EmptyState | No interpretation. Frequencies only | — |
| Seed bank | `Seeds`, `SeedsEdit`, `SeedsEmpty` | filled, edit, empty | Chip cloud, RemovableChip, AddChip, EmptyState | — | "Add a thing" |
| Gratitude entry | `GratitudeEntry`, `GratitudeNudge`, `GratitudeCadence` | entry, nudge, first-run cadence | Chip (seed), TextArea (because), Note (nudge), BottomSheet (cadence) | Because is required. Nudge when the same because appears within a month. Cadence options: "Once a week (suggested)", "Three times a week", "Every day" | "Save" |
| History | `History`, `HistoryFlagged`, `HistoryEmpty` | all, flagged, none | filter chips, EntryCard, EmptyState | Empty: "Nothing matches" | — |

### Phase 2 — Tablet (layout only)

Boards `Tablet*` and `TabletRail`. Two columns at ≥ 820: list left, detail right, `NavRail` on the far left. Same components, same data. Prepare gets a "Hand-over view" button that hides the nav and enlarges type one step.

### Phase 3 — Session export (PDF)

Board `WorksheetPDF` is the reference for the hierarchy page: the paper layout exactly, A4 landscape — Task · Predicted difficulty · Date assigned · Tally of repetitions · Date completed · Remaining difficulty · Comments. The rest of the PDF is the Prepare screen in print form: at-a-glance strip, flagged entries grouped by practice in date order, "anything else to raise". Same tokens, same type scale, `paper` background prints white. Export from Prepare and Session detail via the share sheet. Board `TherapistView` is v2 material and not built.

## 7. Rules block (what a build session checks every PR against)

- **Voice.** Plain, warm, British. Sentence case. No exclamation marks, no emoji. Banned: journey, healing, self-care, mindful, wellness, streak. All user-facing strings in `src/copy.ts`; a unit test greps them.
- **The therapist is never gendered.** "Your therapist", "Assigned in session", "Session notes".
- **No streaks, no shame.** Progress shows done of target. A miss asks a question. Nothing resets to zero with a sad face. No red, no green, no error colours.
- **Marigold = flagged.** Nothing else is marigold. Apricot = the one primary action, active nav pill, target pips. Teal = focus, quiet buttons, sessions accent, predicted line.
- **Difficulty ramp** only for 0–8 scores. The number is always printed on it.
- **Worksheet words** as labels: Predicted difficulty, Actual difficulty, Remaining difficulty, Tally, Date completed, Comments. Done = remaining under 4.
- **Primary action in the bottom third**, one per screen, `lg` + `block`. 44px targets everywhere; RatingScale cells 56px tall.
- **CrisisFooter** on the feelings log only, permanent, never a popup, never styled as a warning.
- **Offline first for writes.** IndexedDB outbox; `SyncStatus` shows "Saved on this phone, will sync". No error states in the UI: a disabled control says what it needs.
- **Never delete, archive.** Only "Delete everything" hard-deletes, two steps.
- **Dynamic type.** Rows wrap, no fixed heights on text. Test at the largest iOS text size before closing a phase.
- **Safe areas.** Standalone PWA: `env(safe-area-inset-*)` on the nav and any sticky action.
- **Fonts self-hosted.** Atkinson Hyperlegible Next variable, `font-display: swap`.
- **Celebration** is one `apricot-tint` wash and `num-lg` numbers. No confetti, no sound.

## 8. Verification per screen

Before a screen's PR merges: side-by-side screenshot against its canvas board at 390 (and 820 where a tablet board exists), every state listed above rendered in Storybook or a `/dev/states` route, axe-core clean, copy test green, Lighthouse PWA installable.
