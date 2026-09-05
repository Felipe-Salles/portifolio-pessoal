---
phase: 05-security-hardening-deploy
plan: 03
subsystem: infra
tags: [github, vercel, deploy, ci-cd, dns, production, security-headers]

# Dependency graph
requires:
  - phase: 05-security-hardening-deploy
    provides: "05-01: vercel.json headers contract, verify:deploy gate (RED); 05-02: green audit:ci, verify:secrets gate"
provides:
  - "Public GitHub repo (github.com/Felipe-Salles/portifolio-pessoal), default branch main"
  - "Vercel project felipe-salles-projects/portifolio-pessoal, Git-connected for continuous deployment"
  - "Live production URL (https://portifolio-pessoal-seven-sigma.vercel.app) serving all six SEC-02/SEC-03 headers, verified on root + 404 paths"
  - "astro.config.mjs site: pointed at the real production origin — canonical/OG/sitemap/robots.txt all resolve to it live"
affects: [05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Continuous deployment via Vercel Git integration (push to main), never manual vercel deploy --prod"

key-files:
  created: []
  modified:
    - astro.config.mjs
    - public/robots.txt
    - .gitignore

key-decisions:
  - "Repo name portifolio-pessoal, visibility public, master renamed to main before publishing (Task 1 decision, pre-answered by the user via the orchestrator)"
  - "Production URL is the Vercel-assigned https://portifolio-pessoal-seven-sigma.vercel.app, not the clean https://portifolio-pessoal.vercel.app, because the clean subdomain was already taken by an unrelated project on another account — still satisfies D-01 (default Vercel subdomain, no custom domain)"
  - "No remediation ladder needed for DEPLOY-02 — the hand-authored vercel.json delivered all six headers correctly on the very first real deployment; staticHeaders: true stayed enabled in astro.config.mjs unchanged"

requirements-completed: [DEPLOY-01, DEPLOY-02, SEC-02, SEC-03]

# Metrics
duration: ~65min wall-clock (14:11-15:16), of which ~49min was a paused checkpoint awaiting a human action (granting the Vercel GitHub App repository access) — active execution time was closer to 16min
completed: 2026-09-04
---

# Phase 5 Plan 3: Publish to GitHub, Connect Vercel, Go Live Summary

**Portfolio is live in production at `https://portifolio-pessoal-seven-sigma.vercel.app` — public GitHub repo with Vercel Git-integration continuous deployment, all six SEC-02/SEC-03 headers verified against the real deployed URL (root + 404 probe, zero violations), and every absolute URL the site emits (canonical, og:url, og:image, sitemap, robots.txt) now resolves to the real origin instead of the RFC 2606 placeholder.**

## Production URL

**`https://portifolio-pessoal-seven-sigma.vercel.app`**

The "clean" `https://portifolio-pessoal.vercel.app` subdomain was already taken by an unrelated, pre-existing Vercel deployment on a different account (confirmed via `curl -sI` — it returns `X-Vercel-Error: DEPLOYMENT_NOT_FOUND` with an HSTS header carrying `preload`, a config this project's `vercel.json` never sets, proving it belongs to a different project). Vercel assigned the suffixed alias above as this project's actual production domain instead. This still satisfies D-01 (ship on the default Vercel-assigned subdomain, no custom domain purchased/pointed) — it is simply not byte-identical to the bare project name, which 05-RESEARCH.md had already flagged as an assumption to confirm at execution time, not a locked guarantee.

## Performance

- **Duration:** ~65 min wall-clock (first commit `3b25271` 14:11:38 → last commit `5dbab3f` 15:16:14), of which ~49 min (14:20-15:09) was a paused `checkpoint:human-action` waiting for the user to grant the Vercel GitHub App repository access in GitHub's UI — active agent execution time was roughly 16 min
- **Started:** 2026-09-04T14:11:38-03:00
- **Completed:** 2026-09-04T15:16:14-03:00
- **Tasks:** 3/3 completed (Task 1: decision recorded, no commands run; Task 2: GitHub + Vercel live, paused once on a human-action gate, then completed; Task 3: origin swap, completed)
- **Files modified:** 3 (astro.config.mjs, public/robots.txt, .gitignore) — no new files created, per Task 2's "infrastructure only" scope and Task 3's file list

## Accomplishments
- Published `github.com/Felipe-Salles/portifolio-pessoal` (public, default branch `main`) via `gh repo create --source=. --remote=origin --push`, after renaming the local `master` branch to `main`
- Created and Git-connected the Vercel project `felipe-salles-projects/portifolio-pessoal` (`vercel link` + `vercel git connect`)
- Diagnosed and worked through a genuine GitHub-App-repository-access gate (new repos are not auto-included when the Vercel GitHub App is scoped to "Only select repositories") — this required a real human action in GitHub's UI, correctly recognized as an authentication/authorization gate rather than something auto-fixable
- Landed the first Git-integration-triggered production deployment (no manual `vercel deploy` ever run) and confirmed `npm run verify:deploy` — the DEPLOY-02 gate authored RED in plan 05-01 — passes GREEN on the very first real deploy with **zero remediation-ladder rungs needed**: all six headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) delivered correctly by the hand-authored `vercel.json` on both `/` and the `/__gsd-404-probe` path
- Swapped `astro.config.mjs`'s `site:` placeholder (`https://portfolio-felipe-salles.example`) for the real production origin and deleted the resolved `TODO(Phase 5)` comment block
- Found and fixed a second, unplanned instance of the placeholder domain hardcoded in `public/robots.txt`'s `Sitemap:` line (a static file not derived from `astro.config.mjs`'s `site:` value, unlike every other SEO artifact) — caught by `verify-seo.mjs`'s live drift check, fixed as a Rule 1 auto-fix
- Redeployed via a second Git-integration push and reconfirmed `npm run verify:deploy` green, plus live-fetched confirmation that canonical/`og:url`/`og:image`/sitemap `<loc>`/robots.txt `Sitemap:` all resolve to the real production origin with zero occurrences of the placeholder anywhere in the live response

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirm GitHub repo name/visibility** — decision pre-answered by the user via the orchestrator; recorded in this SUMMARY, no commit (no code/config changed)
2. **Task 2: Publish to GitHub, connect Vercel, verify live headers** — `3b25271` (chore, incidental `.gitignore` update from `vercel link`), `2d48b31` + `5555878` (chore, initial trigger pushes — did not fire due to the GitHub App gate), `479c706` (docs, checkpoint state), `bec609f` (docs, STATE.md blocker), `d7dab13` (chore, retrigger push after the gate was resolved — this one landed), `0c90e76` (docs, Task 2 completion + production URL recorded)
3. **Task 3: Swap the placeholder origin for the real production domain** — `5dbab3f` (feat, `astro.config.mjs` site: + `public/robots.txt` fix)

