# Changelog

All notable changes to Daybook. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Phases are the release headings.

## Unreleased

### Added

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
