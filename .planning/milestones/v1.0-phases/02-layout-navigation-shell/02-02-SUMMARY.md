---
phase: 02-layout-navigation-shell
plan: 02
subsystem: ui
tags: [astro, tailwind, vanilla-js, accessibility, a11y, focus-trap, mobile-overlay, nav]

# Dependency graph
requires:
  - phase: 02-layout-navigation-shell
    provides: "02-01's Nav.astro (nav landmark, brand, desktop links, Connect anchor, inert mobile toggle button with data-nav-toggle/aria-controls=\"nav-overlay\"), the shell gate (scripts/verify-shell.mjs), and the global.css custom-primitives block"
provides:
  - "src/components/Nav.astro — full-screen mobile overlay (D-01): role=dialog/aria-modal, five anchors (4 section links + Connect), dual-icon toggle (menu/close), and a co-located vanilla <script> controller (focus trap, Escape, click-to-close, matchMedia resize guard)"
  - "src/styles/global.css — four attribute-driven overlay state rules (display toggle, nav z-index raise, body scroll lock, icon-swap descendant-combinator pair)"
  - "scripts/verify-shell.mjs — overlay + overlayjs check groups (markup structure, sibling-of-nav offset assertion, CSS state rules via a new whitespace-collapsed CSS copy, built-script behavioural literals, vanilla-JS-only source assertions)"
