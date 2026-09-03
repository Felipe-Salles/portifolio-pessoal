---
phase: 03-content-sections
plan: 01
subsystem: ui
tags: [astro, tailwind-v4, content-collections-adjacent, site-ts-singleton, hero, dossier, verification-gate]

# Dependency graph
requires:
  - phase: 02-layout-navigation-shell
    provides: Base.astro shell (Nav/Footer mounted, <main id="main-content">), site.ts singleton fields (heroHeading/title/heroSubtitle/availabilityStatus/bio/systemSpecs), scroll-mt-32 nav-anchor convention
provides:
  - "<main>'s page container wrapper (20px mobile margin, 24px gutter, 1280px max-width, 160px section rhythm) — reused by every later section in this phase"
  - "Hero section: availability badge (CSS-only pulse), H1, title line, subtitle, PT-BR CTA linking to #projects"
  - "Dossier section: 8/4 grid split, data-driven bio paragraphs, System Specs panel"
  - "scripts/verify-sections.mjs — the Phase 3 deterministic dist/ gate, extensible by later plans in this phase"
affects: [03-02-tech-stack, 03-03-projects, 03-04-contact]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Runtime site.ts parser in the verification gate (regex scalar extraction + bracket-balanced array-literal extraction) rather than hardcoded placeholder-string expectations, so the gate survives content replacement in v2"
    - "Representative-utility selector matcher broadened to accept bare/variant-prefixed/opacity-modified compiled Tailwind selectors, since real markup reaches design tokens through those forms once scaffolding is deleted"

key-files:
  created:
    - scripts/verify-sections.mjs
  modified:
    - package.json
    - src/layouts/Base.astro
    - scripts/verify-design-tokens.mjs
    - src/pages/index.astro

key-decisions:
  - "container=ok is only achievable after Task 3 (not Task 2) because the container group's 'sections are direct children of <Base>' check requires the actual <section> elements Task 3 adds — Task 2's own acceptance criteria bullet claiming early container=ok was aspirational, not literally enforced by Task 2's automated verify block."
  - "CTA-anchor gate check must select the href=\"#projects\" anchor carrying btn-primary, not merely the first href=\"#projects\" match — the Nav bar (Phase 2) already links to #projects with plain text."

requirements-completed: [HERO-01, HERO-02, DOSS-01, DOSS-02]

# Metrics
duration: 25min
completed: 2026-09-03
---

# Phase 3 Plan 1: Page Container, Hero & Dossier Sections Summary

**Hero (pulsing availability badge, H1/title/subtitle, PT-BR "VER PROJETOS" CTA) and Dossier (8/4 grid, data-driven bio + System Specs) sections replace Phase 1's scaffolding, wrapped by a new `<main>` container carrying the 20px/24px/1280px/160px layout tokens; Phase 3's `verify-sections.mjs` gate proves all of it against `dist/`.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-03T09:33:00-03:00 (approx, first file read)
- **Completed:** 2026-09-03T09:41:06-03:00
- **Tasks:** 3
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- A visitor loading the site now sees a real Hero: pulsing cyan availability badge, the H1 identity heading, a professional title line, a supporting paragraph, and a CTA that jumps toward `#projects`.
- Scrolling past the Hero reveals a Dossier section with data-driven bio paragraphs beside a glowing System Specs panel, reflowing to a single column on mobile.
- `<main>` now carries the 20px mobile margin / 24px gutter / 1280px max-width / 160px section-rhythm wrapper every later section in this phase depends on.
- Phase 1's design-token gate (`verify:tokens`) stays green (`mismatches=0`) after the Phase 1 scaffolding token gallery was deleted, by broadening its representative-utility matcher to accept variant-prefixed and opacity-modified compiled selectors instead of only bare ones.
- A new Phase 3 gate (`scripts/verify-sections.mjs`) deterministically proves the container/Hero/Dossier contract against `dist/index.html` and the built CSS, parsing expected values from `site.ts` at runtime rather than hardcoding placeholder literals.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the Phase 3 sections gate — RED** - `fecea9e` (test)
2. **Task 2: Wrap main with the page container, make the token gate variant-aware** - `e893be2` (feat)
3. **Task 3: Replace the scaffolding with the Hero and Dossier sections — GREEN** - `65a1c68` (feat)

_No separate plan-metadata commit — this is a worktree-isolated execution; the orchestrator handles STATE.md/ROADMAP.md updates centrally after merge._

## Files Created/Modified
- `scripts/verify-sections.mjs` - New Phase 3 gate: parses `site.ts` at runtime, then asserts the `<main>` container contract, the Hero contract (badge/H1/title/subtitle reading order, CSS-only pulse, PT-BR CTA, D-03 name-never-rendered guard), and the Dossier contract (8/4 grid, bio paragraph-count parity, System Specs values, typography-budget corrections) against `dist/`.
- `package.json` - Added `verify:sections` script, wired into the aggregate `verify` chain after `verify:shell` and before `verify:schema`.
- `src/layouts/Base.astro` - `<main>` class list gains `pb-section-gap px-margin-mobile md:px-gutter max-w-container-max mx-auto space-y-section-gap`.
- `scripts/verify-design-tokens.mjs` - Swapped the gallery-only `.gap-gutter` representative-utility entry for `.px-gutter` (genuinely used by Nav/Footer/`<main>`); broadened the utility-selector matcher to accept bare, variant-prefixed (`md:`), or opacity-modified (`/30`, `/50`, `/20`) compiled selectors.
- `src/pages/index.astro` - Rewritten: Phase 1's pipeline-proof scaffolding deleted; now renders the Hero and Dossier sections as direct children of `<Base>`, sourcing every string from `site.ts`.

