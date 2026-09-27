# Daybook

A logbook for the practical side of therapy. Live at **https://daybook-gjf6.onrender.com** (Render free web service, Frankfurt; deploys every merge to `main`). Read [`CLAUDE.md`](CLAUDE.md) first, then [`docs/DESIGN.md`](docs/DESIGN.md) and [`docs/PLAN.md`](docs/PLAN.md).

## Run it locally

Needs Node 22 (`.nvmrc`).

```bash
npm ci
npm run dev          # web app on http://localhost:5173
npm run dev:server   # API on http://localhost:3000 (Vite forwards /api to it)
```

Production-style: `npm run build && npm start` serves the built app and `/api/*` from one Fastify process on `PORT` (default 3000).

## Deploy

Render web service `daybook` (settings recorded in `render.yaml`) builds with `npm ci && npm run build` and runs `npm start` on every push to `main`. `GET /api/health` returns `{ ok, version }`, where `version` is the deployed commit. The free service sleeps after 15 minutes idle, so the first request after that takes up to a minute.

## Checks

`npm run typecheck`, `npm run lint` (ESLint and stylelint), `npm run format:check`, `npm test`. CI (`.github/workflows/ci.yml`) runs all of them plus the build on every PR.

`src/copy.test.ts` is the voice test. Every string in `src/copy.ts` must have no exclamation marks, no emoji and none of the banned words. ESLint stops user-facing strings appearing anywhere else.

## Working rules

`main` only changes through merged PRs. A pre-push hook (`scripts/refuse-push-to-main.mjs`, installed by `simple-git-hooks` on `npm ci`) refuses a direct push. GitHub can't enforce this on a free private repo.
