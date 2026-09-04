---
phase: 05-security-hardening-deploy
plan: 01
subsystem: infra
tags: [vercel, csp, security-headers, hsts, astro-adapter, verify-gate]

# Dependency graph
requires:
  - phase: 01-foundation-design-system
    provides: scripts/verify-*.mjs gate contract (guard/violations-array/summary-line/exit-code), SEC-01 self-hosted-only build
  - phase: 04-seo-accessibility-polish
    provides: astro.config.mjs site: placeholder + TODO(Phase 5) marker, npm run verify chain (7 gates), src/components/Nav.astro's one inline script
provides:
  - "@astrojs/vercel adapter installed with staticHeaders: true"
  - "vercel.json declaring all six SEC-02/SEC-03 headers for every path"
  - "scripts/verify-csp-hash.mjs — build-time CSP hash drift + header-shape gate, wired into npm run verify (8th gate)"
  - "scripts/verify-deploy-headers.mjs — DEPLOY-02 live-header gate (verify:deploy, standalone, RED until plan 05-03 deploys)"
affects: [05-02-audit-hardening, 05-03-deploy]

# Tech tracking
tech-stack:
  added: ["@astrojs/vercel@^11.0.10"]
  patterns:
    - "Hand-authored vercel.json headers array as the primary CSP/HSTS/X-Frame-Options/etc. delivery mechanism, not Astro's staticHeaders auto-bridge (documented static-output reliability gap)"
    - "Build-time CSP-hash drift gate recomputes inline-script hashes from dist/ on every verify run instead of trusting a hand-hardcoded hash"
    - "Post-deploy-only gates (verify:deploy) stay outside the npm run verify chain since they require a live URL argument"

key-files:
  created:
    - vercel.json
    - scripts/verify-csp-hash.mjs
    - scripts/verify-deploy-headers.mjs
  modified:
    - astro.config.mjs
    - package.json
    - package-lock.json

key-decisions:
  - "CSP delivered via hand-authored vercel.json, not Astro's security.csp + staticHeaders auto-bridge, per 05-RESEARCH.md Pitfall 1 (documented history of the bridge not reliably delivering headers for output:\"static\")"
  - "HSTS ships as max-age=63072000; includeSubDomains with no preload token, per D-03"
  - "CSP ships as a real enforcing Content-Security-Policy header from the start, not Content-Security-Policy-Report-Only, per D-04"
  - "verify:deploy kept standalone (not chained into npm run verify) since it requires a live production URL argument and can only pass after plan 05-03 deploys"

patterns-established:
  - "Pattern: any new build-time gate follows the guard/violations-array/summary-line/exit-0-only-on-empty contract established by scripts/verify-no-external-origins.mjs"

requirements-completed: [SEC-02, SEC-03, DEPLOY-02]

# Metrics
duration: 46min (task commits) + npm dependency-install troubleshooting overhead (see Issues Encountered)
completed: 2026-09-04
---

# Phase 5 Plan 1: Security Headers Contract & Gates Summary

**Hand-authored vercel.json with all six SEC-02/SEC-03 headers (build-derived CSP script-src hash, no-preload HSTS), plus two new dependency-free Node ESM gates — a build-time CSP-hash drift check wired into npm run verify, and a standalone live-URL header gate (verify:deploy) that stays RED until plan 05-03 deploys.**

## Performance

- **Duration:** ~46 min across the three task commits (12:48–13:34 local); additional session time was spent recovering from a Windows-specific concurrent-npm-install collision (see Issues Encountered)
- **Started:** 2026-09-04T15:47:00Z (approx., first live network probe)
- **Completed:** 2026-09-04T16:34:21-03:00 (last task commit)
- **Tasks:** 3/3 completed
- **Files modified:** 6 (3 created: vercel.json, scripts/verify-csp-hash.mjs, scripts/verify-deploy-headers.mjs; 3 modified: astro.config.mjs, package.json, package-lock.json)

## Accomplishments
- Authored `scripts/verify-deploy-headers.mjs`, a dependency-free DEPLOY-02 gate that fetches `/` and a deliberately non-existent `/__gsd-404-probe` path off a real production URL and asserts CSP, HSTS (no preload), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, plus a vercel.json hash-drift check — proven able to fail against `https://example.com` (RED state)
- Installed `@astrojs/vercel@^11.0.10` and wired it into `astro.config.mjs` with `staticHeaders: true`, without displacing `dist/` (confirmed `astro build` still writes `dist/` and mirrors byte-identical output, including `og-image.png`, into `.vercel/output/static/`)
- Hand-authored `vercel.json` with all six SEC-02/SEC-03 headers for every path (`/(.*)`), with the CSP `script-src` hash (`sha256-9rao6+7BIzvFHjbooNK6nWAJiJNi1ORIwyjtuaVZ5Yo=`) computed live from the actual build rather than copied from the research doc
- Authored `scripts/verify-csp-hash.mjs`, a build-time drift gate recomputing every dist/ inline-script hash and re-validating all SEC-03 header values, wired as the 8th gate in `npm run verify`; proved it fails on 5 independent negative mutations (stale hash, dropped CSP directive, HSTS preload injection, wrong X-Frame-Options value, injected inline `<style>`) and on a missing `dist/`
- Confirmed `npm run verify` (all 8 gates) exits 0 with zero regressions to any Phase 1–4 gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the failing DEPLOY-02 live-header gate** - `4f9adc0` (feat)
2. **Task 2: Install the Vercel adapter and author the six security headers** - `f80d84b` (feat)
3. **Task 3: Add the CSP-hash drift gate and wire it into npm run verify** - `c1458c4` (feat)

