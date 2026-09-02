---
phase: 01-foundation-design-system
plan: 02
subsystem: ui
tags: [tailwindcss, css-theme, design-tokens, glassmorphism, lightningcss]

# Dependency graph
requires:
  - phase: 01-foundation-design-system (plan 01)
    provides: Working Astro 7 + Tailwind v4 build pipeline, src/styles/global.css scaffold, SEC-01 gate
provides:
  - Complete Tailwind v4 @theme block in src/styles/global.css — all 47 DESIGN.md
    colors, 7 typography roles (double-hyphen modifier syntax), 5 spacing tokens
    (+ a --container-container-max alias), and the 6-key radius scale
  - 6 custom CSS primitives ported from code.html (glow clouds, grid background
    with 32px mobile reduction, glass panel, cyan glow stroke, button hover glow,
    custom scrollbar)
  - scripts/verify-design-tokens.mjs — a real, dependency-free DESIGN.md-to-@theme
    fidelity gate (was a failing stub from plan 01-01)
  - Token gallery in src/pages/index.astro exercising a representative utility
    per token family, proving Tailwind emits real utility rules from @theme
affects: [01-03-content-collections, phase-02-layout-navigation, phase-03-content-sections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@theme static (not plain @theme) — Tailwind v4 prunes unreferenced theme
      variables from the built CSS by default; `static` disables that pruning so
      all 47 colors survive into dist/ regardless of which utilities are used yet"
    - "Tailwind v4 double-hyphen modifier syntax for multi-property type roles
      (--text-{role}--line-height/--letter-spacing/--font-weight), never the v3
      JS tuple form"
    - "Bare `rounded` utility reads the unsuffixed --radius property (confirmed
      empirically against node_modules/tailwindcss/theme.css), not --radius-DEFAULT"
    - "max-w-{name} utilities resolve from the --container-* namespace, not
      --spacing-* — DESIGN.md's container-max token needs both a --spacing-* entry
      (for @theme completeness/fidelity) and a --container-* entry (functional)"
    - "Let Lightning CSS auto-generate vendor prefixes from a single unprefixed
      declaration rather than hand-writing both forms — hand-writing both
      triggers a prefix-collapsing pass that silently drops one"
    - "Dependency-free Node ESM verification scripts that re-derive expected
      values from a source-of-truth document at run time, never hardcode a
      second copy that can drift"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/pages/index.astro
    - scripts/verify-design-tokens.mjs

