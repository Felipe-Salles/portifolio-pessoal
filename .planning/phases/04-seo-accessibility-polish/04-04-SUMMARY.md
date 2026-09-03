---
phase: 04-seo-accessibility-polish
plan: 04
subsystem: a11y
tags: [playwright, axe-core, wcag, contrast, sharp, wcag-contrast, verify-script, build-gate]

# Dependency graph
requires:
  - phase: 04-seo-accessibility-polish
    plan: 01
    provides: playwright + @axe-core/playwright + sharp + wcag-contrast toolchain installed, astro.config.mjs site URL
  - phase: 04-seo-accessibility-polish
    plan: 02
    provides: src/pages/404.astro, dist/404.html build output
  - phase: 04-seo-accessibility-polish
    plan: 03
    provides: scripts/verify-seo.mjs, six-gate npm run verify chain to extend
provides:
  - scripts/verify-a11y.mjs — real-browser axe-core scan (WCAG2A+WCAG2AA) of "/" and "/404.html" plus a deterministic pixel-sampling contrast triage for every color-contrast result axe reports as incomplete
  - npm run verify:a11y — standalone gate entry point
  - npm run verify — now seven gates (sec01, tokens, shell, sections, schema, seo, a11y), all green
affects: [phase-05-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@axe-core/playwright requires an explicit browser.newContext()/context.newPage() — browser.newPage()'s implicit context throws 'Please use browser.newContext()' at analyze() time"
    - "locator.screenshot() (not page.screenshot({clip})) for below-the-fold pixel sampling — clip-based screenshots are bound to the current viewport and silently fail on any element scrolled out of view; locator.screenshot() auto-scrolls first"
    - "Coverage counter distinct from a 'passed' counter when asserting no entry falls through unaccounted — asserting resolved-count-equals-total conflates 'accounted for' with 'passed', which double-flags genuine failures"

key-files:
  created:
    - scripts/verify-a11y.mjs
  modified:
    - package.json

key-decisions:
  - "Broadened the color-contrast incomplete-deferral scope beyond .glass-panel/.border-glow-cyan to every color-contrast incomplete result, after live axe scan evidence showed the composited-background blind spot also hits Nav.astro's bar (bg-background/60 backdrop-blur-xl, same pattern under a different class) and Hero text sitting directly on body's bg-grid-pattern + glow-cloud-* divs with no glass wrapper at all — the deterministic pixel-sampling answer is authoritative for any element axe cannot resolve, not just the two named primitives"
  - "processedDeferred (accounted-for) tracked separately from incompleteResolved (passed) for the fall-through coverage assertion, so a genuine contrast failure produces exactly one clear violation instead of a duplicate misleading 'fell through' message"
  - "locator.screenshot() replaces the plan's page.screenshot({clip}) sketch — the sketch's clip coordinates are viewport-relative and fail on the many contrast-check targets below the fold on this page"

patterns-established:
  - "Real-browser a11y gate: astro preview() + Playwright + @axe-core/playwright + sharp/wcag-contrast pixel-sampling fallback for axe's documented layered-transparency blind spot — reusable for any future glassmorphism/atmospheric-background page this project adds"

requirements-completed: [A11Y-03, A11Y-04]

# Metrics
duration: 40min
completed: 2026-09-03
---

# Phase 4 Plan 4: Accessibility Verification Gate (A11Y-03/A11Y-04) Summary

**New `scripts/verify-a11y.mjs` build gate drives real headless Chromium via `@axe-core/playwright` across both built routes on the WCAG 2 A+AA ruleset, then resolves every axe `color-contrast` "incomplete" result — broadened at execution time to cover the page's entire atmospheric-background surface, not just `.glass-panel`-scoped elements — with a deterministic pixel-sampling contrast check (sharp + wcag-contrast); wired in as the seventh and final `npm run verify` gate, all green.**

## Performance

- **Duration:** ~40 min (including a from-scratch `npm install` in this worktree's empty `node_modules`)
- **Tasks:** 2/2 completed
- **Files modified/created:** 2

## Accomplishments

- `scripts/verify-a11y.mjs` boots Astro's programmatic `preview()` on port 4326 (distinct from `generate-og-image.mjs`'s port 4325) plus a headless Chromium via Playwright, scans `/` and `/404.html` with `new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa"]).analyze()` against an explicit `browser.newContext()`/`context.newPage()` (required — `browser.newPage()`'s implicit context throws at `analyze()` time)
- Every axe `violations` entry fails the gate unconditionally; every axe `incomplete` result is handled explicitly — `color-contrast` incompletes are deferred to a pixel-sampling resolution pass, any other rule's incomplete result fails outright via a dedicated branch (verified via `grep -n "incomplete"` showing both branches)
- A11Y-03 asserted directly against the live accessibility surface (`page.evaluate`, not HTML parsing): every `<img>` has a non-empty `alt` that isn't a filename; every icon-only `<a>` (empty visible text) carries a non-empty `aria-label`
- Supplementary contrast check resolves every deferred entry by measurement: `locator.screenshot()` (auto-scrolls below-the-fold targets into view first), `sharp` samples the real painted background pixel a few px inset from the element's box corner, `getComputedStyle` reads the element's real text color, `wcag-contrast`'s `hex()` computes the ratio against a size-dependent AA threshold (3.0 large text / 4.5 otherwise, both read from computed style, never inferred from class names)
- `npm run verify` now runs seven gates end to end and exits 0; a clean build resolves all 40 deferred color-contrast entries across both routes with zero real contrast failures, confirming RESEARCH.md Pitfall 5's hand computation (every pairing clears AA)
- Proven against both required negative mutations: a filename-style `alt` attribute injected into `dist/index.html` (fails with an `a11y-surface` violation naming the route), and a low-contrast CSS override appended to the built stylesheet (`.glass-panel p{color:#1a1f24!important}`, fails with a `contrast` violation reporting `ratio=1.08 required=4.5`) — both restored via `npm run build` afterward
- Confirmed port 4326 (and 4325, from the OG-image generator) are released after every run, and two immediate consecutive invocations succeed with no port/browser conflict

## Task Commits

Each task was committed atomically:

1. **Task 1: Real-browser axe scan of both routes with explicit incomplete handling** - `75b12a0` (feat)
2. **Task 2: Resolve glass-panel contrast by sampling real painted pixels, then wire the gate in** - `268297f` (feat)

_Plan metadata commit (SUMMARY.md) is created separately, per worktree-mode convention — orchestrator handles STATE.md/ROADMAP.md updates after merge._

## Files Created/Modified

- `scripts/verify-a11y.mjs` - New: ~330-line gate, `dist/`-guard + violations-array + summary-line + exit-code contract matching every existing `verify-*.mjs` script; real-browser axe scan + pixel-sampling contrast supplement
- `package.json` - Added `verify:a11y` script entry; appended `verify:a11y` to the composite `verify` chain (now seven gates)

## Decisions Made

- **Broadened the color-contrast incomplete-deferral scope** from the plan's literal `.glass-panel`/`.border-glow-cyan`-only routing to every `color-contrast` incomplete result, after a live scan against the real build showed axe's composited-background blind spot (RESEARCH.md Pitfall 6) also fires on elements with no glass-panel ancestor at all: `Nav.astro`'s bar (`bg-background/60 backdrop-blur-xl` — the same composited-transparency pattern under a different class name) and the Hero heading/paragraph text (which sits directly on `<body>`'s `.bg-grid-pattern` background plus the two absolutely-positioned `.glow-cloud-*` divs, with no glass wrapper at all). Following the plan's own Task 1 instruction ("if the run surfaces a rule that is genuinely a false positive against this design, record it in the plan SUMMARY with evidence rather than silently suppressing it"), every `color-contrast` incomplete entry is now deferred to the deterministic pixel-sampling measurement — the measured-pixel answer is authoritative for any element axe could not resolve, not just the two named primitive classes. This is a scope broadening of the *routing logic only*; no rule was disabled, no false-positive was silently suppressed, and every entry is still either measured-and-resolved or reported as a specific violation.
- Replaced the plan's `page.screenshot({ clip })` sketch with `locator.screenshot()` — the sketch's clip coordinates are relative to the current viewport only (no `fullPage`), so any contrast-check target below the 900px viewport fold (the vast majority of this page's sections) produced a `"Clipped area is either empty or outside the resulting image"` error. `locator.screenshot()` auto-scrolls the target into view before capturing, which resolved this immediately with no further changes needed to the sampling math.
- Tracked a separate `processedDeferred` (accounted-for) counter distinct from `incompleteResolved` (passed) for the final "no entry fell through unaccounted" assertion — literally asserting `incompleteResolved === deferred.length` would double-flag any genuine contrast failure with a confusing second "fell through" message on top of its own specific `contrast` violation. `processedDeferred` increments on every terminal outcome (pass or fail), giving a true fall-through/coverage guard without conflating it with the pass count.
- `incomplete_total` counts total incomplete *nodes* across all rules (`inc.nodes.length` summed), not the count of incomplete *rule* entries — the plan's summary-line contract implies a per-element count consistent with `incomplete_resolved`/`contrast_checked`, which are also per-element.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Broadened color-contrast incomplete-deferral scope beyond .glass-panel/.border-glow-cyan**
- **Found during:** Task 1 (initial axe scan against the real build)
- **Issue:** The plan's `<interfaces>` section scoped the deferral trigger to elements with a `.glass-panel`/`.border-glow-cyan` ancestor. A live scan showed axe reports `color-contrast` as `incomplete` for 20 elements per route with no such ancestor at all — e.g. `Nav.astro`'s own bar (a `bg-background/60 backdrop-blur-xl` composited-transparency surface under a different class name) and the un-wrapped Hero heading/paragraph text sitting directly over `.bg-grid-pattern` + `.glow-cloud-*`. Following the narrow scope literally would have made every clean build fail the gate (`violations=20` on an otherwise-correct design), directly contradicting Task 1's own acceptance criterion of `violations=0` on a clean build.
- **Fix:** Every `color-contrast` incomplete entry (regardless of ancestor class) is now deferred to the pixel-sampling supplementary check; the `.glass-panel`/`.border-glow-cyan` ancestor test is retained as a diagnostic tag on each deferred entry but no longer gates whether an entry gets measured versus failed outright. Any incomplete result for a rule other than `color-contrast` still fails the gate outright via an unchanged explicit branch.
- **Files modified:** scripts/verify-a11y.mjs
- **Verification:** `npm run build && node scripts/verify-a11y.mjs` exits 0 with `violations=0 incomplete_total=40 incomplete_resolved=40 contrast_checked=40` — all 40 deferred entries across both routes measured and cleared AA, matching RESEARCH.md Pitfall 5's hand computation that every token pairing in this design clears AA with margin.
- **Committed in:** `75b12a0` (Task 1 commit, comment + routing logic) and `268297f` (Task 2 commit, where the resolution logic that consumes the broadened deferral list was added)

**2. [Rule 1 - Bug] `page.screenshot({ clip })` fails on below-the-fold contrast targets**
- **Found during:** Task 2 (first full run of the pixel-sampling resolution logic)
- **Issue:** The plan's Pattern 4 code sketch used `page.screenshot({ clip: box })`. Since `clip` without `fullPage: true` is bound to the current viewport (900px tall), every deferred entry whose `boundingBox()` fell below that (the large majority of this page's sections) produced `"Clipped area is either empty or outside the resulting image"`, failing the gate on unmeasurable-but-actually-fine elements.
- **Fix:** Switched to `locator.screenshot()`, which auto-scrolls the target element into view before capturing — same pixel-sampling math (sharp `extract` + `wcag-contrast` `hex()`) applied to the correctly-captured buffer.
- **Files modified:** scripts/verify-a11y.mjs
- **Verification:** All 40 deferred entries (many below the fold) now measure successfully with zero "could not sample painted pixel" violations on a clean build.
- **Committed in:** `268297f` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs discovered against actual browser/axe behavior, not assumptions from the plan's interface sketch). No rule-disabling escape hatch was added, no design token was touched, and no false positive was silently suppressed — both fixes broaden or correct the *measurement mechanism* itself, which remains fully deterministic.
**Impact on plan:** Both fixes were necessary for Task 1/Task 2's own stated acceptance criteria (`violations=0` on a clean build, `incomplete_resolved` equal to the deferred count) to be achievable at all. No scope creep — no new requirement, artifact, or design decision was introduced beyond what A11Y-03/A11Y-04 already call for.

## Issues Encountered

- `@axe-core/playwright`'s `AxeBuilder.analyze()` threw `Error: Please use browser.newContext()` when driven against a page created via the plan's sketched `browser.newPage()` shorthand — resolved by switching to explicit `browser.newContext()` + `context.newPage()`, confirmed against `dequelabs/axe-core-npm`'s own error-handling guidance linked in the thrown error message.
- This worktree's `node_modules` was empty at start (fresh checkout, per parallel-worktree convention); a single synchronous `npm install` populated it cleanly in a few minutes with no corruption (unlike plan 04-02's Windows `ENOTEMPTY` race), confirmed via `node node_modules/astro/bin/astro.mjs --version` returning `v7.2.10` before proceeding. Chromium was already cached at the OS level from plan 04-01's install, so `npx playwright install chromium` was correctly skipped.
- The `dist/`-missing guard's exact required test (rename `dist/` away, run the gate, restore it) hit the same Windows file-lock issue plan 04-03 documented (`mv`/`fs.renameSync` `EPERM` on the whole directory, likely a concurrent handle from another process in this shared parallel-wave build environment). Recovered by renaming only the two specifically-guarded files (`dist/index.html`, `dist/404.html`) instead of the whole directory — this exercises the exact same `existsSync` guard code path and fixed failure message with exit code 1, without touching any other file in `dist/`. Both files were restored immediately afterward and a subsequent clean run confirmed `dist/` was left in its expected all-ok state.

## User Setup Required

None — no external service configuration required. Chromium was already present in the local Playwright OS cache from plan 04-01. No new packages were installed (this plan's dependencies — `@axe-core/playwright`, `playwright`, `sharp`, `wcag-contrast` — were all installed and audited in plan 04-01, T-04-04-SC in this plan's own threat register).

## Next Phase Readiness

- `npm run verify` is now the complete seven-gate command (`sec01`, `tokens`, `shell`, `sections`, `schema`, `seo`, `a11y`) a developer or Phase 5's CI/deploy pipeline runs before shipping — every gate exits 0 with zero violations on a clean build.
- `scripts/verify-a11y.mjs`'s broadened color-contrast deferral means any *future* page/section this project adds that sits over the atmospheric background or reuses `.glass-panel`/`.border-glow-cyan` is automatically covered by the same deterministic measurement, with no further gate changes needed.
- No blockers for Phase 5 (deploy/production security headers) — this plan touched no `astro.config.mjs`, `vercel.json`, or `src/styles/global.css`.

---
*Phase: 04-seo-accessibility-polish*
*Completed: 2026-09-03*
