# Changelog

All notable changes to Daybook. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Phases are the release headings.

## Unreleased

### Added

- Scaffold (0a.1): Vite + React 18 + TypeScript web app, Fastify server serving the built app and `GET /api/health`, Node 22.
- `src/copy.ts` for every user-facing string, with a voice test (no exclamation marks, no emoji, no banned words) and ESLint rules that stop literal strings in components.
- CI on every PR: typecheck, ESLint, stylelint, Prettier, tests, build.
- Pre-push hook that refuses direct pushes to `main`.
- `docs/PLAN.md`: phase 0a Foundation plan, ten tasks tracked as GitHub issues #1–#10.
- Repo `waq-b/daybook` (private) with the constitution, design system v9 (`design/`) and design docs.
