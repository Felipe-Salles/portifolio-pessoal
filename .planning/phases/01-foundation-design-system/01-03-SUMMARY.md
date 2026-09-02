---
phase: 01-foundation-design-system
plan: 03
subsystem: data
tags: [astro, content-collections, zod, content-layer, singleton-config]

# Dependency graph
requires:
  - phase: 01-foundation-design-system (plan 01)
    provides: Working Astro 7 build pipeline, deliberately-failing verify:schema stub
provides:
  - "A validating `projects` Content Layer collection at `src/content.config.ts`
    with the full Phase-3-ready field set (title, description, tags, liveUrl,
    repoUrl, coverImage via image(), featured, order)"
  - "One minimal placeholder project entry proving the schema tolerates
    only-required-fields (title/description/tags)"
  - "A real `scripts/verify-content-schema.mjs` gate: location + shape +
    positive-build + negative-build (proves rejection, not just acceptance)
    + D-03 placeholder-convention checks"
  - "A typed `site` singleton at `src/data/site.ts` covering identity, hero,
    bio, System Specs, the 3 tech-stack categories, and social links — not
    yet imported/rendered anywhere"
affects: [phase-02-layout-navigation, phase-03-content-sections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Content Layer collections at src/content.config.ts (not the legacy
      src/content/config.ts, which Astro 6+ silently ignores)"
    - "schema declared as the injected-function form ({ image }) =>
      z.object({...}) whenever image() is used in a Content Collection schema"
    - "Verification gates that actually run a negative probe (an invalid
      entry that must break the build) rather than only asserting the happy
      path — extends the plan 01-01/01-02 dependency-free Node ESM gate
      pattern to include build-subprocess assertions"
    - "Singleton, non-repeating site content lives in a plain typed
      TypeScript module (src/data/site.ts) with `as const`, never a Content
      Collection — reserved for src/content/projects/, the one genuine
      repeating list"

key-files:
  created:
    - src/content.config.ts
    - src/content/projects/placeholder-project.md
    - src/data/site.ts
  modified:
    - scripts/verify-content-schema.mjs

