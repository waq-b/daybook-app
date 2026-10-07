# What the automated checks cover

The rule on this project is that anything I'd otherwise check by hand on a phone should be an automated test. This maps each manual check from PRs #13 to #60 to the test that now covers it. What a machine can't do is listed at the end.

## How it runs

| Suite | What | When |
| --- | --- | --- |
| Unit (`npm test`) | rules, voice, tokens, safe areas, outbox | every PR |
| Database (`npm run test:db`) | RLS, constraints, export and delete, against real Postgres | every PR |
| E2E (`npm run e2e`) | every screen and state, on **Android Chrome** and **iPhone Safari (WebKit)** | every PR |
| Update check (`npm run check:update`) | a new version reaches an already-open app | every PR |
| **Live** (`npm run e2e:live`) | the real site and the real database, both phones | after every deploy (`live.yml`) |

What the iPhone project can't cover: Playwright can't intercept requests from a WebKit page a service worker controls, so the service worker is off there. Opening offline and updates are tested on Chromium, and the live suite checks the real build's service worker.

## Coverage map

| Former phone check | Covered by |
| --- | --- |
| #13 site and `/api/health` load; the deploy serves the new commit | live `site.spec` "the deploy is live and serving the expected commit" (checks the exact commit) |
| #14 `/dev/states` in Atkinson; rating selects, flag turns on; no sideways scroll | live `site.spec` fonts; e2e `controls.spec` rating/flag; `hierarchy-a11y`, `text-size` overflow |
| #15 Add to Home Screen icon and name; standalone; offline open; Android install | e2e `pwa.spec` manifest/icons/iOS tags, service worker offline (Chromium); live `site.spec` installable; `install.spec` Android |
| #15/#16 clears the notch and home indicator | unit `safeArea.test` (every bottom bar), `viewport-fit=cover` in `pwa.spec` |
| #16 tabs switch; largest text; no sideways scroll | e2e `shell.spec`; every a11y spec at 200% on **both** phones |
| #18 sign-in with a code; the code field suggests from Mail; stays signed in | e2e `sign-in.spec` (both phones); live `site.spec` sign-in page |
| #18 an email arrives from Daybook with a code | **not automatable** (needs a real inbox); checked once by hand |
| #20 iPhone install steps in Safari, never in the installed app | e2e `install.spec` on the iPhone project |
| #21 export file; delete two steps; sign out | e2e `settings.spec`: download on Android, **share sheet on iPhone**; delete and sign out |
| #32 DATE/TIME open the wheels; the text box grows without zoom | e2e `fields.spec` (both phones: native date/time inputs, ≥16px, 56px target); the wheel itself is iOS's own |
| #34–#36 new session, list, detail, mark done, offline save | e2e `session-edit`, `sessions-list`, `session-detail` (both phones) |
| #54 each control works; the chart's numbers don't overlap | e2e `controls.spec`, including the overlap check for both score orders |
| #55–#60 practices, ladder, add task, task detail, Log a rep offline, draft survives, link to a session | e2e `practices`, `ladder`, `add-task`, `task-detail`, `log-rep` (offline → one row), `session-practices` (both phones) |
| Sign-up closed; strangers can't read or write | live `database.spec` against the real Supabase |

## Not automated

- That a sign-in email actually arrives (needs a real inbox).
- The iOS date and time wheels themselves; the tests check the native inputs, sizes and targets.