**Plan metadata:** (this commit, following this SUMMARY.md update)

## Files Created/Modified
- `astro.config.mjs` — `site:` now `https://portifolio-pessoal-seven-sigma.vercel.app`; `TODO(Phase 5)` comment block removed; `adapter: vercel({ staticHeaders: true })` left unchanged (no remediation ladder needed)
- `public/robots.txt` — `Sitemap:` line updated to the real production origin (Rule 1 auto-fix, out of the plan's originally listed file set but required for `npm run verify` to pass)
- `.gitignore` — gained `.vercel` and `.env*` entries, appended automatically by `vercel link` (redundant with the pre-existing `.vercel/`/`.env`/`.env.production` entries, harmless)
- `.planning/phases/05-security-hardening-deploy/05-03-SUMMARY.md` — this file
- `.planning/STATE.md` — blocker recorded, then resolved

## Decisions Made
- Task 1's checkpoint:decision was pre-answered by the user via the orchestrator (repo name `portifolio-pessoal`, visibility `public`, `master`→`main` rename approved) — no `gh`/`vercel` command was run until Task 1's answer was recorded verbatim in this SUMMARY, per the plan's explicit constraint
- Kept the production URL as the Vercel-assigned suffixed alias rather than attempting to force the clean subdomain (e.g. via a custom-domain purchase) — out of scope per D-01, which explicitly defers custom domains
- No remediation ladder rung was needed for the CSP/header delivery — the plan's four-rung fallback (disable `staticHeaders`, then remove the adapter) was never invoked because `vercel.json` delivered every header correctly on the first real production deploy

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `public/robots.txt` still hardcoded the RFC 2606 placeholder origin**
- **Found during:** Task 3 (`npm run verify` after the `astro.config.mjs` site: swap)
- **Issue:** `scripts/verify-seo.mjs`'s `robots` check failed: `public/robots.txt`'s `Sitemap:` line was a static file with the old placeholder domain hand-typed in, not derived from `astro.config.mjs`'s `site:` value the way every other SEO artifact (canonical, OG, sitemap `<loc>`) is. Swapping `site:` alone did not update it.
- **Fix:** Updated `public/robots.txt`'s `Sitemap:` line to the real production origin
- **Files modified:** `public/robots.txt`
- **Verification:** `npm run build && npm run verify` — all 9 gates exit 0, `SEO SUMMARY ... robots=ok ... violations=0`; live-fetched `<production-url>/robots.txt` confirmed the correct `Sitemap:` value in production
- **Committed in:** `5dbab3f` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 - bug)
**Impact on plan:** Necessary for Task 3's own acceptance criteria (all nine `npm run verify` gates green, zero placeholder occurrences). No scope creep — file was not in the plan's listed `<files>` for Task 3 but is a direct, unavoidable consequence of the origin swap this task performs.