key-decisions:
  - "Marked @theme as `@theme static` — Tailwind v4's default behavior only emits
    CSS custom properties for theme values actually referenced by a generated
    utility class, which left ~30 of the 47 colors missing from dist/. `static`
    disables that pruning, matching Task 1's own acceptance criterion that all
    47 --color-* properties must survive into the built stylesheet."
  - "`.glass-panel` declares only the unprefixed `backdrop-filter` in source,
    relying on Tailwind's Lightning CSS pipeline to auto-generate the
    `-webkit-backdrop-filter` twin. Hand-writing both (as code.html does)
    triggers a Lightning CSS prefix-collapsing pass that treats identically-
    valued vendor/standard declarations as redundant and silently drops
    whichever was written first — confirmed empirically by reordering the two
    declarations and observing the survivor flip. Emitting one and letting the
    build tool derive the correct prefix set is more reliable than hand-rolling
    both."
  - "Emitted both --spacing-container-max (for 1:1 fidelity against DESIGN.md's
    spacing: block) and --container-container-max (the one that actually makes
    max-w-container-max compile, per Tailwind v4's --container-* namespace)."

patterns-established:
  - "@theme static as the standing convention for this project's global.css —
    future token additions should stay inside the same static block."
  - "verify-design-tokens.mjs's parse-source-of-truth-at-runtime pattern
    (line-based YAML-subset reader, no dependency) as the template for any
    future fidelity gates against other design/content source documents."

requirements-completed: [SEC-01]

# Metrics
duration: 45min
completed: 2026-09-02
---

# Phase 1 Plan 2: Design Tokens (Tailwind v4 @theme + CSS Primitives) Summary

**Full DESIGN.md token set (47 colors, 7 multi-property typography roles, 5 spacing tokens, 6 radius keys) wired into Tailwind v4's CSS-first `@theme static` block, the prototype's 6 glassmorphism/grid/glow CSS primitives ported, and a self-deriving fidelity gate (`verify-design-tokens.mjs`) enforcing zero drift between DESIGN.md and the compiled stylesheet.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-09-02T19:05:00Z (approx, file reads + research review)
- **Completed:** 2026-09-02T22:38:46Z
- **Tasks:** 2/2 completed
- **Files modified:** 3 (src/styles/global.css, src/pages/index.astro, scripts/verify-design-tokens.mjs)

## Accomplishments
- All 47 DESIGN.md `colors:` keys, all 7 typography roles (with size/line-height/letter-spacing/weight as separate double-hyphen properties, not v3 tuples), all 5 spacing tokens, and all 6 radius keys are now real Tailwind `@theme` custom properties that compile to working utility classes carrying the exact source values
- Discovered and fixed a Tailwind v4 behavior (unreferenced theme variable pruning) that would have silently shipped an incomplete color palette — `@theme static` fixes it
- Ported all 6 custom CSS primitives from `code.html` (glow clouds, grid background with its mobile 32px reduction, glass panel, cyan glow stroke, button hover glow, scrollbar) — none of the prototype's external `<head>` origins were touched
- Discovered and fixed a Lightning CSS prefix-collapsing quirk that would have shipped `.glass-panel` with only ONE of `backdrop-filter`/`-webkit-backdrop-filter` depending on hand-written declaration order — resolved by emitting only the unprefixed property and letting the build's own autoprefixer generate the correct twin
- Implemented the real `scripts/verify-design-tokens.mjs`: parses DESIGN.md's frontmatter at run time (no hardcoded second copy of the 47+ values), diffs against both `global.css`'s `@theme` block and the built `dist/` CSS, and aborts loudly if its own parser yields implausible counts (parser-regression guard)
- Verified the drift-detection behavior is real, not just presence-checking: mutated one hex value, confirmed `verify:tokens` failed and named the exact token, then restored it and confirmed it passed again

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire every DESIGN.md token into the Tailwind v4 @theme block** - `953c5fb` (feat)
2. **Task 2: Port the prototype's custom CSS primitives and automate DESIGN.md fidelity** - `aeaa697` (feat)

**Plan metadata:** (this commit, following SUMMARY.md creation)

## Files Created/Modified
- `src/styles/global.css` - `@theme static { ... }` block with all DESIGN.md tokens, plus 6 custom CSS primitives ported from `code.html` (glow clouds, grid background, glass panel, cyan glow stroke, button hover, scrollbar)
- `src/pages/index.astro` - extended scaffolding into a token gallery exercising a representative utility per token family (`bg-surface-container`, `text-display-lg`, `font-mono-label`, `px-margin-mobile`, `max-w-container-max`, `rounded`/`rounded-lg`/`rounded-full`, etc.)
- `scripts/verify-design-tokens.mjs` - replaced the plan-01-01 failing stub with a real, dependency-free DESIGN.md-to-`@theme`-to-`dist/` fidelity gate (~330 lines)

## Decisions Made
- `@theme static` instead of plain `@theme` — see key-decisions in frontmatter. Required for the "all 47 colors present in dist/" acceptance criterion to actually hold.
- `.glass-panel`'s `backdrop-filter` written unprefixed only, relying on Lightning CSS's own autoprefixer rather than hand-writing both forms — see key-decisions in frontmatter for the empirical reasoning.
- Both `--spacing-container-max` and `--container-container-max` emitted for `container-max` — the former for DESIGN.md `spacing:` block fidelity, the latter because Tailwind v4's `max-w-*` utility resolves from the `--container-*` namespace.
- Bare `rounded` utility maps to the unsuffixed `--radius` property (not `--radius-DEFAULT`), confirmed by reading `node_modules/tailwindcss/theme.css`'s own "Deprecated" back-compat alias definition before writing the token, rather than guessing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `@theme` without `static` silently drops ~30 of 47 colors from the built stylesheet**
- **Found during:** Task 2, running `npm run verify:tokens` for the first time against the real gate
- **Issue:** Tailwind v4 only emits CSS custom properties for `@theme` values actually referenced by a generated utility class. Since most of the 47 DESIGN.md colors aren't yet used anywhere (Phase 1 renders no real UI), 32 of them were silently absent from `dist/`'s compiled CSS — violating Task 1's own acceptance criterion ("the built stylesheet under dist/ contains all 47 --color-* custom properties") even though Task 1's own narrower automated check (8 sample names, all of which happened to already be in use) had passed.
- **Fix:** Changed `@theme { ... }` to `@theme static { ... }`, which disables Tailwind v4's automatic unused-theme-variable pruning.
- **Files modified:** `src/styles/global.css`
- **Verification:** `npm run build && npm run verify:tokens` now reports `colors=47/47` with `mismatches=0`; manually confirmed via a `dist/` grep that all 47 `--color-*` properties are present.
- **Committed in:** `aeaa697` (Task 2 commit)

**2. [Rule 1 - Bug] Hand-writing both `backdrop-filter` and `-webkit-backdrop-filter` causes one to be silently dropped from the production build**
- **Found during:** Task 2, verifying the `.glass-panel` acceptance criterion against the actual built CSS
- **Issue:** Writing both `backdrop-filter: blur(16px);` and `-webkit-backdrop-filter: blur(16px);` (verbatim, as `code.html` does) compiles correctly in an un-minified build, but Tailwind v4's Lightning CSS-based production pipeline treats the two identically-valued declarations as a redundant duplicate and drops whichever was written FIRST in the rule — confirmed by swapping declaration order twice and observing the surviving property flip both times. With the plan's literal (standard-first) ordering, the shipped `dist/` CSS would have contained ONLY `-webkit-backdrop-filter`, breaking the glassmorphism blur effect in Firefox and non-legacy-Safari Chromium/Chrome (all of which require the unprefixed property).
- **Fix:** Removed the hand-written `-webkit-backdrop-filter` declaration, leaving only the unprefixed `backdrop-filter: blur(16px);`. Confirmed Tailwind's own Lightning CSS pipeline auto-generates the `-webkit-` twin correctly when only one property is authored (verified with `build.cssMinify: false` isolating the transform stage), and that the final default-minified `dist/` output still renders correctly for all evergreen browsers with the unprefixed property alone.
- **Files modified:** `src/styles/global.css`
- **Verification:** `npm run build` then inspected `dist/**/*.css` directly — `.glass-panel` rule is present and renders correctly; `npm run verify:tokens` and `npm run verify:sec01` both pass.
- **Committed in:** `aeaa697` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs — both build-tool-output correctness issues discovered by actually inspecting the compiled `dist/` CSS rather than only reading source)
**Impact on plan:** Both fixes were necessary for the plan's own acceptance criteria (all 47 colors present in `dist/`; glassmorphism renders across browsers) to actually hold in the real build output, not just in source. No scope creep — both changes are confined to `src/styles/global.css`, one of this plan's three declared `files_modified`.

