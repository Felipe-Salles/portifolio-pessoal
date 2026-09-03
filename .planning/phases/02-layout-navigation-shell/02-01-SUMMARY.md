---
phase: 02-layout-navigation-shell
plan: 01
subsystem: ui
tags: [astro, tailwind, accessibility, a11y, seo, nav, skip-link, focus-visible]

# Dependency graph
requires:
  - phase: 01-foundation-design-system
    provides: Astro + Tailwind v4 pipeline, @theme design tokens, astro-icon self-hosted SVG icons, src/data/site.ts typed singleton, SEC-01 external-origin gate, src/layouts/Base.astro scaffolding
provides:
  - src/components/Nav.astro — nav landmark, brand wordmark bound to site.brand, desktop section links, Connect anchor (D-02), inert mobile toggle button
  - Extended src/layouts/Base.astro — skip link (D-04), <Nav /> mount, main#main-content landmark
  - Global :focus-visible glow and .skip-link off-screen CSS primitives in src/styles/global.css
  - scripts/verify-shell.mjs — deterministic dist/ gate for lang, landmarks, skip link, nav contract, brand, and focus CSS, wired into the aggregate npm run verify chain
affects: [02-02-mobile-overlay, 02-03-footer, phase-03-content-sections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic dist/ verification gates (SEC-01 precedent) extended to the shell contract: verify-shell.mjs asserts lang, landmark cardinality, skip-link tab-order position, nav anchors, and built-CSS focus rules by regex against dist/, not manual inspection"
    - "Skip-link visible appearance composed from existing Tailwind utilities + Phase 1 primitives (glass-panel, border-glow-cyan) directly in markup; the .skip-link CSS class carries only the off-screen transform mechanics, never display:none"
    - "Global bare :focus-visible primitive (not scoped to a class) so every future phase inherits the cyan focus glow automatically"

key-files:
  created:
    - src/components/Nav.astro
    - scripts/verify-shell.mjs
    - .planning/phases/02-layout-navigation-shell/deferred-items.md
  modified:
    - src/styles/global.css
    - src/layouts/Base.astro
    - src/pages/index.astro
    - package.json

key-decisions:
  - "verify-shell.mjs structured so plans 02-02 and 02-03 can append further check groups and further key=value pairs to the SHELL SUMMARY line without rewriting the file"
  - "Rewrote code-comment prose describing banned prototype patterns (e.g. the extra bold-weight override, the invalid radius suffix, the icon-font span, the literal script tag) to avoid the literal banned substrings themselves, since the Task 2 verify script scans Nav.astro's raw text, not just rendered output"

patterns-established:
  - "Nav.astro request-response component with no Props interface (site.ts singleton import instead)"
  - "Skip link as first child of <body>, before atmospheric glow divs and before <Nav />, tab-order-sensitive ordering documented in Base.astro"

requirements-completed: [LAY-03, SEO-06, A11Y-01]

# Metrics
duration: 7min
completed: 2026-09-02
---

# Phase 2 Plan 1: Nav Component + Layout Shell Summary

**Fixed nav bar (brand wordmark, 4 section links, live Connect anchor) wired into Base.astro with a skip link, main#main-content landmark, and a global cyan :focus-visible glow — all locked behind a deterministic dist/ gate that started RED and now reports violations=0.**

## Performance

- **Duration:** ~7 min (commit-to-commit)
- **Started:** 2026-09-02T22:29:00-03:00
- **Completed:** 2026-09-02T22:35:48-03:00
- **Tasks:** 2 completed
- **Files modified:** 6 (2 created source files, 1 created gate script, 3 modified)

## Accomplishments
- A visitor loading the site now sees a real fixed nav bar with brand, 4 section links, and a live Connect anchor — not the bare Phase 1 scaffolding page
- A keyboard-only visitor pressing Tab once lands on a visible "Pular para o conteúdo" skip link that jumps to `#main-content`, proven by character-offset assertion in `verify-shell.mjs`, not visual inspection alone
- Every keyboard-focusable element in the shell shows the cyan `:focus-visible` outline + glow via one global CSS primitive
- The page declares `lang="pt-BR"` and exposes exactly one `<nav>` and one `<main id="main-content">` landmark, with a source-level check (`src/pages/index.astro` must not contain `<main`) preventing a nested-landmark regression
- SEO-06 and A11Y-01 (skip link, focus-visible, semantic landmarks — desktop nav surface only) are now closed by an automated gate instead of an assumption; LAY-03's desktop half is closed, mobile toggle behaviour deferred to 02-02

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the focus-glow and skip-link CSS primitives, then write the shell gate RED** - `c1ccd1b` (feat)
2. **Task 2: Build the nav component and wire the shell into the layout — gate goes green** - `f84d26e` (feat)

**Plan metadata:** commit pending (this SUMMARY + REQUIREMENTS.md, worktree mode — orchestrator finalizes shared files)

## Files Created/Modified
- `src/styles/global.css` - Added the global `:focus-visible` glow primitive and `.skip-link`/`.skip-link:not(:focus)` off-screen mechanics, placed between `.btn-primary:hover` and the scrollbar rules per the file's existing ordering convention
- `scripts/verify-shell.mjs` - New dependency-free Node ESM gate (fs/path only) checking lang, landmark cardinality/attributes, skip-link tab-order position, nav anchor contract, Connect-as-anchor (D-02), brand string (read live from `src/data/site.ts`), SEC-01 markup non-regression, and built-CSS focus/skip-link rules; prints one `SHELL SUMMARY` line and accumulates all violations before exiting
- `package.json` - Added `verify:shell` script, inserted into the `verify` aggregate chain between `verify:tokens` and `verify:schema` (not at the end — `verify:schema`'s negative probe leaves `dist/` unusable for anything running after it)
- `src/components/Nav.astro` - New nav component: `<nav aria-label="Navegação principal">`, brand wordmark bound to `{site.brand}`, 4 desktop section anchors, `<a href="#contact">Connect</a>` (never a button), inert mobile toggle `<button>` with `w-11 h-11` (44×44px) hit target and `<Icon name="material-symbols:menu">` — no `<script>`, no overlay markup (plan 02-02 scope)
- `src/layouts/Base.astro` - Added `Nav` import; inserted skip link as first child of `<body>` (before the glow-cloud divs), mounted `<Nav />` after the glow clouds, wrapped the existing `<slot />` in `<main id="main-content" class="relative z-10 pt-32">`; `lang="pt-BR"`, all 12 `@fontsource` imports, `bg-grid-pattern`, and both glow-cloud divs left untouched
- `src/pages/index.astro` - Changed the page's own `<main>`/`</main>` wrapper to `<div>`/`</div>` to avoid nesting a second `<main>` landmark inside the layout's new one

## Decisions Made
- `verify-shell.mjs` reads `site.brand` live via regex from `src/data/site.ts` at gate runtime rather than hardcoding the current placeholder string, so the gate keeps working once real content replaces the D-03 placeholders
- Code comments in `Nav.astro` describing what was intentionally NOT ported from the prototype (bold-weight override, invalid radius class, icon-font span, script tag) were phrased to avoid containing the literal banned substrings, since Task 2's own verify script scans the component's raw source text — a comment that says the exact banned string would otherwise fail its own gate

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2 verify script false-positive from documentation comments**
- **Found during:** Task 2, first automated verify run
- **Issue:** `Nav.astro`'s header comment documented the four corrections made to the ported prototype markup, and in doing so contained the literal substrings `font-bold`, `rounded-DEFAULT`, `material-symbols-outlined`, and `<script` — exactly the strings the Task 2 automated verify command scans for to prove those patterns were NOT reintroduced. The comment explaining the fix was itself tripping the check meant to prove the fix.
- **Fix:** Reworded the comment to describe each correction without using the literal banned substring (e.g. "the prototype's extra bold-weight override" instead of the literal class name), preserving the same documentation content.
- **Files modified:** `src/components/Nav.astro`
- **Verification:** Re-ran the Task 2 automated verify block; all checks pass, `console.log('OK')` printed.
- **Committed in:** `f84d26e` (Task 2 commit — comment was fixed before the task's single commit, not as a separate follow-up)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 — bug/false-positive in self-authored documentation)
**Impact on plan:** Cosmetic-only fix to code comments; no behavioral or markup change. No scope creep.

## Issues Encountered

**`npm run verify:tokens` fails in this worktree — pre-existing, unrelated to this plan.** `Arquivos de design/` (the folder `scripts/verify-design-tokens.mjs` reads `DESIGN.md` from) is untracked in git on the base branch (confirmed via `git log --all -- "Arquivos de design"` returning no history, and `git status --short` showing it as `??` even on the base commit). `git worktree add` only checks out committed content, so this untracked folder is absent from the isolated worktree this plan executed in, even though it exists in the main working copy on disk. Neither of this plan's two tasks touches `DESIGN.md` or `verify-design-tokens.mjs`, and the two new CSS primitives added in Task 1 are plain rule blocks appended after `.btn-primary:hover`, entirely outside the `@theme static` block that gate diffs — they cannot be the cause. `npm run build`, `npx astro check` (0 errors), `npm run verify:sec01` (`external_refs=0`), `npm run verify:shell` (`violations=0`), and `npm run verify:schema` all pass cleanly in the same worktree, evidencing this plan's own changes are sound. Logged to `.planning/phases/02-layout-navigation-shell/deferred-items.md` for the orchestrator/next phase-transition review rather than fixed here (out of this plan's scope per the SCOPE BOUNDARY rule — fixing it would mean committing the entire design-assets folder, an unrelated and much larger change).

## Next Phase Readiness
- Plan 02-02 (mobile overlay + toggle script) can build directly on `Nav.astro`'s `data-menu-open="false"` attribute and the inert toggle button's `data-nav-toggle`/`aria-controls="nav-overlay"` attributes already in place
- Plan 02-03 (footer) can mount `<Footer />` after `</main>` in `Base.astro` following the same import/mount pattern established here for `<Nav />`
- The orchestrator should resolve the `Arquivos de design/` untracked-folder gap (see Issues Encountered) before or during the next phase transition, since it will reproduce in every future worktree-isolated plan that runs `npm run verify:tokens` or the full `npm run verify` aggregate

---
*Phase: 02-layout-navigation-shell*
*Completed: 2026-09-02*
