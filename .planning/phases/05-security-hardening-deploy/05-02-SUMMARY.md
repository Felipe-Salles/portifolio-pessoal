---
phase: 05-security-hardening-deploy
plan: 02
subsystem: infra
tags: [npm-audit, secret-scanning, verify-gate, dependency-hygiene, path-to-regexp]

# Dependency graph
requires:
  - phase: 01-foundation-design-system
    provides: scripts/verify-*.mjs gate contract (guard/violations-array/summary-line/exit-code)
  - phase: 05-security-hardening-deploy
    provides: "05-01: vercel.json headers, verify:csp-hash gate, npm run verify chain (8 gates)"
provides:
  - "scripts/verify-no-client-secrets.mjs — SEC-04 client-secret hygiene gate (tracked-env, gitignore, src-env, dist-tokens groups), wired into npm run verify (9th gate)"
  - "audit:ci — standalone npm audit --audit-level=high pre-deploy gate over the full dependency tree, currently green"
  - "package.json overrides pin forcing path-to-regexp to 6.3.0 everywhere in the tree (remediates GHSA-9wv6-86v2-598j)"
affects: [05-03-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "npm `overrides` field used to force a patched version of a doubly-transitive dependency (path-to-regexp, pinned exactly by @vercel/routing-utils) without touching the direct dependency (@astrojs/vercel) at all"

key-files:
  created:
    - scripts/verify-no-client-secrets.mjs
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "SEC-04 secret-hygiene gate implemented as four independent check groups (tracked-env, gitignore, src-env, dist-tokens) per 05-RESEARCH.md's explicit three-part approach (extended to four to add the gitignore regression barrier) — no gitleaks/trufflehog, matching the project's zero-third-party-dependency verify-*.mjs house style"
  - "path-to-regexp ReDoS (GHSA-9wv6-86v2-598j) remediated via a package.json `overrides` pin to 6.3.0, not via `npm audit fix --force` — the only force-fix path downgrades @astrojs/vercel to 8.0.4, whose peerDependencies require astro ^5.0.0 (incompatible with this project's astro@^7.2.10) and would reintroduce the staticHeaders reliability issues 05-RESEARCH.md Pitfall 1 already routed around in plan 05-01"
  - "audit:ci kept as a standalone npm script, not chained into the composite verify pipeline, per 05-PATTERNS.md's package.json verify-chain wiring guidance"

patterns-established:
  - "Pattern: a deeply-transitive vulnerable dependency pinned by an exact version (not a range) in a third-party package can be remediated via package.json overrides rather than a breaking direct-dependency downgrade — verify peer-dependency compatibility of any `npm audit fix --force` suggestion via `npm view <pkg>@<version> peerDependencies` before attempting it"

requirements-completed: [SEC-04]

# Metrics
duration: ~40min (2 task commits, ~13min of which was npm audit fix's first-time full node_modules install in this worktree)
completed: 2026-09-04
---

# Phase 5 Plan 2: Client-Secret Hygiene & Dependency Audit Gates Summary

**A dependency-free SEC-04 secret-hygiene gate (git index + src/ + dist/) plus a green `npm audit --audit-level=high` pre-deploy gate, with the one real finding (a path-to-regexp ReDoS pinned two levels deep under `@astrojs/vercel`) fixed via a package.json `overrides` pin rather than a breaking adapter downgrade.**

## Performance

- **Duration:** ~40 min wall-clock across the two task commits (13:43–14:03 local), of which ~13 min was `npm audit fix`'s first full `node_modules` install in this worktree (this worktree had no prior `node_modules`; Node's upward module resolution had been silently using an ancestor directory's `node_modules` for `npm run build`/`node scripts/*.mjs` until this install ran)
- **Started:** 2026-09-04T13:41:00-03:00 (approx., after worktree branch check)
- **Completed:** 2026-09-04T14:03:44-03:00 (last task commit)
- **Tasks:** 2/2 completed
- **Files modified:** 3 (1 created: scripts/verify-no-client-secrets.mjs; 2 modified: package.json, package-lock.json)

## Accomplishments
- Authored `scripts/verify-no-client-secrets.mjs`, a dependency-free Node ESM SEC-04 gate with four independent check groups (`tracked-env`, `gitignore`, `src-env`, `dist-tokens`), each accumulating into one shared violations array; wired as the 9th and final entry in `npm run verify`
- Proved the gate can actually fail via four negative probes: an AWS-key-shaped token written to `dist/`, an unsafe `import.meta.env.SECRET_API_KEY` reference written to `src/`, a temporarily-stripped `.env` line from `.gitignore`, and (via an isolated scratch-directory copy of the script, working around a Windows `EPERM` lock on renaming `dist/` directly — same workaround plan 05-01 documented) a missing `dist/` guard
- Added the standalone `audit:ci` gate (`npm audit --audit-level=high`, full tree, no `--omit=dev`), deliberately left outside the `npm run verify` chain
- `npm run audit:ci` initially surfaced 3 high-severity findings, all the same underlying advisory (GHSA-9wv6-86v2-598j, path-to-regexp ReDoS) reached through `@astrojs/vercel` → `@vercel/routing-utils` (which pins an exact, vulnerable `path-to-regexp@6.1.0`)
- Worked the plan's 4-step remediation ladder: `npm audit fix` found no non-breaking fix; no newer `@astrojs/vercel` exists to bump to (11.0.10 is the latest published version and still carries the vulnerable pin); `npm audit fix --force`'s only offered fix downgrades to `@astrojs/vercel@8.0.4` — verified via `npm view @astrojs/vercel@8.0.4 peerDependencies` that this requires `astro: ^5.0.0`, incompatible with this project's `astro@^7.2.10`, so it was not attempted; instead added a `package.json` `overrides` pin forcing `path-to-regexp` to `6.3.0` (the first patched release after the vulnerable `4.0.0 - 6.2.2` range) everywhere in the tree
- Confirmed the override actually resolves: `npm install` shows `found 0 vulnerabilities`, `npm run audit:ci` exits 0, and a full `npm run verify` (all 9 gates, including the new `verify:secrets`) still exits 0 with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the SEC-04 client-secret hygiene gate** - `4b04c2d` (feat)
2. **Task 2: Add the pre-deploy npm audit gate and clear its findings** - `5ca1168` (fix)

**Plan metadata:** (this commit, following SUMMARY.md write)

## Files Created/Modified
- `scripts/verify-no-client-secrets.mjs` - SEC-04 gate: no `.env*` tracked by git, `.gitignore` still ignores `.env`, no unsafe `import.meta.env.*` reference in `src/`, no secret-shaped token in `dist/`; prints `SECRETS SUMMARY ...` and is the 9th/last gate in `npm run verify`
- `package.json` - `verify:secrets` entry appended to the `verify` chain; standalone `audit:ci` entry (`npm audit --audit-level=high`); new top-level `overrides` block pinning `path-to-regexp` to `6.3.0`
- `package-lock.json` - `path-to-regexp` resolution bumped from `6.1.0` to `6.3.0` throughout the tree (npm-generated diff, 3 lines changed, no hand edits)

## Decisions Made
- Used a `package.json` `overrides` pin instead of `npm audit fix --force` to remediate the sole audit finding — this is a real fix (forces the patched `path-to-regexp` release), not a suppression, and avoids a guaranteed-broken `@astrojs/vercel@8.0.4` downgrade (peer dep `astro: ^5.0.0` vs. installed `astro@7.2.10`)
- Kept `audit:ci` standalone per 05-PATTERNS.md, not chained into `npm run verify`
- `src-env` and `dist-tokens` check groups report by pattern/variable NAME only, never the matched value, so the gate's own stderr output can never itself become a secret leak

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `npm audit fix --force`'s suggested downgrade verified incompatible before attempting it**
- **Found during:** Task 2 (pre-deploy npm audit gate)
- **Issue:** The plan's remediation ladder step 3 (`npm audit fix --force`) is the only path npm itself offers to clear the finding without an override, but blindly running it would install `@astrojs/vercel@8.0.4`
- **Fix:** Verified via `npm view @astrojs/vercel@8.0.4 peerDependencies` that this version requires `astro: ^5.0.0`, a hard incompatibility with this project's `astro@^7.2.10` (pinned per CLAUDE.md). Skipped the force-install (which the plan's own ladder permits skipping when it "leaves `npm run verify` broken") and used a `package.json` `overrides` pin to `path-to-regexp@6.3.0` instead — a real, verified fix (confirmed via `npm audit` reporting 0 vulnerabilities and a full green `npm run verify`) rather than a downgrade or a silent suppression
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm install` → `found 0 vulnerabilities`; `npm run audit:ci` exits 0; `npm run verify` (all 9 gates) exits 0
- **Committed in:** `5ca1168` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 - bug/blocking-issue judgment call, staying within Task 2's own documented remediation-ladder discretion)
**Impact on plan:** No scope creep — this is exactly the "Claude's Discretion: remediation approach is decided per finding at execution time" call the plan and 05-CONTEXT.md both explicitly delegate to the executor. Task 2's acceptance criteria (`audit:ci` exits 0, `verify` exits 0, `package-lock.json` changes produced by npm not hand edits) are all met.

## Issues Encountered
- **Worktree had no prior `node_modules`:** Unlike a normal working checkout, this worktree's `node_modules/` was essentially empty (only `.astro`/`.vite` cache dirs) at the start of Task 2 — `npm run build`/`node scripts/*.mjs` had been silently succeeding by way of Node's upward directory resolution finding a `node_modules` in an ancestor directory. Running `npm audit fix` triggered a genuine from-scratch install of 378 packages into this worktree's own `node_modules`, which took ~13 minutes on this Windows environment (no local npm cache warm for this worktree). This did not corrupt anything (unlike the ENOTEMPTY issue documented in 05-01-SUMMARY.md) — it completed cleanly on the first attempt — but it did make Task 2 the long pole of this plan's duration. No further action needed; `node_modules/` is gitignored and this is a one-time local-environment cost, not a repository-state issue.
- Same Windows `EPERM`/permission-denied lock on renaming `dist/` directly (antivirus/indexing, documented in 05-01-SUMMARY.md) recurred for the dist/-missing negative probe in Task 1; worked around identically by copying the gate script into an isolated scratch directory with no `dist/` present.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both SEC-04 gates (`verify:secrets` in the `npm run verify` chain, and standalone `audit:ci`) are green and committed, ready for plan 05-03 to run one final time immediately before publishing the repo
- The full `npm run verify` chain now runs 9 gates (`verify:sec01` through `verify:secrets`) and exits 0
- No blockers for plan 05-03 (deploy) — the `package.json`/`package-lock.json` state this plan produced is exactly what plan 05-03 should build from; no further dependency changes anticipated before deploy

---
*Phase: 05-security-hardening-deploy*
*Completed: 2026-09-04*

## Self-Check: PASSED

- FOUND: scripts/verify-no-client-secrets.mjs
- FOUND: .planning/phases/05-security-hardening-deploy/05-02-SUMMARY.md
- FOUND commit 4b04c2d (Task 1)
- FOUND commit 5ca1168 (Task 2)
- FOUND commit 5428e8a (SUMMARY.md)
