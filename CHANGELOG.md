# Changelog

All notable changes to Daybook. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Phases are the release headings.

## Unreleased

### Added

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
