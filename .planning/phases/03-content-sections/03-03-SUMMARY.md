---
phase: 03-content-sections
plan: 03
subsystem: ui
tags: [astro, tailwind-v4, content-collections, astro-assets, projects-grid, verification-gate, phase-close]

# Dependency graph
requires:
  - phase: 03-content-sections
    plan: 02
    provides: "Tech Stack and Contact sections as direct children of <Base>, scripts/verify-sections.mjs (container/hero/dossier/stack/contact groups), Contact positioned last so Projects has a fixed insertion point"
provides:
  - "Projects section: getCollection(\"projects\")-driven grid, featured-first sort (two filter()+sort() calls, Number.MAX_SAFE_INTEGER order fallback), astro:assets Image for real cover photos, cyan gradient-fallback panel with hover reaction for entries without one, tab-nabbing-safe external links"
  - ".group:hover .cover-fallback / .cover-fallback-icon primitives in global.css (D-09)"
  - "scripts/verify-sections.mjs projects and fidelity groups — closes the Phase 3 gate (7/7 groups green)"
  - "Human-confirmed visual fidelity against Arquivos de design/screen.png (LAY-02) and mobile reflow (LAY-01)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Runtime YAML frontmatter parser (scalar + bracket-balanced array extraction) for src/content/projects/*.md, mirroring the site.ts runtime parser already established in plan 03-01, so the gate keeps working once v2's REAL-02 adds real entries"
    - "Two independent .filter()+.sort() calls concatenated (featured-first, each group independently order-sorted) instead of one comparator — makes D-07's contract explicit in code rather than encoded in comparator logic"
    - "cssLoose (whitespace-collapsed, descendant-combinator-preserving) CSS copy added to verify-sections.mjs, mirroring verify-shell.mjs's existing technique — needed for the first descendant-combinator CSS assertion in this gate (.group:hover .cover-fallback)"

key-files:
  created: []
  modified:
    - scripts/verify-sections.mjs
    - src/styles/global.css
    - src/pages/index.astro

key-decisions:
  - "cssLoose and findCssBlock (mirroring scripts/verify-shell.mjs) were added to scripts/verify-sections.mjs in this plan — the interfaces section of 03-03-PLAN.md assumed both already existed from plan 03-02, but neither was actually present in the file; Task 1 added them since the .group:hover .cover-fallback assertion requires a descendant-combinator-safe CSS copy."
  - "PROJ-01 through PROJ-04, LAY-01 and LAY-02 close in this plan. LAY-02's visual-fidelity clause required the human-verify checkpoint (Task 3) — automated verification alone proves every machine-checkable clause but not visual match to screen.png."

requirements-completed: [PROJ-01, PROJ-02, PROJ-03, PROJ-04, LAY-01, LAY-02]

# Metrics
duration: 35min
completed: 2026-09-03
---

# Phase 3 Plan 3: Projects Grid & Phase Close Summary