## Decisions Made
- Kept the `<main>`-wrapper edit inside `Base.astro` (RESEARCH.md's recommended resolution to its own Open Question 1, locked by the UI-SPEC) rather than adding a per-page wrapper `<div>` in `index.astro` — matches the prototype's actual structure and avoids double-wrapping when Phase 4's 404 page needs the same container.
- The Phase 3 gate parses `site.ts` values at runtime (regex scalar extraction + bracket-balanced array parsing) instead of hardcoding today's placeholder strings, so it keeps working unmodified once v2's REAL-01 replaces the content.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mobile background-grid check matched only literal source syntax, not the compiled dist/ output**
- **Found during:** Task 2 (verifying the container group's built-CSS assertion)
- **Issue:** The Task 1 gate's `.bg-grid-pattern` media-query regex expected the literal source syntax `@media (max-width: 768px)`, but Lightning CSS (Tailwind v4's minifier) compiles this to modern range syntax `@media (width<=768px)` in `dist/`'s built CSS — the regex never matched real build output.
- **Fix:** Regex now accepts either `max-width:768px` or `width<=768px` in the stripped CSS.
- **Files modified:** scripts/verify-sections.mjs
- **Verification:** `node scripts/verify-sections.mjs` — container group's mobile-grid check passes against the actual `dist/` CSS.
- **Committed in:** e893be2 (Task 2 commit)

**2. [Rule 1 - Bug] CTA-anchor check matched the Nav's plain-text `#projects` link instead of the Hero's btn-primary CTA**
- **Found during:** Task 3 (first GREEN run of the Hero group)
- **Issue:** The gate's original CTA check took the *first* `href="#projects"` anchor in document order, which is Phase 2's Nav bar link ("Projects", no `btn-primary`, no "VER PROJETOS") — it appears before the Hero's real CTA in `dist/index.html`, so the check always failed even with correct Hero markup.
- **Fix:** The check now scans every `href="#projects"` anchor and selects the one carrying `btn-primary`, then validates its text against that specific anchor.
- **Files modified:** scripts/verify-sections.mjs
- **Verification:** `node scripts/verify-sections.mjs` reports `hero=ok`.
- **Committed in:** 65a1c68 (Task 3 commit)

**3. [Rule 1 - Bug] index.astro's own explanatory comments tripped the gate's literal string-ban checks**
- **Found during:** Task 3 (running the task's automated verify command)
- **Issue:** The frontmatter comment header documented the mandatory deviations from the prototype using the literal banned substrings (`rounded-DEFAULT`, `mono-code`, `site.name`) as prose — the plan's own verify command does a naive `s.includes(...)` scan of the whole file, which does not distinguish comments from real markup, so the ban tripped on documentation text rather than actual code.
- **Fix:** Reworded the three comment lines to describe the corrections without using the banned literal substrings.
- **Files modified:** src/pages/index.astro
- **Verification:** The Task 3 automated verify command's string-ban loop passes.
- **Committed in:** 65a1c68 (Task 3 commit, folded into the same file edit — not a separate commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs discovered in the plan's own gate/comment text while verifying, not in the shipped markup contract)
**Impact on plan:** All three fixes are corrections to verification tooling and documentation comments, not to the Hero/Dossier markup contract itself. No scope creep — the shipped `<section>` markup matches the plan's `<action>` block verbatim.

## Issues Encountered
- Task 2's acceptance-criteria bullet ("`npm run verify:sections` still reports `hero=fail dossier=fail`, and now reports `container=ok`") could not be satisfied until Task 3, because the container group's "sections are direct children of `<Base>`" check (part of Task 1's own gate design) requires the actual `<section>` elements Task 3 adds. Task 2's own `<verify>` automated block does not invoke `verify:sections` at all, so this did not block Task 2's completion — confirmed `container=ok` is correctly reported only from Task 3 onward, matching Task 3's acceptance criteria (`container=ok hero=ok dossier=ok violations=0`).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `verify:sections` (`container=ok hero=ok dossier=ok violations=0`), the full `npm run verify` chain, and `npx astro check` (0 errors) all pass — ready for plan 03-02 to append the Tech Stack section's `stack=` key to the same summary line without touching the container/hero/dossier groups.
- `<main>`'s wrapper and `space-y-section-gap` rhythm are in place for every remaining section in this phase; no further layout-plumbing work is needed before 03-02/03-03/03-04 land.
- No blockers.

---
*Phase: 03-content-sections*
*Completed: 2026-09-03*
