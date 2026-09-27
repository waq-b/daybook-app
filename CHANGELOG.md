# Changelog

All notable changes to Daybook. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Phases are the release headings.

## Unreleased

## 0b Sessions — 2026-09-27

### Added

- Close-out (0b.6): axe accessibility checks, 390px and 200% text on every Sessions screen and state, an "as built" note in `docs/PLAN.md`.
- Session detail (0b.5): boards SessionDetail and SessionDetailPast at `/sessions/:id`.
  - A Today / Upcoming / Done / Not marked done badge, the date and time, the notes, and the assigned line.
  - Mark session as done on today's session or any earlier one; it only records that the session is done.
  - Saving a new or edited session now opens its detail, and sessions in the list open there too.
- Sessions list (0b.4): boards Sessions and SessionsEmpty.
  - The next session sits in the teal card with its countdown ("3 days", Today, Tomorrow).
  - Any other booked sessions sit under Later; Past is newest first, each row titled by its notes' first line with its time and whether it was marked done.
  - "Add a session", or "Add your next session" when empty.
  - Offline, a calm line says loading needs a connection.
- New and edit session (0b.3): boards SessionEdit and SessionEditPast at `/sessions/new` and `/sessions/:id/edit`.
  - Fields: When (date and time), Session notes, and "Anything else, not a practice yet".
  - A new session is set from the last one: same weekday, same time.
  - The sticky Save session explains what it needs. Offline it says saving needs a connection and keeps what you typed.
- Local `DateTimeField` and `TextArea` (0b.2, DESIGN.md §5):
  - DateTimeField: DATE and TIME side by side, values in words, and the whole field opens the phone's own picker
  - TextArea: grows with its text, and 17px so iOS doesn't zoom
  - both on `/dev/states`
- Session data (0b.1):
  - `sessions.assigned_note` for the edit screen's "Anything else, not a practice yet"
  - `src/data/sessions.ts` (list, get, create, update, mark done; each returns an outcome, never throws)
  - pure rules in `src/data/sessionRules.ts` and `src/data/dates.ts` for next and past sessions, the countdown, the new-session default, when a session can be marked done, and past row titles; tested in UK time across both clock changes
- `docs/PLAN.md`: phase 0b Sessions plan, six tasks tracked as GitHub issues #24–#29. The finished 0a plan moves to `docs/plans/0a.md`.

### Changed

- `CLAUDE.md` data model: `sessions.assigned_note` (0b plan, Q1). `docs/DESIGN.md` §6 Sessions rows aligned with the canvas (Q8) and with how mark as done works. `docs/setup.md`: six migrations.

## 0a Foundation — 2026-09-27

### Added

- Close-out (0a.10): `docs/setup.md` (services, environment, Supabase Auth settings, recreating from scratch), an "as built" note in the 0a plan (now `docs/plans/0a.md`), and a 200% text-size e2e pass over sign-in, the install prompt and Settings.

- Settings (0a.9): boards Settings, SettingsDelete1 and SettingsDelete2. Signed-in email, Add to home screen (links to `/install`), Export my data (every row as JSON, via the share sheet where the phone has one, else a download), Delete everything in two real steps (step 2 needs DELETE typed; the ink button is the app's one destructive action), About with the build's version, Sign out.
- Local `BottomSheet` (DESIGN.md §5).
- Install prompt (0a.8): boards Install and InstallAndroid. After sign-in, a phone not running Daybook from the home screen sees how to add it (Safari's three steps on iPhone; Chrome's own install dialog on Android). "Not now" is remembered on that phone. It never shows in the installed app or on a computer. `/install` reopens it (Settings links there in task 9).
- Email-code sign-in (0a.7): boards SignIn and SignInCode. Email → six-digit code (the phone offers it from Mail) → Today, and the session is kept on the phone. Every screen except sign-in needs a session. Disabled buttons say what they need; a wrong code, no signal or a failed send each get one calm line. There are no error colours.
- Local `TextField` (DESIGN.md §5) and a Supabase client typed from the schema.
- E2E tests sign in against a mocked Supabase; CI never calls the real one.
- Supabase (0a.6): project `daybook` (eu-west-1) with all ten tables from the data model, RLS on every table (read, add and change your own rows; no delete, no signed-out access), parent links that can only point at your own rows, `export_everything()` and `delete_everything('delete')`. Five migrations in `supabase/migrations/`, generated types in `src/lib/database.types.ts`.
- 69 database tests against real Postgres in CI (`npm run test:db`), with a small Supabase stub.
- Keep-awake workflow: pings Supabase every three days so the free project doesn't pause.
- Bottom nav shell (0a.5): five tabs (Today, Practices, Sessions, History, Settings) with React Router 7. The nav is fixed above the home indicator, with no badges yet. Tabs whose screens come in later phases show their title and an empty state.
- Installable PWA (0a.4): manifest built from `copy.ts` and `tokens.json`, icons rendered from the design system's Logo mark (`npm run icons`), iOS home-screen tags, and a service worker that caches the app shell and fonts so the installed app opens offline. The API is never served from the cache. New versions take over the next time the app opens fresh.
- CI checks installability and offline with Playwright, and runs Lighthouse CI with accessibility at 0.95 or above.
- Design system v9 mounted (0a.3): tokens, self-hosted Atkinson Hyperlegible Next and the 16 components (`src/design/daybook.ts`, with React put on `window` in its own module first). `/dev/states` shows every component on a phone.
- Token check (every `var()` in `bundle.css` is defined) and a hex ban outside `design/` (ESLint for TS/TSX, stylelint for CSS), both in CI.
- Deployed to Render (0a.2): free web service `daybook` in Frankfurt at https://daybook-gjf6.onrender.com, auto-deploying `main`. Settings recorded in `render.yaml`.
- Scaffold (0a.1): Vite + React 18 + TypeScript web app, Fastify server serving the built app and `GET /api/health`, Node 22.
- `src/copy.ts` for every user-facing string, with a voice test (no exclamation marks, no emoji, no banned words) and ESLint rules that stop literal strings in components.
- CI on every PR: typecheck, ESLint, stylelint, Prettier, tests, build.
- Pre-push hook that refuses direct pushes to `main`.
- `docs/PLAN.md`: phase 0a Foundation plan, ten tasks tracked as GitHub issues #1–#10.
- Repo `waq-b/daybook` (private) with the constitution, design system v9 (`design/`) and design docs.

### Changed

- Sign-up closed (0a.10): the app only signs in existing accounts, and Supabase's "Allow new users to sign up" is off.
- `CLAUDE.md` (approved in the 0a plan):
  - repo `waq-b/daybook`; GitHub issues replace monday.com
  - Node 22 LTS; the Render URL until the custom domain
  - Supabase keep-awake instead of a Render keep-alive
  - `main` guarded by a pre-push hook
  - CI's PWA check is Playwright plus Lighthouse accessibility
  - export and delete are Postgres functions
- `docs/DESIGN.md`:
  - §2 mounting snippet fixed (React on `window` in its own module, imported first)
  - §1 token check and hex ban as built
  - §6 wording aligned with the canvas
  - §4 records the iOS text-size limit and the install arrow