**Projects grid renders one card per Content Collection entry (featured-first sort, astro:assets cover images with a cyan gradient fallback, tab-nabbing-safe external links) between Tech Stack and Contact; `verify-sections.mjs` closes at 7/7 groups green, and a human reviewer confirmed desktop/mobile visual fidelity against `screen.png`.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-09-03T09:57:00 (approx, first file read)
- **Completed:** 2026-09-03T10:03:00 (checkpoint approved)
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- A visitor scrolling past the Tech Stack now sees a Projects grid generated entirely from the `projects` Content Collection — one `<article>` per entry, always three columns wide on desktop regardless of entry count (D-05), with featured entries sorted first and rendered visually larger (`md:col-span-2 border-glow-cyan`, D-06/D-07).
- Cards without a `coverImage` (today's only entry) render a cyan gradient panel with a centered code glyph that brightens and grows slightly on hover (D-08/D-09) — a new `.group:hover .cover-fallback` / `.cover-fallback-icon` CSS primitive, keyed off the same `group` marker the real-photo grayscale-reveal hover will use once v2 adds real cover images.
- Every `liveUrl`/`repoUrl` anchor carries `rel="noopener noreferrer"` and is scoped to an `https://` scheme allowlist from the first card (PROJ-03), even though neither anchor renders today since the placeholder entry sets no URLs.
- `scripts/verify-sections.mjs` gained a `projects` group (card/tag/link/cover-image parity, gradient-fallback composition, sort-contract source checks) and a `fidelity` group (five-section document order, scroll-mt-32 + anchor/id cross-check, the 4-size/2-weight typography budget, the nine-string prototype-persona blocklist) — the gate now reports `container=ok hero=ok dossier=ok stack=ok contact=ok projects=ok fidelity=ok violations=0`.
- A human reviewer confirmed the finished five-section page (Hero → Dossier → Tech Stack → Projects → Contact) matches `Arquivos de design/screen.png` in layout, proportion, colour and glow at desktop width, reflows correctly to a single column with visible margins and a smaller background grid at ~375px, and every hover/focus/anchor-jump behaviour works as specified — closing LAY-01 and LAY-02, and with them all of Phase 3's ROADMAP success criteria.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the sections gate with the projects and fidelity contracts — RED** - `b060b84` (test)
2. **Task 2: Build the gradient-fallback primitive and the Projects grid — GREEN** - `5f578a1` (feat)
3. **Task 3: Confirm the finished page against the prototype and on mobile** - human-verify checkpoint, developer verdict "approved", no code changes (verification-only task)

_No separate plan-metadata commit for STATE.md/ROADMAP.md in this SUMMARY commit — this is a sequential (non-worktree) execution on the main tree per the orchestrator's explicit instruction; the orchestrator updates STATE.md/ROADMAP.md/REQUIREMENTS.md centrally after this summary lands._

## Files Created/Modified
- `scripts/verify-sections.mjs` - Added a runtime `src/content/projects/*.md` frontmatter parser (title/description/tags scalar+array extraction, presence flags for `liveUrl`/`repoUrl`/`coverImage`/`featured`/`order`); added a `cssLoose` whitespace-collapsed CSS copy and a `findCssBlock` helper (mirroring `verify-shell.mjs`, needed for the first descendant-combinator CSS assertion in this gate); added the `projects` check group (section slice extraction, grid/article/tag/anchor/cover-image parity, gradient-fallback composition, `.group:hover` CSS rules, sort-contract source checks) and the `fidelity` check group (five-section order, `scroll-mt-32` + anchor/id cross-check, typography size/weight budget, prototype-string blocklist); extended the `SECTIONS SUMMARY` line with `projects=` and `fidelity=` keys.
- `src/styles/global.css` - Added `.group:hover .cover-fallback` (barely-visible cyan wash) and `.group:hover .cover-fallback-icon` (opacity lift + 8% scale) immediately after `.btn-primary:hover`, following the file's existing state-only-primitive convention; no other primitive touched.
- `src/pages/index.astro` - Added `getCollection` (`astro:content`) and `Image` (`astro:assets`) imports; added the featured/rest sort (`Number.MAX_SAFE_INTEGER` fallback, never `Infinity`); inserted the Projects `<section>` between Tech Stack and Contact rendering the sorted collection as a `md:grid-cols-3` grid of cards, each with a conditional `<Image>`/gradient-fallback header, title/description/tags body, and independently-optional Live/Repo links.

## Decisions Made
- Kept the featured/rest split as two separate `.filter().sort()` calls concatenated, rather than one comparator encoding both the featured-group and the order-within-group logic — matches RESEARCH.md Pattern 4's explicit rationale (a single comparator makes the "featured-first, independently order-sorted" contract easy to get subtly wrong).
- Left `grid-auto-flow` at its CSS default (sparse `row`) per the plan's constraint — the trailing empty cell a `md:col-span-2` featured card leaves in its row is intentional, not a bug; `dense` would silently reorder cards and violate D-07's featured-first visual contract.
- Added `cssLoose` and `findCssBlock` to `scripts/verify-sections.mjs` in Task 1 rather than treating their absence as a plan-interface error requiring an architectural conversation — this is CSS-assertion tooling internal to the gate script, additive and non-breaking to the five existing groups, so it was handled as a Rule 3 blocking-issue fix rather than escalated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `cssLoose` and `findCssBlock` did not already exist in `scripts/verify-sections.mjs`, despite the plan's `<interfaces>` section describing them as already left by plan 03-02**
- **Found during:** Task 1 (implementing the `.group:hover .cover-fallback` / `.cover-fallback-icon` built-CSS assertions)
- **Issue:** The plan's interfaces section states the gate already has "the `cssStripped` and `cssLoose` normalised CSS copies." Reading the actual file (post-03-02) showed only `cssStripped` was present — `cssLoose` and the `findCssBlock` helper (both present in `verify-shell.mjs`) had never been added to `verify-sections.mjs`, because no earlier group in this gate needed a descendant-combinator CSS selector assertion.
- **Fix:** Added a `cssLoose` copy (mirroring `verify-shell.mjs`'s whitespace-collapse-but-preserve-descendant-space technique) and a `findCssBlock` helper (identical logic, copied and commented as such) directly after `extractElementInner`/`cssStripped` in `verify-sections.mjs`.
- **Files modified:** scripts/verify-sections.mjs
- **Verification:** `.group:hover .cover-fallback` and `.group:hover .cover-fallback-icon` assertions correctly match the built CSS in both the RED (Task 1, absent — correctly flagged) and GREEN (Task 2, present — correctly passes) runs.
- **Committed in:** b060b84 (Task 1 commit)

**2. [Rule 1 - Bug] `index.astro`'s own explanatory deviations comment tripped the gate's literal string-ban checks**
- **Found during:** Task 2 (running the task's automated verify command after the first GREEN attempt)
- **Issue:** Same class of issue as plan 03-01 deviation #3 and plan 03-02 deviation #1 — the frontmatter comment documenting the Projects section's mandatory prototype deviations used the literal banned substrings `<Image>`, `background-image`, `bg-gradient-to-br` and `font-mono-code` as prose (describing what was deliberately *not* done), which the gate's naive `s.includes(...)` scan flagged as if the banned pattern were actually used in code. This tripped both the `projects` group's `<Image` occurrence-count check (counted the comment's `<Image>` mention as a second usage) and the `fidelity` group's blocklist.
- **Fix:** Reworded the four affected comment lines to describe the same corrections without using the literal banned substrings (e.g. "astro:assets' Image component" instead of `<Image>`, "the prototype's inline style-attribute cover div" instead of `background-image`, "the v3-era gradient utility" instead of `bg-gradient-to-br`, "the smaller mono token" instead of `font-mono-code`).
- **Files modified:** src/pages/index.astro
- **Verification:** `npm run verify:sections` reports `projects=ok fidelity=ok violations=0` after the reword; `npm run verify` and `npx astro check` (0 errors) both pass.
- **Committed in:** 5f578a1 (Task 2 commit, folded into the same file edit — not a separate commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 — gate tooling gap, needed to complete the task; 1 Rule 1 — the same comment/gate-scan interaction bug already seen twice in this phase). Neither changes the shipped Projects markup contract from the plan's `<action>` block — both are corrections to verification tooling and documentation-comment wording.
**Impact on plan:** No scope creep. The rendered `<section id="projects">` markup, the sort logic, and the gradient-fallback CSS all match the plan's `<action>` block verbatim.

## Issues Encountered
None beyond the two deviations above.

## User Setup Required
None — no external service configuration required.

## Checkpoint Verification (Task 3)

**Verdict:** Approved by the developer — no mismatches reported.

**Automated verification confirmed passing before the checkpoint:**
- `npm run verify` (build → sec01 → tokens → shell → sections → schema) exits 0.
- `npm run verify:sections` → `SECTIONS SUMMARY container=ok hero=ok dossier=ok stack=ok contact=ok projects=ok fidelity=ok violations=0`.
- `npx astro check` → 0 errors.

**Human-confirmed (per the plan's `<how-to-verify>` checklist):**
- Desktop layout (~1440px) matches `Arquivos de design/screen.png` in structure, proportion, colour and glow across all five sections.
- Mobile reflow (~375px): single-column grids, visible horizontal margin on both edges, a visibly smaller background grid, no horizontal overflow.
- All hover states confirmed: project card gradient fallback (brighten + icon grow/opacity), Hero CTA (cyan glow), Contact circular buttons (border/icon turn cyan + glow).
- Keyboard focus ring confirmed visible and in the expected tab order (skip link → nav links → Hero CTA → Contact buttons).
- All five in-page anchors (Dossier, Stack, Projects, Contact, Hero's "VER PROJETOS") scroll to their section with the heading clear of the fixed nav.

No gaps or follow-up items were reported.

## Next Phase Readiness
- All six ROADMAP Phase 3 success criteria are met: `npm run verify:sections` reports 7/7 groups `ok` with `violations=0`, `npm run verify` and `npx astro check` both pass clean, and the developer has confirmed visual fidelity and mobile reflow against the approved prototype.
- Every Phase 3 requirement is closed: HERO-01, HERO-02, DOSS-01, DOSS-02, TECH-01, TECH-02, PROJ-01, PROJ-02, PROJ-03, PROJ-04, CONT-01, LAY-01, LAY-02.
- The site still loads zero external origins (`verify:sec01` → `external_refs=0`) and ships zero client-side JavaScript beyond Phase 2's nav toggle.
- Ready for Phase 4 (or the next milestone step) — no blockers, no deferred items from this plan.

---
*Phase: 03-content-sections*
*Completed: 2026-09-03*

## Self-Check: PASSED

All key files confirmed present on disk (`scripts/verify-sections.mjs`, `src/styles/global.css`, `src/pages/index.astro`, this SUMMARY.md). Both task commits (`b060b84`, `5f578a1`) confirmed present in `git log`.