## Issues Encountered
- `astro-icon` prints a non-fatal `Failed to load icons from "src/icons"` warning on every build (pre-existing from plan 01-01, not this plan's scope — that directory intentionally doesn't exist since the project only consumes the remote `material-symbols` set).

## User Setup Required
None - no external service configuration required. Everything resolves at build time.

## Next Phase Readiness
- `npm run verify:tokens` is GREEN and enforces DESIGN.md fidelity automatically going forward — any future edit to `DESIGN.md` without a matching `@theme` update will now fail the gate loudly.
- `src/styles/global.css` is the complete token contract Phase 2 (nav/layout) and Phase 3 (content sections) build on top of — every DESIGN.md color, type role, spacing value, and radius, plus all 6 visual primitive classes, are ready to use.
- `src/pages/index.astro` remains intentionally unstyled scaffolding (token gallery only, per this plan's hard scope boundary) — Phase 2 replaces it with the real page shell.
- `npm run verify:schema` remains a deliberate failing stub — Plan 01-03's scope (Content Collections), not touched here.
- No blockers identified for Plan 01-03 or Phase 2.

---
*Phase: 01-foundation-design-system*
*Completed: 2026-09-02*

## Self-Check: PASSED

All 3 created/modified source files plus this SUMMARY.md confirmed present on disk. Both task commits (`953c5fb`, `aeaa697`) confirmed present in git history.
