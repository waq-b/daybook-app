# Changelog

All notable changes to Daybook. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Phases are the release headings.

## Unreleased

### Added

- Design system v9 mounted (0a.3): tokens, self-hosted Atkinson Hyperlegible Next and the 16 components (`src/design/daybook.ts`, with React put on `window` in its own module first). `/dev/states` shows every component on a phone.
- Token check (every `var()` in `bundle.css` is defined) and a hex ban outside `design/` (ESLint for TS/TSX, stylelint for CSS), both in CI.
- Deployed to Render (0a.2): free web service `daybook` in Frankfurt at https://daybook-gjf6.onrender.com, auto-deploying `main`. Settings recorded in `render.yaml`.
- Scaffold (0a.1): Vite + React 18 + TypeScript web app, Fastify server serving the built app and `GET /api/health`, Node 22.
- `src/copy.ts` for every user-facing string, with a voice test (no exclamation marks, no emoji, no banned words) and ESLint rules that stop literal strings in components.
- CI on every PR: typecheck, ESLint, stylelint, Prettier, tests, build.
- Pre-push hook that refuses direct pushes to `main`.
- `docs/PLAN.md`: phase 0a Foundation plan, ten tasks tracked as GitHub issues #1–#10.
- Repo `waq-b/daybook` (private) with the constitution, design system v9 (`design/`) and design docs.