## Issues Encountered

- **GitHub App repository-access gate (recognized and handled as an authentication/authorization gate, not a bug):** After `gh repo create`, `vercel link`, and `vercel git connect` all completed successfully and reported the project as "connected," two test pushes to `main` (`2d48b31`, `5555878`) produced zero GitHub webhook deliveries, zero check-runs, and zero Vercel deployments — diagnosed via `gh api .../hooks` (empty), `gh api .../check-runs` (`total_count: 0`), and `vercel ls --prod`/`vercel project ls` (no production URL), cross-checked against this same Vercel team's other pre-existing projects which all had live production URLs (ruling out a CLI-auth or team-config problem). Root cause: the Vercel GitHub App's installation on this GitHub account was scoped to "Only select repositories," and a repo created moments earlier via `gh repo create` was not automatically included in that allow-list — `vercel link`/`vercel git connect` only write Vercel's own internal link record, they cannot grant the GitHub App's repository access, and GitHub's app-installation-management REST endpoints reject classic PATs, making this un-scriptable. Paused execution and returned a `checkpoint:human-action` with the exact two-minute browser fix (github.com/settings/installations → Vercel → Configure → Repository access → All repositories or add the repo). The user granted "All repositories" access; a fresh trigger push (`d7dab13`) then landed two Ready production deployments (the fresh push plus an earlier queued one retroactively picked up), both Git-integration-triggered, and execution resumed to completion without further issues.
- Some propagation lag was observed on GitHub's Checks API specifically (`check-runs` still reported `0` for ~2 minutes after access was granted and the deployment had actually already gone `Ready` per `vercel ls --prod`/`vercel inspect`) — not a blocker, just a reminder that `vercel ls --prod` is the more reliable signal to poll than GitHub's check-runs API for this integration.

## User Setup Required

**One manual browser action was required and has been completed:** granting the Vercel GitHub App repository access to the newly created `portifolio-pessoal` repo at https://github.com/settings/installations (Vercel → Configure → Repository access). No further action needed — the Git integration is now fully connected and every future push to `main` will deploy automatically.

## Next Phase Readiness
- The site is live, publicly reachable over HTTPS, and passes DEPLOY-01, DEPLOY-02, SEC-02, and SEC-03 against the real production URL
- `astro.config.mjs`'s `site:` is now the single source of truth for every absolute URL the site emits, pointed at the real origin — no placeholder remains anywhere in the repo or the live response
- Continuous deployment is fully operational: any future push to `main` triggers an automatic production deploy via Vercel's Git integration, no manual `vercel deploy` needed
- Production URL (`https://portifolio-pessoal-seven-sigma.vercel.app`) is recorded here verbatim for plan 05-04 to consume
- No blockers for plan 05-04

---
*Phase: 05-security-hardening-deploy*
*Completed: 2026-09-04*

## Self-Check: PASSED

- FOUND: astro.config.mjs
- FOUND: public/robots.txt
- FOUND: .gitignore
- FOUND: .planning/phases/05-security-hardening-deploy/05-03-SUMMARY.md
- FOUND: .planning/STATE.md
- FOUND commit 3b25271 (Task 2, .gitignore)
- FOUND commit 2d48b31 (Task 2, initial trigger push)
- FOUND commit 5555878 (Task 2, retry trigger push)
- FOUND commit 479c706 (Task 2, checkpoint state)
- FOUND commit bec609f (Task 2, STATE.md blocker)
- FOUND commit d7dab13 (Task 2, resolved retrigger push)
- FOUND commit 0c90e76 (Task 2, completion docs)
- FOUND commit 5dbab3f (Task 3, origin swap)
