---
phase: 05-security-hardening-deploy
plan: 04
subsystem: infra
tags: [playwright, csp, security-headers, vercel, real-browser-verification]

# Dependency graph
requires:
  - phase: 05-security-hardening-deploy
    provides: "05-03: live production URL (https://portifolio-pessoal-seven-sigma.vercel.app), Git-integration continuous deployment, all six SEC-02/SEC-03 headers verified via curl-equivalent fetch"
provides:
  - "scripts/verify-live-csp.mjs — real-browser gate that loads the production URL and custom 404 page, asserts zero CSP violations/console errors, and exercises Nav.astro's mobile toggle to prove the enforcing CSP does not silently break the site's only inline script"
  - "verify:live-csp npm script (standalone, outside the composite verify chain — requires a live URL argument like verify:deploy)"
  - "A production CSP bug (data:font URIs from Vite's default asset-inlining threshold) found and fixed before it could linger undetected"
  - "Human sign-off (Felipe, 'Aprovado') on the live production site, including an independent securityheaders.com scan (grade A)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Real-browser (Playwright) post-deploy gate as a required complement to header-only fetch-based verification — a header-presence check cannot detect an enforcing CSP silently breaking an inline script or blocking a font"
    - "vite.build.assetsInlineLimit scoped by file-extension predicate, not a flat number — avoids coupling unrelated asset classes (fonts vs. small JS chunks) to the same inlining threshold"

key-files:
  created:
    - scripts/verify-live-csp.mjs
  modified:
    - package.json
    - astro.config.mjs

key-decisions:
  - "Fixed the font-CSP violation by scoping assetsInlineLimit to font extensions only (predicate function), not a flat assetsInlineLimit: 0 — the flat form also externalized Nav.astro's inlined script, which would have broken the script-src hash-pinning approach from Phase 5 plans 05-01/05-02"
  - "Narrowed the live gate's console-error filter to exclude Chromium's generic, URL-less 'Failed to load resource: the server responded with a status of NNN ()' diagnostic, and replaced its coverage with an explicit response-listener-based broken-subresource check (real URL + status attached) — stricter and more precise than the text match it replaced"
  - "DevTools-emulation nav-toggle visibility report from the human verifier was investigated and confirmed not a real defect (Playwright screenshot at the same 390x844 viewport against production showed the button present, 44x44 tap target, correct computed styles) — no code change made, documented as a transient DevTools-emulation-specific quirk"

requirements-completed: [SEC-02, DEPLOY-01, DEPLOY-02]

# Metrics
duration: ~6h43m wall-clock (2026-09-04T18:24:37Z–2026-09-05T01:07:41Z), the large majority spent paused across two merge+push+redeploy cycles and the Task 2 human-verification checkpoint relayed by the coordinator; active agent execution time was approximately 35-40 min across three work sessions
completed: 2026-09-05
---

# Phase 5 Plan 4: Real-Browser Live CSP Gate & Production Sign-Off Summary

**A Playwright-driven gate (`verify:live-csp`) that loads the real production URL under the enforcing CSP, immediately caught and helped fix a genuine live CSP violation (font files silently inlined as `data:` URIs), then confirmed zero violations and a working mobile nav — closing out Phase 5 with the developer's explicit "Aprovado" sign-off and a securityheaders.com grade of A.**

## Performance

- **Duration:** ~6h43m wall-clock (18:24:37 → 01:07:41), of which the large majority was two paused windows waiting on the coordinator's merge → push → Vercel redeploy cycles, plus the Task 2 human-verification checkpoint relayed by the coordinator to Felipe outside this agent's context. Active agent execution time (script authoring, local verification, bug diagnosis/fix, live re-checks) was roughly 35-40 min across three work sessions.
- **Started:** 2026-09-04T18:24:37Z
- **Completed:** 2026-09-05T01:07:41Z
- **Tasks:** 2/2 complete (Task 1: gate script + two Rule-1 bug fixes; Task 2: human sign-off, relayed by the coordinator)
- **Files modified:** 3 (`scripts/verify-live-csp.mjs` created, `package.json` and `astro.config.mjs` modified)

