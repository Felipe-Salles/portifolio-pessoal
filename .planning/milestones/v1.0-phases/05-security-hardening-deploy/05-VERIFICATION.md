---
phase: 05-security-hardening-deploy
verified: 2026-09-05T01:23:06Z
status: passed
score: 13/13 must-haves verified
overrides_applied: 0
---

# Phase 5: Security Hardening & Deploy Verification Report

**Phase Goal:** The live production site enforces the full security header set and is verified reachable over HTTPS with no known vulnerabilities.
**Verified:** 2026-09-05T01:23:06Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

This verification re-ran every automated gate the phase built (not just reading SUMMARY.md claims) directly against the live production URL `https://portifolio-pessoal-seven-sigma.vercel.app`, plus `curl -sI`, `npm run verify`, `npm run audit:ci`, and the Vercel CLI, to independently confirm the SUMMARY.md narrative.

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Production URL responds with CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, verified against the live URL | ✓ VERIFIED | Ran `curl -sI https://portifolio-pessoal-seven-sigma.vercel.app/` directly — all six headers present with correct values (CSP `default-src 'self'; script-src 'self' 'sha256-...'`, HSTS `max-age=63072000; includeSubDomains` no preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`). Also ran `node scripts/verify-deploy-headers.mjs <url>` myself: `DEPLOY SUMMARY ... csp=ok hsts=ok xfo=ok xcto=ok refpol=ok permpol=ok violations=0` on both `/` (200) and `/__gsd-404-probe` (404). Independently confirmed by Felipe's recorded securityheaders.com grade A (05-04-SUMMARY.md). |
| 2 | `npm audit` reports no known vulnerabilities and no secrets/API keys exist in client-shipped code before deploy | ✓ VERIFIED | Ran `npm run audit:ci` myself: `found 0 vulnerabilities`. Ran `npm run verify` (full 9-gate chain) myself: `SECRETS SUMMARY tracked_env=0 gitignore=ok src_files=9 env_refs=0 unsafe_env_refs=0 dist_files=9 token_matches=0 violations=0`. `package-lock.json` confirms the `path-to-regexp` override (6.1.0→6.3.0) is actually resolved in the dependency tree, not just declared. |
| 3 | Site is published on Vercel and reachable via HTTPS at the production URL | ✓ VERIFIED | `curl -sI` returned `HTTP/1.1 200 OK` over https. `git remote get-url origin` → `github.com/Felipe-Salles/portifolio-pessoal.git`; `gh repo view` confirms `defaultBranchRef.name=main`, `visibility=PUBLIC`. `npx vercel alias ls` confirms `portifolio-pessoal-seven-sigma.vercel.app` is a live alias of the current production deployment, and a `portifolio-pessoal-git-main-...` alias confirms Git-integration binding to `main`. `npx vercel ls --prod` shows a deployment 12 minutes old (correlates with a recent doc-only commit push), corroborating that push-to-main continuous deployment is actually wired, not just claimed. |

### Additional Plan-Level Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 4 | `vercel.json` declares all six SEC-02/SEC-03 headers for every path with D-03 (no preload) / D-04 (enforcing, not Report-Only) compliance | ✓ VERIFIED | Read `vercel.json` directly — single `/(.*)` entry, exactly six header keys, HSTS has no `preload` token, CSP has no `-Report-Only` suffix. |
| 5 | Build-time CSP hash drift gate (`verify:csp-hash`) is real and wired into `npm run verify` | ✓ VERIFIED | Read full script source — genuine SHA-256 recomputation from `dist/`, not a stub. Ran it live as part of `npm run verify`: `CSPHASH SUMMARY pages=3 inline_scripts=2 hashes=1 matched=1 stale=0 inline_styles=0 sec03=ok violations=0`. |
| 6 | Live-header gate (`verify:deploy`) is a real, dependency-free fetch-based check, not a placeholder | ✓ VERIFIED | Read full script source (273 lines) — genuine per-path fetch, per-header assertions, hash-drift cross-check against local `vercel.json`. Executed it against the real production URL myself (see truth #1). |
| 7 | SEC-04 secret-hygiene gate (`verify:secrets`) genuinely scans git index, `src/`, and `dist/` | ✓ VERIFIED | Read full script source — real `git ls-files` shell-out, real regex scans of `src/`/`dist/`, reports pattern names only (never leaking matched values). Ran it as part of `npm run verify`: zero violations. |
| 8 | `@astrojs/vercel` adapter installed with `staticHeaders: true`, `dist/` still produced | ✓ VERIFIED | `astro.config.mjs` shows `adapter: vercel({ staticHeaders: true })`. `npm run build` (part of `npm run verify`) confirmed `dist/` output still produced and `.vercel/output/static` mirrored (visible in build log: "Copying static files to .vercel/output/static"). |
| 9 | `astro.config.mjs` `site:` points at the real production origin, no placeholder/TODO remains | ✓ VERIFIED | Read `astro.config.mjs` — `site: "https://portifolio-pessoal-seven-sigma.vercel.app"`, no `.example` literal, no `TODO(Phase 5)` comment (confirmed via grep of the file — zero matches). |
| 10 | The font-CSP defect (base64-inlined `data:font` URIs blocked by `font-src 'self'`) is actually fixed in the current `astro.config.mjs`, not just claimed in SUMMARY | ✓ VERIFIED | Read `astro.config.mjs` — scoped `vite.build.assetsInlineLimit` predicate forces font extensions to stay real files. Ran `grep -r "data:font" dist/` myself after a fresh build — zero matches. Ran `node scripts/verify-live-csp.mjs <production-url>` myself against the live site: `LIVECSP SUMMARY url=... pages=2 csp_violations=0 console_errors=0 nav_toggle=ok violations=0` — zero live CSP violations, confirming the fix is deployed, not just committed locally. |
| 11 | Mobile nav toggle (hashed inline script) still executes under the enforcing CSP on the live site | ✓ VERIFIED | Same live Playwright run as truth #10: `nav_toggle=ok` — the gate clicked the real `[data-nav-toggle]` element on the live production URL and observed both `data-menu-open` state transitions succeed. |
| 12 | A human has confirmed the production URL loads over HTTPS, renders correctly, and an independent scanner grades the header set | ✓ VERIFIED (recorded human sign-off, not re-litigated) | 05-04-SUMMARY.md records Felipe's verbatim replies: HTTPS+render confirmed OK, clean console confirmed OK, mobile nav confirmed working (after investigating and ruling out a DevTools-emulation-only false report), custom 404 confirmed OK, securityheaders.com grade **A**, final reply **"Aprovado"**. Per task instructions this sign-off already happened and is not re-solicited by this verification. |
| 13 | Continuous deployment runs through Vercel's Git integration, never a manual `vercel deploy --prod` (D-02) | ✓ VERIFIED | `npx vercel alias ls` shows a `portifolio-pessoal-git-main-felipe-salles-projects.vercel.app` alias (Git-integration-managed, only exists when a project is Git-connected). `npx vercel ls --prod` shows a recent (12-minute-old) production deployment correlating with a recent push to `main`, not a manual CLI deploy. |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vercel.json` | Six SEC-02/SEC-03 headers for every path | ✓ VERIFIED | Read directly; single `/(.*)` rule, exactly 6 header keys, D-03/D-04-compliant values. Live `curl -sI` output byte-matches this file's declared values. |
| `scripts/verify-csp-hash.mjs` | Build-time CSP hash drift + header-shape gate | ✓ VERIFIED | 231 lines, real SHA-256 hashing logic, wired as gate 8/9 of `npm run verify`. Executed, zero violations. |
| `scripts/verify-deploy-headers.mjs` | DEPLOY-02 live production header gate | ✓ VERIFIED | 273 lines, real fetch-based logic. Executed against real production URL, zero violations. |
| `scripts/verify-no-client-secrets.mjs` | SEC-04 client-secret hygiene gate | ✓ VERIFIED | 240 lines, four real check groups (tracked-env/gitignore/src-env/dist-tokens). Executed, zero violations. |
| `scripts/verify-live-csp.mjs` | Real-browser CSP violation + inline-script-execution gate | ✓ VERIFIED | 230 lines, genuine Playwright chromium usage mirroring `verify-a11y.mjs`'s shape. Executed against real production URL, zero violations, `nav_toggle=ok`. |
| `astro.config.mjs` | Vercel adapter + real site origin + font-CSP fix | ✓ VERIFIED | All three present and correct; confirmed by direct read and live behavior (headers + zero data:font + zero CSP violations). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `package.json` | `scripts/verify-csp-hash.mjs` | `verify:csp-hash` in composite `verify` chain | ✓ WIRED | `npm run verify` output shows `verify:csp-hash` ran as gate 8, producing `CSPHASH SUMMARY ... violations=0`. |
| `package.json` | `scripts/verify-no-client-secrets.mjs` | `verify:secrets` in composite `verify` chain | ✓ WIRED | `npm run verify` output shows `verify:secrets` ran as gate 9, producing `SECRETS SUMMARY ... violations=0`. |
| `package.json` | `scripts/verify-deploy-headers.mjs` | `verify:deploy` standalone (outside `verify` chain) | ✓ WIRED (correctly excluded) | `grep verify` chain string does not contain `verify:deploy`; script runs standalone and I executed it successfully against the live URL. |
| `package.json` | `scripts/verify-live-csp.mjs` | `verify:live-csp` standalone (outside `verify` chain) | ✓ WIRED (correctly excluded) | Same pattern; executed standalone against the live URL, zero violations. |
| `package.json` | `npm audit` | `audit:ci` standalone pre-deploy gate | ✓ WIRED | Executed `npm run audit:ci` myself: `found 0 vulnerabilities`. Confirmed not chained into `verify`. |
| `astro.config.mjs` | `@astrojs/vercel` | `adapter: vercel({ staticHeaders: true })` | ✓ WIRED | Present in config; build log shows the adapter's `astro:build:done` hook copying to `.vercel/output/static`. |
| local repo | GitHub origin | `git remote` | ✓ WIRED | `git remote get-url origin` resolves to a real, public GitHub repo on `main`. |
| GitHub main | Vercel production | Git integration | ✓ WIRED | `vercel alias ls` shows a `-git-main-` alias; a recent deployment correlates with a recent push, not a manual deploy. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Live production headers match declared policy | `curl -sI https://portifolio-pessoal-seven-sigma.vercel.app/` | All six headers present, byte-matching `vercel.json` | ✓ PASS |
| DEPLOY-02 live gate | `node scripts/verify-deploy-headers.mjs <url>` | `DEPLOY SUMMARY ... violations=0` | ✓ PASS |
| Full local build+verify chain | `npm run verify` | All 9 gate summary lines report `violations=0` | ✓ PASS |
| Dependency audit | `npm run audit:ci` | `found 0 vulnerabilities` | ✓ PASS |
| Real-browser live CSP gate | `node scripts/verify-live-csp.mjs <url>` | `LIVECSP SUMMARY ... csp_violations=0 console_errors=0 nav_toggle=ok violations=0` | ✓ PASS |
| Font-CSP defect actually fixed in current build | `grep -r "data:font" dist/` after fresh build | 0 matches | ✓ PASS |
| Git integration wired (not manual deploy) | `npx vercel alias ls` / `npx vercel ls --prod` | `-git-main-` alias present; recent deploy correlates with recent push | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|--------------|--------|----------|
| SEC-02 | 05-01, 05-03, 05-04 | CSP restritiva via header HTTP real, verificada na URL de produção | ✓ SATISFIED | Live `curl`/`verify:deploy`/`verify:live-csp` all confirm; securityheaders.com grade A. |
| SEC-03 | 05-01, 05-03 | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy via `vercel.json` | ✓ SATISFIED | `vercel.json` declares all five; live headers confirmed via `curl`. |
| SEC-04 | 05-02 | Nenhum segredo exposto no client; `npm audit` sem vulnerabilidades | ✓ SATISFIED | `verify:secrets` zero violations; `audit:ci` zero vulnerabilities (both executed live, not just claimed). |
| DEPLOY-01 | 05-03, 05-04 | Site publicado na Vercel, acessível via HTTPS | ✓ SATISFIED | Live `curl -sI` returns 200 over https; human-confirmed full render (05-04-SUMMARY.md). |
| DEPLOY-02 | 05-01, 05-03, 05-04 | Headers verificados contra URL de produção real, não local | ✓ SATISFIED | `verify:deploy` and `verify:live-csp` both executed against the real production URL by this verifier, not `astro dev`/`preview`. |

**Cross-reference against REQUIREMENTS.md traceability table:** All five requirement IDs (SEC-02, SEC-03, SEC-04, DEPLOY-01, DEPLOY-02) are mapped to "Phase 5 | Complete" — no orphaned requirements found for this phase; every ID declared in the four plans' frontmatter (`requirements:`) is accounted for.

### Anti-Patterns Found

None. Scanned all phase-5-created/modified files (`vercel.json`, `astro.config.mjs`, `scripts/verify-deploy-headers.mjs`, `scripts/verify-csp-hash.mjs`, `scripts/verify-no-client-secrets.mjs`, `scripts/verify-live-csp.mjs`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — zero matches. No stub patterns (`return null`, empty handlers, hardcoded empty CSP arrays) found in any gate script; all four gate scripts contain genuine, non-trivial logic that was independently executed and produced real, non-vacuous results during this verification.

### Human Verification Required

None outstanding. The one item requiring human judgment (visual render, console cleanliness, mobile nav feel, and an independent securityheaders.com scan) was already completed and explicitly signed off by Felipe during plan 05-04 execution, with a verbatim record in `05-04-SUMMARY.md` (grade A, "Aprovado"). A real defect (font CSP violation) was caught and fixed mid-phase before this sign-off, and this verification independently re-confirmed the fix is live and that the site currently produces zero CSP violations and zero console errors against the real production URL.

### Gaps Summary

No gaps found. Every must-have — roadmap Success Criteria, plan-level truths, artifacts, key links, and requirement IDs — was independently verified against the live codebase and the live production deployment, not accepted on the strength of SUMMARY.md claims alone. All four gate scripts were read in full to confirm they contain real logic (not stubs), then executed by this verifier against the real production URL and the real local build, producing the same zero-violation results the SUMMARIES claimed.

---

*Verified: 2026-09-05T01:23:06Z*
*Verifier: Claude (gsd-verifier)*