key-decisions:
  - "scripts/verify-content-schema.mjs runs two full `npx astro build`
    subprocess invocations (positive + negative) rather than a lighter Zod-only
    unit check, per the plan's explicit instruction that this cost (a few
    seconds for a one-page site) is worth the confidence that the schema is
    genuinely enforced by the real build pipeline, not just by a code review
    of the schema definition."
  - "The negative-test probe file (`__schema-probe.md`) is deleted in a
    finally block that runs regardless of build success, failure, or thrown
    error — a leftover probe would silently poison every later build with an
    extra invalid entry."
  - "D-03 convention check treats `src/data/site.ts` as optional at Task 1
    time (file doesn't exist yet) and becomes mandatory once Task 2 creates
    it — verified both states pass without special-casing in the plan
    sequencing itself, purely via existsSync."

patterns-established:
  - "Any future Content Collection in this project should follow
    src/content.config.ts's pattern: glob() loader + schema as an
    ({ image }) => z.object({...}) function even when image() isn't used,
    for consistency."
  - "Any future singleton content (not a repeating list) extends
    src/data/site.ts directly rather than spawning a new Content Collection."

requirements-completed: []

# Metrics
duration: 25min
completed: 2026-09-02
---

# Phase 1 Plan 3: Content Data Foundation (Projects Collection + Site Singleton) Summary

**A schema-validated `projects` Content Layer collection (with the Phase-3-ready `coverImage`/`featured`/`order` fields locked in now) proven by an actual negative-build probe, plus a typed `site` singleton — the last piece of Phase 1's Walking Skeleton, with zero UI rendered.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-02 (after 01-01/01-02 review)
- **Completed:** 2026-09-02
- **Tasks:** 2/2 completed
- **Files modified:** 4 (3 created: `src/content.config.ts`, `src/content/projects/placeholder-project.md`, `src/data/site.ts`; 1 replaced-stub: `scripts/verify-content-schema.mjs`)

## Accomplishments

- Defined the `projects` Content Layer collection at the correct (non-legacy) `src/content.config.ts` location, with `glob({ pattern: "**/*.md", base: "./src/content/projects" })` and a schema function `({ image }) => z.object({...})` carrying all 8 required fields (`title`, `description`, `tags`, `liveUrl`, `repoUrl`, `coverImage`, `featured`, `order`)
- Created `src/content/projects/placeholder-project.md` supplying only the three required fields, following D-03's marker convention exactly (`"[Nome do Projeto]"`, `"PLACEHOLDER — descrição do projeto a definir"`, `["PLACEHOLDER"]`) — confirms the schema tolerates a minimal entry, ROADMAP Phase 1 success criterion #3
- Replaced the `scripts/verify-content-schema.mjs` failing stub with a real 5-part gate: location check, shape check (regex-verified schema-function form + glob base + all 8 field names), a positive `npx astro build` (must exit 0), a negative `npx astro build` against a temporary probe entry missing `description` (must exit non-zero — this is the check that actually proves enforcement, not just presence of a Zod schema), and the D-03 placeholder/fictional-string convention check across all project content files plus `src/data/site.ts`
- Verified the negative test is real, not assumed: the probe build failed as expected (`negative=pass`), and the probe file was deleted afterward regardless (confirmed absent post-run)
- Scaffolded `src/data/site.ts` — the D-02 typed singleton covering brand/identity, hero heading/subtitle/availability, bio paragraphs, System Specs label/value pairs, the three fixed tech-stack categories (`languages`/`frameworks`/`infrastructure`), and social links using the 4 verified base-name `material-symbols:` icons (`code`, `work`, `mail`, `chat`) — every value a conspicuous D-03 placeholder, no form-related fields (contact form is out of scope per REQUIREMENTS.md)
- Final `npm run verify` (build + verify:sec01 + verify:tokens + verify:schema) is fully green: `SEC01 SUMMARY external_refs=0`, `TOKENS SUMMARY mismatches=0`, `SCHEMA SUMMARY location=ok shape=ok positive=pass negative=pass placeholders=2_files_ok`

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the projects collection and prove the schema enforces its contract** - `47b75f4` (feat)
2. **Task 2: Scaffold the typed singleton site content** - `abdae68` (feat)

**Plan metadata:** (this commit, following SUMMARY.md creation)

## Files Created/Modified

- `src/content.config.ts` - `projects` Content Layer collection: glob loader + schema function with all 8 fields (title, description, tags, liveUrl, repoUrl, coverImage via image(), featured, order)
- `src/content/projects/placeholder-project.md` - minimal placeholder entry (title/description/tags only), D-03-marked
- `scripts/verify-content-schema.mjs` - real gate (~230 lines) replacing plan 01-01's failing stub: location + shape + positive build + negative build + D-03 convention checks
- `src/data/site.ts` - typed `site` singleton (`as const`) for identity, hero, bio, System Specs, tech stack (3 categories), and socials

## Decisions Made

- Kept the negative-test probe's cleanup in a `finally` block (not a bare post-check delete) so it runs even if the build subprocess throws unexpectedly, not just on the two expected exit-code paths.
- Left `src/data/site.ts`'s D-03 check as an `existsSync`-gated optional step in the gate rather than adding a plan-sequencing special case, since Task 1 must pass before Task 2 creates the file — this kept the gate's logic simple and correct for both states without extra flags.
- Did not switch the `z` import from `astro:content` to `astro/zod` despite `astro check` surfacing a `ts(6385) 'z' is deprecated` informational diagnostic (see Issues Encountered) — RESEARCH.md's Assumption A2 explicitly says either import path works, the diagnostic doesn't fail `astro check`'s 0-errors/0-warnings tally, and this is a zod-v4-internal advisory Astro re-exports as-is (not an Astro-specific deprecation of the `astro:content` export itself).

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched RESEARCH.md Pattern 5 and 01-PATTERNS.md's suggested shapes closely enough that no auto-fixes, architectural questions, or scope changes were needed.

## Issues Encountered

- `npx astro check` prints an informational `ts(6385): 'z' is deprecated` hint on every line referencing `z` from `astro:content` (zod v4's own soft-deprecation of the `z` namespace export, re-exported by Astro's Content Layer types). This does not affect the `0 errors` tally `astro check` reports, and RESEARCH.md's Assumption A2 already flagged both import paths (`astro:content` vs `astro/zod`) as viable — no action taken, documented here for Phase 2/3 visibility in case a future Astro/zod upgrade turns this into a hard error.
- `astro-icon` continues to print the pre-existing, harmless `Failed to load icons from "src/icons"` warning first noted in 01-01-SUMMARY.md — unrelated to this plan's scope, that directory intentionally doesn't exist.

## User Setup Required

None - no external service configuration required. Everything in this plan resolves at build time from the existing dependency tree (no new packages installed).

## Next Phase Readiness

- `npm run verify:schema` is GREEN and enforces both schema correctness and the D-03 placeholder convention going forward — any future project entry missing a required field, or any placeholder-looking-real content, breaks the gate loudly.
- `src/content.config.ts` and `src/content/projects/placeholder-project.md` are ready for Phase 3 to query via `getCollection('projects')` — no schema migration will be needed for `coverImage`/`featured`/`order` since they're typed and optional from this phase onward.
- `src/data/site.ts` is ready for Phase 2 (nav wordmark/brand) and Phase 3 (Hero/Dossier/Stack/Contact sections) to import — every field group named in `01-PATTERNS.md`'s mapping table exists with the correct shape.
- All three Phase 1 plans (`01-01`, `01-02`, `01-03`) are now complete; `npm run verify` runs the full aggregate gate (build + SEC-01 + tokens + schema) and is fully green. No blockers identified for Phase 2.

---
*Phase: 01-foundation-design-system*
*Completed: 2026-09-02*

## Self-Check: PASSED

All 3 created files (`src/content.config.ts`, `src/content/projects/placeholder-project.md`, `src/data/site.ts`) and the modified `scripts/verify-content-schema.mjs` confirmed present on disk. Both task commits (`47b75f4`, `abdae68`) confirmed present in git history.