## Accomplishments

- Built `scripts/verify-live-csp.mjs`: a Playwright chromium gate that loads the production URL and `<origin>/__gsd-404-probe` at a 390x844 mobile viewport, collects `securitypolicyviolation` events plus console/page errors, and exercises `Nav.astro`'s mobile-menu toggle end-to-end (click → `data-menu-open="true"` → click → `data-menu-open="false"`) to prove the enforcing CSP does not silently break the site's one inline script
- The gate proved its value on its very first live run: it caught a real production CSP violation that the header-only `verify:deploy` gate structurally cannot detect — Vite's default 4096-byte `assetsInlineLimit` was base64-inlining small `@fontsource/jetbrains-mono` subset files as `data:font/...` URIs in the compiled CSS, which the enforcing `font-src 'self'` directive correctly blocked in a real browser
- Fixed the root cause with a scoped `vite.build.assetsInlineLimit` predicate (forces only font file extensions to stay real same-origin files; defers to Vite's default byte-size heuristic for everything else) after discovering that the naive flat `assetsInlineLimit: 0` fix had an unwanted side effect — it also externalized `Nav.astro`'s previously-inlined script, which would have broken the CSP `script-src` hash-pinning approach established in Phase 5 plans 05-01/05-02
- After the coordinator merged, pushed, and redeployed that fix, a second live run surfaced exactly one remaining violation — Chromium's own generic "Failed to load resource: the server responded with a status of 404 ()" diagnostic on the deliberately-probed 404 page. Diagnosed with a response-listener capture showing every actual subresource returned 200 and the 404 was correctly the intended top-level navigation outcome — a gate design bug, not a site defect. Fixed by narrowing the console-error filter to exclude that specific generic message and adding an explicit `response`-listener-based broken-subresource check (real URL + status attached) as strictly better replacement coverage
- After the coordinator's second merge+push+redeploy cycle, all four required automated gates ran green against the live production URL, and Felipe (the developer) completed Task 2's full manual sign-off, including an independent securityheaders.com scan

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the real-browser live CSP gate** — `3995e1e` (feat: gate script + `verify:live-csp` npm script + the font-CSP Rule 1 fix in `astro.config.mjs`), `9ab6973` (fix: narrowed the console-error filter + added the response-based broken-subresource check, a second Rule 1 fix surfaced by the coordinator's post-redeploy live re-run)
2. **Task 2: Human sign-off on the live production site** — no code commit; the coordinator ran all four automated gates against production, relayed the six verification steps to Felipe directly, and recorded his replies (below). No code change resulted from Task 2.

**Plan metadata:** (this commit, following this SUMMARY.md)

## Files Created/Modified

- `scripts/verify-live-csp.mjs` — new. Real-browser CSP-violation + inline-script-execution gate against the live production URL (229 lines)
- `package.json` — added `verify:live-csp` script after `audit:ci`, deliberately excluded from the composite `verify` chain (requires a live URL argument, same pattern as `verify:deploy`)
- `astro.config.mjs` — added a scoped `vite.build.assetsInlineLimit` predicate forcing font files to stay real same-origin files, fixing the live CSP violation the new gate caught

## Decisions Made

- Scoped `assetsInlineLimit` to font extensions via a predicate function rather than a flat `assetsInlineLimit: 0` — the flat form also externalized `Nav.astro`'s previously-inlined script (the same Vite size-threshold heuristic governs both), which would have silently broken the CSP `script-src` hash-pinning approach from earlier Phase 5 plans. The predicate form leaves every other asset class (including that script chunk) on Vite's default heuristic, touching only font files.
- Replaced a fragile generic-text console-error match with an explicit `response`-listener-based broken-subresource check (real URL + status code attached) instead of just special-casing the 404-probe page — this is strictly more precise and catches a genuinely broken subresource on ANY page, not just the deliberately-probed one, while still correctly excluding Chromium's own redundant, unattributed navigation-status diagnostic.
- Kept the negative-proof design (Task 1's `<verify>` block) working through both fixes: `PROD_URL` itself (whatever URL is passed as `argv[2]`) is always the page the inline-script check runs against, which is what let `.../sitemap-0.xml` serve as a reusable "no toggle present" negative-proof fixture without any special-casing in the gate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Production CSP violation: fonts silently inlined as `data:` URIs**
- **Found during:** Task 1, the gate's very first run against the live production URL
- **Issue:** Vite's default 4096-byte `assetsInlineLimit` was base64-inlining small `@fontsource/jetbrains-mono` woff/woff2 subset files directly into the compiled CSS as `data:font/...` URIs. The enforcing `font-src 'self'` CSP directive (no `data:` grant) correctly blocked these in a real browser — 18 violations across the two probed pages, none of which the header-only `verify:deploy` gate could ever detect (it doesn't load a page).
- **Fix:** Added a scoped `vite.build.assetsInlineLimit` predicate in `astro.config.mjs` that returns `false` (never inline) for font file extensions (`.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`) and `undefined` (default heuristic) for everything else. A flat `assetsInlineLimit: 0` was tried first but also externalized `Nav.astro`'s inlined script — reverted in favor of the scoped predicate once that side effect was caught by `verify:csp-hash` going stale.
- **Files modified:** `astro.config.mjs`
- **Verification:** Rebuilt `dist/` — zero `data:font` occurrences anywhere; `npm run verify` all 9 gates green including `verify:csp-hash` (`matched=1 stale=0`); after the coordinator's merge+push+redeploy, `npm run verify:live-csp <production-url>` showed `csp_violations=0`
- **Committed in:** `3995e1e`

**2. [Rule 1 - Bug] Gate design bug: deliberate 404-probe's own navigation status treated as a violation**
- **Found during:** the coordinator's live re-run against production immediately after the first redeploy (fix #1 above)
- **Issue:** After fix #1 landed, exactly one violation remained: a console error reading `Failed to load resource: the server responded with a status of 404 ()` on the `/__gsd-404-probe` page. Diagnosed with a Playwright response-listener capture of every request on that page — all actual subresources (two CSS files, two fonts) returned 200; the only 404 was the top-level document navigation itself, which is the correct, intended outcome of deliberately probing a nonexistent path to exercise the custom 404 template (the exact same status `verify-deploy-headers.mjs` already asserts as expected). This was a false positive in the gate's own console-error listener, not a site defect.
- **Fix:** Narrowed the console-error filter with an exact regex (`^Failed to load resource: the server responded with a status of \d+ \(\)$`) that excludes only this specific generic, URL-less Chromium diagnostic — it can never mask a real CSP "Refused to ..." message or an application `console.error()` call, since neither matches that fixed text. Replaced its lost coverage with a `response`-listener-based `broken-subresource` check that flags any actual non-document request returning status ≥ 400, attaching its real URL and status — strictly more precise than the text match it replaced, and not limited to the 404-probe page.
- **Files modified:** `scripts/verify-live-csp.mjs`
- **Verification:** Re-ran the full acceptance-criteria suite locally (no-arg guard, https guard, negative `inline-script-blocked` proof against `.../sitemap-0.xml`) — all still pass exactly as before. Ran against the live production URL: `LIVECSP SUMMARY url=https://portifolio-pessoal-seven-sigma.vercel.app pages=2 csp_violations=0 console_errors=0 nav_toggle=ok violations=0`, exit 0. After the coordinator's second merge+push+redeploy, the coordinator independently re-ran the same command against the freshly redeployed production URL and confirmed the identical clean result.
- **Committed in:** `9ab6973`

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bug)
**Impact on plan:** Both fixes were necessary for Task 1's own acceptance criteria (`violations=0` against the real production URL) and directly validate the plan's stated purpose — proving a header-presence check cannot catch what a real browser can. No scope creep: fix #1 touched only `astro.config.mjs`'s asset-inlining config (a Phase 1-era build setting, not new infrastructure); fix #2 touched only the new gate script itself.

## Issues Encountered

- **DevTools-emulation nav-toggle visibility report (investigated, not a real defect):** During Task 2's manual verification, Felipe initially reported the hamburger toggle button wasn't visible in Chrome DevTools' device-emulation mode. The coordinator diagnosed this directly with a Playwright screenshot at the same 390x844 viewport against the live production URL, which showed the button present and correctly rendered (44x44 tap target, 16x16 cyan menu icon, computed styles `display:flex`, `visible:true`, `color: rgb(0,240,255)`). Felipe then re-tested in a normal (non-emulated) browser window and confirmed the toggle opens and closes correctly. This is documented as a transient DevTools-device-emulation-specific quirk on the developer's end, not a site defect — no code change was made or needed.
- Both merge+push+redeploy cycles (one per Rule 1 fix) required pausing this worktree agent and handing control to the coordinator, since a worktree-isolated agent does not push to `origin/main` itself — consistent with this project's Git-integration-only deploy workflow (D-02) and this session's worktree-isolation rules.

## User Setup Required

None — no external service configuration required. Task 2's human sign-off was a one-time manual verification pass, not an ongoing setup step.

## Task 2: Human Sign-Off Record

**Automated gates confirmed green before the human was asked to verify anything** (all re-run by the coordinator against the live, twice-redeployed production URL):

```
npm run verify                                                          → exit 0, all 9 local gates pass
npm run audit:ci                                                        → "found 0 vulnerabilities"
npm run verify:deploy https://portifolio-pessoal-seven-sigma.vercel.app → DEPLOY SUMMARY ... violations=0
npm run verify:live-csp https://portifolio-pessoal-seven-sigma.vercel.app → LIVECSP SUMMARY url=https://portifolio-pessoal-seven-sigma.vercel.app pages=2 csp_violations=0 console_errors=0 nav_toggle=ok violations=0
```

**Production URL presented to the developer:** `https://portifolio-pessoal-seven-sigma.vercel.app`

**Verification steps and Felipe's replies:**

1. **HTTPS + full render** ("Confirm the address bar shows `https://` with a valid padlock, and that the page renders the full portfolio") — **Confirmed OK**
2. **Clean console** ("Open DevTools → Console and reload. Confirm there are no red errors, in particular nothing beginning with 'Refused to'") — **Confirmed OK**
3. **Mobile nav toggle** ("Narrow the window to phone width... click the nav toggle... confirm the overlay opens/closes") — Felipe initially reported the toggle wasn't visible in Chrome DevTools device-emulation mode; investigated and confirmed not a real defect (see Issues Encountered above); Felipe re-tested in a normal browser window and **confirmed the toggle opens and closes correctly**
4. **Custom 404 page** ("Visit a nonexistent path, confirm the custom 404 page renders with the same nav and layout") — **Confirmed OK**
5. **securityheaders.com scan** ("Scan the production URL, confirm grade A or better, all six headers present") — **Grade: A**
6. **Final sign-off** — **"Aprovado"**

All six steps pass; the securityheaders.com grade is A (meets the "A or better" bar); no open gap is recorded.

## Next Phase Readiness

- SEC-02 (enforcing CSP verified by a real browser, zero violations, inline script still executes), DEPLOY-01 (human-confirmed HTTPS + full render + custom 404), and DEPLOY-02 (live header set verified both by this project's own gates and by securityheaders.com's independent scan, grade A) are all satisfied and signed off.
- This completes plan 05-04 and **all of Phase 5 (Security Hardening & Deploy)** — the last phase of the v1.0 milestone roadmap. No further phases are planned; the site is live, verified, and signed off by the developer.
- No blockers or open gaps carried forward.

---
*Phase: 05-security-hardening-deploy*
*Completed: 2026-09-05*

## Self-Check: PASSED

- FOUND: scripts/verify-live-csp.mjs
- FOUND: package.json
- FOUND: astro.config.mjs
- FOUND commit 3995e1e (Task 1, gate script + font-CSP fix)
- FOUND commit 9ab6973 (Task 1, console-filter fix)