**Plan metadata:** (this commit, following SUMMARY.md write)

## Files Created/Modified
- `scripts/verify-deploy-headers.mjs` - DEPLOY-02 live production header gate; standalone `verify:deploy` npm script, not part of the build-time chain
- `astro.config.mjs` - adds `@astrojs/vercel` adapter (`staticHeaders: true`); no `security.csp` key (CSP is hand-authored in vercel.json per D-04)
- `vercel.json` - new root config declaring CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy for every path
- `scripts/verify-csp-hash.mjs` - build-time CSP hash drift + header-shape gate, 8th entry in `npm run verify`
- `package.json` - `@astrojs/vercel` dependency, `verify:deploy` and `verify:csp-hash` script entries, `verify:csp-hash` appended to the composite `verify` chain
- `package-lock.json` - lockfile update for the new dependency

## Decisions Made
- Followed 05-RESEARCH.md's primary recommendation: `vercel.json` (not Astro's `staticHeaders`/`security.csp` bridge) is the verified CSP/HSTS/header delivery mechanism, since the bridge has a documented history of not reliably delivering headers for `output: "static"` builds
- Kept `verify:deploy` outside the `npm run verify` chain since it structurally requires a live production URL argument (post-deploy-only gate)
- No changes to `site:` config value or its `TODO(Phase 5)` comment — that swap is explicitly plan 05-03's responsibility (D-01)

## Deviations from Plan

None — plan executed exactly as written. All three tasks' acceptance criteria and automated `<verify>` blocks were run and passed as specified, including all negative-mutation proofs for Task 3.

## Issues Encountered

- **Windows concurrent-npm-install file corruption:** Multiple `npm install @astrojs/vercel` invocations across several tool-call turns ended up running concurrently (a consequence of the Bash tool auto-backgrounding long-running foreground commands and each subsequent turn starting a fresh install without confirming the prior one had actually finished). This produced `ENOTEMPTY` errors and left `node_modules/zod` and `node_modules/@cyberalien/svg-utils` with missing/incomplete files, which surfaced later as `ERR_MODULE_NOT_FOUND` during `astro build`. Resolved by: (1) identifying and killing the duplicate orphaned `npm-cli.js` processes via a PowerShell `Get-CimInstance Win32_Process` query (`tasklist`/`ps` don't expose command-line arguments on this environment), (2) removing the entire `node_modules/` directory, and (3) running a single clean `npm install` to completion, confirmed via `npm ls @astrojs/vercel` resolving cleanly and a full `npm run build` + `npm run verify` passing with zero errors. No source files were affected — `node_modules/` is gitignored and this was purely a local build-environment issue, not a repository-state issue.
- A subsequent attempt to rename `dist/` away (to test `scripts/verify-csp-hash.mjs`'s dist/-missing guard exactly as staged in Task 3's acceptance criteria) hit a Windows-level `EPERM`/permission-denied lock on the directory itself (likely antivirus/indexing, unrelated to the npm corruption above). Worked around by copying the gate script into an isolated scratch directory with no `dist/` present and confirming the guard message and exit code there instead — equivalent proof of the same code path, without touching the worktree's real `dist/`.

## User Setup Required

None - no external service configuration required. (D-02's GitHub/Vercel project linking is explicitly plan 05-03's responsibility, not this plan's.)

## Next Phase Readiness
- `vercel.json` and both new gates are ready for plan 05-03 to consume once the GitHub repo and Vercel project are linked and a real deployment exists
- `verify:deploy` is proven able to fail (RED state against `https://example.com`) and is ready to be run against the real `*.vercel.app` URL once DEPLOY-01 assigns it — this is the exact mechanism plan 05-03 will use to confirm SEC-02/SEC-03 landed correctly in production
- No blockers for plan 05-02 (npm audit / secret hygiene) or plan 05-03 (deploy) — both can proceed independently against this plan's committed state

---
*Phase: 05-security-hardening-deploy*
*Completed: 2026-09-04*