affects: [02-03-footer, phase-03-content-sections, phase-05-security-headers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "First client-side JavaScript in the project: a single co-located <script> in Nav.astro, no is:inline, no client: directive — bundled by Astro automatically, pinning the pattern Phase 5's script-src 'self' CSP will depend on"
    - "Single-writer state machine: one setOpen(open, restoreFocus) function is the only place data-menu-open is ever written, on nav/overlay/body, with aria-expanded/aria-label kept in lockstep"
    - "CSS gate copies: verify-shell.mjs now maintains two normalised copies of the built CSS — cssStripped (all whitespace removed, for declaration values and compound selectors) and cssLoose (whitespace collapsed to single spaces, for descendant-combinator selectors) — because full stripping turns 'nav[x] [y]' into what looks like a compound selector"
    - "findCssBlock tolerates minifier selector-grouping: Lightning CSS merges identical-declaration selectors into a comma-separated list, so the gate's block-extraction helper matches a selector followed by either ',' or '{', not just '{'"

key-files:
  created: []
  modified:
    - src/components/Nav.astro
    - src/styles/global.css
    - scripts/verify-shell.mjs

key-decisions:
  - "Overlay is a sibling of <nav>, never nested inside it — the nav's backdrop-blur-xl makes it a containing block for position:fixed descendants, which would clip a nested overlay to the nav bar's own box. The gate asserts this structurally (</nav> offset must precede the overlay's offset), not just by convention."
  - "Icon swap (menu ↔ close) is pure CSS via two descendant-combinator display:none rules, keyed off data-menu-open — both icons are server-rendered inline SVGs, so no icon markup is ever constructed at runtime (SEC-01 stays satisfied by construction)."
  - "Focus-trap membership is the toggle button (outside the overlay in the DOM) followed by every overlay link, in DOM order — the toggle must be in the trap because it is the overlay's only close control."
  - "Added mr-unit (existing --spacing-unit token, 8px) as supplemental right-margin on the mobile toggle button only, in response to human checkpoint feedback that the button read as flush against the viewport edge — margin (not padding) was used so the 44px WCAG-minimum tap target is never shrunk, and no new spacing literal was introduced."

patterns-established:
  - "Non-null local aliases for narrowed nullable DOM references before nested closures — TypeScript's control-flow narrowing on `if (a && b && c)` doesn't propagate into function declarations defined inside the block, so this project's script pattern re-binds to explicitly typed consts first."

requirements-completed: [LAY-03, A11Y-01]

# Metrics
duration: 16min (commit-to-commit; additional time spent awaiting human checkpoint review, not counted as active execution)
completed: 2026-09-02
---

# Phase 2 Plan 2: Mobile Nav Overlay Summary

**Full-screen mobile navigation overlay (D-01) with a real focus trap, Escape-to-close, focus restoration, and body scroll lock — built as a single co-located vanilla `<script>` in `Nav.astro`, zero framework islands, locked behind an extended `verify-shell.mjs` gate that went RED then GREEN.**

## Performance

- **Duration:** ~16 min (commit-to-commit across Tasks 1–2 plus the checkpoint fix)
- **Started:** 2026-09-02T22:43:08-03:00
- **Completed:** 2026-09-02T22:59:15-03:00 (code), checkpoint approved in a later session
- **Tasks:** 3 (Task 1 RED gate, Task 2 GREEN implementation, Task 3 human checkpoint — approved)
- **Files modified:** 3 (`scripts/verify-shell.mjs`, `src/styles/global.css`, `src/components/Nav.astro`)

## Accomplishments
- A mobile visitor tapping the menu icon now gets a real full-screen overlay — not a dead button — with four section links and a Connect anchor, matching the "command deck" glassmorphism feel of DESIGN.md
- Keyboard-only visitors can open the overlay, cycle through it with Tab/Shift+Tab without ever escaping to the page behind, close it with Escape or the same toggle, and land back exactly where they started — verified live in a real browser via the Task 3 checkpoint (all eleven checks, including the follow-up spacing fix, approved)
- The overlay is proven structurally isolated from the nav's `backdrop-filter` containing-block trap by a character-offset assertion in the gate, not just code review — this exact bug class is invisible in source and only shows up as a visually clipped overlay
- This is the project's first client-side JavaScript, and it pins the exact authoring pattern (bundled `<script>`, no `is:inline`, no framework island) that Phase 5's `script-src 'self'` CSP will require
- `verify-shell.mjs` now encodes the full mobile-overlay contract (markup, ARIA, CSS state, behavioural script literals) as two new check groups (`overlay`, `overlayjs`), extending rather than replacing 02-01's gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the shell gate with the overlay contract — RED** - `54b62e7` (test)
2. **Task 2: Build the full-screen overlay and its vanilla JS controller — gate goes green** - `f5b0b50` (feat)
3. **Checkpoint fix: mobile toggle edge spacing** - `dfded65` (fix) — applied between Task 2 and Task 3's final approval, in response to human checkpoint feedback (see Deviations)

**Plan metadata:** commit pending (this SUMMARY + REQUIREMENTS.md, worktree mode — orchestrator finalizes shared files)

## Files Created/Modified
- `scripts/verify-shell.mjs` - Added two new check groups (`overlay`, `overlayjs`) to the existing shell gate: overlay markup/ARIA/sibling-offset assertions, CSS state-rule assertions against a new whitespace-collapsed CSS copy (`cssLoose`, needed for descendant-combinator selectors), and built-script literal + vanilla-JS-only source assertions. Also fixed a gate bug found during Task 2 (see Deviations) where `findCssBlock` couldn't match selectors Lightning CSS had grouped into a comma-separated list.
- `src/styles/global.css` - Added four attribute-driven overlay state rules after the `.skip-link` block: `[data-nav-overlay][data-menu-open="false"]{display:none}`, `nav[data-menu-open="true"]{z-index:70}`, `body[data-menu-open="true"]{overflow:hidden}`, and the two icon-swap descendant-combinator rules — each documented in-file with why it exists, per the plan's requirement.
- `src/components/Nav.astro` - Added the second `<Icon>` (close glyph) to the toggle button with `data-nav-icon` attributes on both icons; added the full-screen overlay markup as a sibling of `<nav>` (five anchors: Dossier/Stack/Projects/Contact/Connect); added one co-located `<script>` implementing `setOpen()`, the focus trap, Escape handling, link-click closing, and a `matchMedia` resize guard; added `mr-unit` to the toggle button per the checkpoint fix.

## Decisions Made
See frontmatter `key-decisions`. Summary: overlay-as-sibling for the backdrop-filter containing-block reason, pure-CSS icon swap for SEC-01, toggle-included-in-trap-membership for a real escape path, and the `mr-unit` supplemental margin for the checkpoint-reported edge-spacing issue.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `findCssBlock` couldn't match Lightning-CSS-grouped selectors**
- **Found during:** Task 2, first automated verify run
- **Issue:** Lightning CSS merged the two identical-declaration icon-swap rules into a single comma-separated selector list (`nav[data-menu-open=false] [data-nav-icon=close],nav[data-menu-open=true] [data-nav-icon=menu]{display:none}`). The gate's `findCssBlock` helper (written in Task 1) required a selector to be immediately followed by `{`, so it failed to find the second selector in the group.
- **Fix:** Changed `findCssBlock` to match a selector followed by either `,` or `{`, then locate the next `{...}` block after that point — tolerating minifier selector-grouping generally, not just this one case.
- **Files modified:** `scripts/verify-shell.mjs`
- **Verification:** Re-ran `npm run verify:shell`; `overlay=ok overlayjs=ok violations=0`.
- **Committed in:** `f5b0b50` (Task 2 commit)

**2. [Rule 1 - Bug] Two of my own documentation comments tripped the gate's own regex checks**
- **Found during:** Task 2, automated verify runs
- **Issue:** A frontmatter comment in `Nav.astro` explaining the overlay's sibling-not-nested placement contained the literal substring `<nav>`, which the gate's `landmarks` check (scanning raw `dist/index.html` for `<nav\b[^>]*>` tags) matched as a second, spurious `<nav>` element — because the comment survives into the built HTML output as an `<!-- -->` comment. Separately, a script-body comment explaining why the tag has no unprocessed-script opt-out attribute contained the literal substring `is:inline`, tripping the `overlayjs` source-level check. Both are the same class of self-inflicted false positive documented in `02-01-SUMMARY.md`.
- **Fix:** Reworded both comments to describe the same reasoning without using the literal banned substrings.
- **Files modified:** `src/components/Nav.astro`
- **Verification:** Re-ran the full Task 2 automated verify block; all checks pass, `console.log('OK')` printed.
- **Committed in:** `f5b0b50` (Task 2 commit — fixed before the task's single commit)

**3. [Rule 1 - Bug] TypeScript strict-null errors in the overlay script**
- **Found during:** Task 2, `npx astro check`
- **Issue:** `astro check` type-checks co-located `<script>` blocks. `toggle`/`overlay`/`nav` were narrowed to non-null only at the `if (toggle && overlay && nav)` guard, but that narrowing doesn't propagate into the nested `setOpen`/event-listener closures defined inside the block, producing six `possibly null/undefined` errors plus two implicit-`any` parameter errors.
- **Fix:** Introduced explicitly typed non-null local aliases (`const toggle: HTMLElement = toggleEl`, etc.) immediately inside the guard, typed `setOpen(open: boolean, restoreFocus: boolean)`, and typed the `querySelector` call generically (`querySelector<HTMLElement>`) and `keydown` handler parameter (`KeyboardEvent`).
- **Files modified:** `src/components/Nav.astro`
- **Verification:** `npx astro check` — 0 errors, 0 warnings (12 pre-existing hints unrelated to this plan).
- **Committed in:** `f5b0b50` (Task 2 commit)

**4. [Checkpoint feedback, not a plan-authoring bug] Mobile toggle read as flush against the viewport edge**
- **Found during:** Task 3, first human checkpoint review
- **Issue:** The human reported the hamburger icon looked "extremely stuck to the right edge, almost hidden" at mobile width. Investigation confirmed `px-margin-mobile` (20px, the DESIGN.md mobile-margin token) was correctly applying to the nav row — this was not a broken-padding bug. Root cause: with only two visible flex children on mobile (brand + toggle) and `justify-between`, the toggle's own 44×44px hit-box sits flush at the row's padded boundary, which reads as tight for a solid square tap target even though it is spec-compliant per DESIGN.md and WCAG's 44px minimum.
- **Fix:** Added `mr-unit` (the existing `--spacing-unit: 8px` token, already used elsewhere in the design system, e.g. footer padding) as supplemental right-margin on the toggle button only — margin, not padding, so the 44px tap target itself is never shrunk. No new spacing literal or token was introduced, and the shared `px-margin-mobile` contract and left-side brand spacing are untouched.
- **Files modified:** `src/components/Nav.astro`
- **Verification:** Rebuilt; `npm run verify:shell` (`violations=0`), `npm run verify:sec01` (`external_refs=0`), `npx astro check` (0 errors) all still pass; human re-verified all eleven Task 3 checklist items in a real browser and approved.
- **Committed in:** `dfded65` (separate fix commit, after the initial Task 2 commit, before checkpoint approval)

---

**Total deviations:** 4 auto-fixed (3 Rule 1 — bugs in this plan's own gate/comments/types, 1 checkpoint-driven visual fix)
**Impact on plan:** All four are corrections to this plan's own artifacts, discovered by its own verification steps (three) or by human checkpoint review (one). No scope creep — no file outside `scripts/verify-shell.mjs`, `src/styles/global.css`, and `src/components/Nav.astro` was touched at any point in this plan.

## Issues Encountered

**`npm run verify:tokens` still fails in this worktree — pre-existing, unrelated to this plan.** Same root cause documented in `02-01-SUMMARY.md`: `Arquivos de design/` is untracked in git on the base branch, so `git worktree add` never checked it out into this worktree, and `scripts/verify-design-tokens.mjs` can't find `DESIGN.md` to diff against. This plan does not touch `DESIGN.md`, `global.css`'s `@theme static` block, or any token value — only the custom-primitives block below it (four new plain CSS rules) and `Nav.astro`/`verify-shell.mjs`. `npm run build`, `npx astro check` (0 errors), `npm run verify:sec01` (`external_refs=0`), `npm run verify:shell` (`violations=0`), and `npm run verify:schema` all pass cleanly. Not fixed here — same reasoning as 02-01: fixing it would mean committing the entire design-assets folder, an unrelated and much larger change, out of this plan's scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 02-03 (footer) can mount `<Footer />` in `Base.astro` following the same pattern established by 02-01's `<Nav />` mount — this plan did not touch `Base.astro`, `index.astro`, or `package.json`
- The overlay's five-anchor pattern (four section links + duplicated Connect anchor) and the `mr-unit` supplemental-margin technique are both available precedents if Phase 3's content sections need similar mobile-edge-spacing treatment
- The orchestrator should still resolve the `Arquivos de design/` untracked-folder gap (carried forward from 02-01, see Issues Encountered) before or during the next phase transition, since it will keep reproducing in every future worktree-isolated plan running `verify:tokens` or the full `npm run verify` aggregate
- LAY-03 and A11Y-01 are now fully closed (desktop half from 02-01, mobile overlay half from this plan) — marked complete in `.planning/REQUIREMENTS.md`

---
*Phase: 02-layout-navigation-shell*
*Completed: 2026-09-02*

## Self-Check: PASSED

All created/modified files verified present (`src/components/Nav.astro`, `src/styles/global.css`, `scripts/verify-shell.mjs`, this SUMMARY); all task commits verified present in git log (`54b62e7`, `f5b0b50`, `dfded65`).
