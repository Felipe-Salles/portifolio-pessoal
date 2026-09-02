---
phase: 01-foundation-design-system
plan: 01
subsystem: infra
tags: [astro, tailwindcss, vite, fontsource, astro-icon, sec-01, static-site]

# Dependency graph
requires: []
provides:
  - Working Astro 7 static build pipeline (npm run build/dev/preview/check)
  - Deterministic SEC-01 gate (scripts/verify-no-external-origins.mjs) that scans
    dist/ for external script/font/icon origins
  - src/layouts/Base.astro HTML shell (lang="pt-BR", self-hosted fonts, no
    real markup yet — scaffolded for Phase 2/3)
  - Self-hosted Inter/Lexend/JetBrains Mono fonts (12 per-weight imports) and
    all 7 required Material Symbols glyphs as inline SVG (astro-icon)
  - Deliberately-failing stubs for verify:tokens (plan 01-02) and verify:schema
    (plan 01-03), keeping package.json script surface stable for parallel plans
affects: [01-02-design-tokens, 01-03-content-collections, phase-02-layout-navigation]

# Tech tracking
tech-stack:
  added:
    - "astro@^7.2.10"
    - "tailwindcss@^4.3.3 + @tailwindcss/vite@^4.3.3"
    - "astro-icon@^1.2.0 + @iconify-json/material-symbols@^1.2.90"
    - "@fontsource/inter@^5.3.0, @fontsource/lexend@^5.3.0, @fontsource/jetbrains-mono@^5.3.0"
    - "@astrojs/check@^0.9.10 + typescript@^6.0.3 (pinned below npm latest 7.0.2 to satisfy @astrojs/check's peer range)"
  patterns:
    - "Dependency-free Node ESM verification scripts in scripts/, registered as npm run verify:*"
    - "Per-weight @fontsource CSS imports (never bare package import) to avoid silent weight-400-only loading"
    - "Tailwind v4 CSS-first @theme (no tailwind.config.* file anywhere in the repo)"
    - "astro-icon inline SVG via base glyph names only (no -outline suffix needed for this icon set)"

key-files:
  created:
    - package.json
    - astro.config.mjs
    - tsconfig.json
    - .gitignore
    - src/styles/global.css
    - src/layouts/Base.astro
    - src/pages/index.astro
    - scripts/verify-no-external-origins.mjs
    - scripts/verify-design-tokens.mjs (stub)
    - scripts/verify-content-schema.mjs (stub)
  modified: []

key-decisions:
  - "Pinned typescript@^6.0.3 explicitly instead of bare `typescript` — npm latest (7.0.2) falls outside @astrojs/check@0.9.10's peer range (^5.0.0 || ^6.0.0), confirmed via live `npm view` at execution time."
  - "SEC-01 gate scans dist/ deterministically (file+line violation reports plus a stable SEC01 SUMMARY line) rather than relying on manual DevTools inspection — catches bare <link rel=preconnect> tags that load nothing visible but still open an external DNS/TCP handshake."
  - "All 7 required Material Symbols glyphs resolve to base names with no -outline suffix, per RESEARCH.md's live Iconify search verification."

patterns-established:
  - "Verification harness: three dependency-free Node scripts under scripts/, each wired to an npm run verify:* script, aggregated by npm run verify."
  - "Base.astro imports global.css and all font weights in frontmatter; body carries the prototype's glow-cloud/bg-grid-pattern wrapper classes (unstyled until Plan 02 defines them in global.css)."

requirements-completed: [SEC-01]

# Metrics
duration: 30min
completed: 2026-09-02
---

# Phase 1 Plan 1: Walking Skeleton (Build Pipeline + SEC-01) Summary

**Astro 7 + Tailwind v4 static pipeline with self-hosted Inter/Lexend/JetBrains Mono fonts and inline-SVG Material Symbols icons, enforced zero-external-origin by an automated `dist/` scan (SEC-01).**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-09-02T19:05:00-03:00 (approx, file reads + research review)
- **Completed:** 2026-09-02T19:23:46-03:00
- **Tasks:** 3/3 completed
- **Files modified:** 11 created (package.json, package-lock.json, .gitignore, astro.config.mjs, tsconfig.json, src/styles/global.css, src/layouts/Base.astro, src/pages/index.astro, scripts/verify-no-external-origins.mjs, scripts/verify-design-tokens.mjs, scripts/verify-content-schema.mjs)

## Accomplishments
- Hand-authored `package.json` with the full `verify:*` script harness registered up front, so Plans 02/03 never touch `package.json` again (keeps their `files_modified` sets disjoint for parallel execution)
- Implemented `scripts/verify-no-external-origins.mjs`, a dependency-free deterministic SEC-01 gate: scans `dist/` for literal external-host substrings, `<link>`/`<script>` absolute-URL attributes, CSS `@import` external targets, `preconnect`/`dns-prefetch` tags, and `@font-face` external `src: url()` — reports file+line violations and always prints a stable `SEC01 SUMMARY files=<n> woff2=<n> fontface=<n> inline_svg=<n> external_refs=<n>` line
- Wired Astro 7 (`output: "static"`) + Tailwind v4 via `@tailwindcss/vite` + `astro-icon`, hand-authored (no `npm create astro`/`astro add tailwind`, per plan constraints on the non-empty repo root)
- Self-hosted all three font families via 12 per-weight `@fontsource/*` CSS imports (never bare package imports) and all 7 required Material Symbols glyphs as build-time inline SVG
- Final `SEC01 SUMMARY`: `external_refs=0, woff2=55, fontface=61, inline_svg=7` — SEC-01 fully satisfied and enforced by an automated, repeatable gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the SEC-01 verification harness (RED)** - `309e813` (feat)
2. **Task 2: Make the pipeline build end-to-end and turn the SEC-01 gate GREEN** - `b8fa2f7` (feat)
3. **Task 3: Self-host all fonts and icons — the real SEC-01 test** - `441257d` (feat)

**Plan metadata:** (this commit, following SUMMARY.md creation)

## Files Created/Modified
- `package.json` - Dependency manifest, Node `>=22.12.0` engine floor, full `verify:*` script harness
- `package-lock.json` - Lockfile for the full dependency tree (astro, tailwindcss, astro-icon, fontsource families, @astrojs/check, typescript)
- `.gitignore` - `node_modules/`, `dist/`, `.astro/`, `.vercel/`, plus env/editor entries
- `astro.config.mjs` - `output: "static"` explicit, `@tailwindcss/vite` plugin, `astro-icon` integration
- `tsconfig.json` - extends `astro/tsconfigs/strict`, excludes `dist` and `Arquivos de design`
- `src/styles/global.css` - bare `@import "tailwindcss";` (the `@theme` token block is Plan 02's deliverable)
- `src/layouts/Base.astro` - HTML shell: `lang="pt-BR"`, 12 per-weight `@fontsource` imports, prototype body/glow-cloud wrapper classes, no external origins
- `src/pages/index.astro` - pipeline-proof scaffolding: renders `PIPELINE OK`, all 7 Material Symbols glyphs, and font-family samples for all three self-hosted families
- `scripts/verify-no-external-origins.mjs` - the SEC-01 gate (~180 lines, exceeds the 60-line minimum)
- `scripts/verify-design-tokens.mjs` - deliberate failing stub for Plan 02
- `scripts/verify-content-schema.mjs` - deliberate failing stub for Plan 03

## Decisions Made
- Confirmed and applied RESEARCH.md's TypeScript pin (`^6.0.3`, not npm `latest`/`7.0.2`) by re-running `npm view typescript dist-tags` and `npm view @astrojs/check peerDependencies` live at execution time — both matched RESEARCH.md exactly, no drift since research was performed.
- Left `astro.config.mjs` without `integrations: [icon()]` in Task 2 (added in Task 3) exactly as the plan specified, to keep the GREEN-build task minimal before layering on font/icon self-hosting.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed false-positive in the 12-fontsource-import acceptance check**
- **Found during:** Task 3 (self-hosting fonts/icons)
- **Issue:** A frontmatter comment in `src/layouts/Base.astro` explaining the "bare import loads weight 400 only" pitfall contained the literal string `@fontsource/inter` in prose, which the acceptance criterion's regex (`/@fontsource\//g`) also matched — inflating the count to 13 instead of the expected 12 real imports.
- **Fix:** Reworded the comment to describe the pitfall without embedding a literal `@fontsource/` package-path string.
- **Files modified:** `src/layouts/Base.astro`
- **Verification:** Re-ran the acceptance check (`node -e "..."` regex count) — now reports exactly 12.
- **Committed in:** `441257d` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Cosmetic fix to a code comment; no functional or architectural change. No scope creep.

## Issues Encountered
- `npm install` for the core dependencies (Task 1) ran long enough to exceed the default 3-minute bash timeout and was moved to a background task; polled via lockfile presence until completion (~2-3 min total, no error). Not a plan deviation — normal network/registry latency for a fresh `node_modules` tree with `astro` as a dependency.
- `astro build` printed a non-fatal `[astro-icon] Failed to load icons from "src/icons"` warning (that local custom-icon directory doesn't exist and isn't needed — the project only consumes the `material-symbols` remote icon set via `@iconify-json/material-symbols`). Confirmed harmless: build succeeds, `astro check` reports 0 errors, and all 7 required glyphs render as inline SVG.

## User Setup Required
None - no external service configuration required. Everything in this phase resolves at build time from packages already installed via `npm install`.

## Next Phase Readiness
- `npm run verify` describes the full Phase 1 gate (build + all three verify scripts); `verify:sec01` is GREEN, `verify:tokens`/`verify:schema` remain deliberately failing stubs for Plans 02/03 to implement.
- `package.json`'s script surface is final for this phase — Plans 02 and 03 should not need to touch it, keeping their file sets disjoint for parallel execution.
- `astro.config.mjs`, `src/layouts/Base.astro`, and `src/pages/index.astro` are all files Plans 02/03 may still extend (Base.astro gets the `@theme`-dependent body classes styled by Plan 02's `global.css`; `content.config.ts` and `src/content/projects/` are Plan 03's scope). No blockers identified for either.

---
*Phase: 01-foundation-design-system*
*Completed: 2026-09-02*

## Self-Check: PASSED

All 11 created files confirmed present on disk. All 3 task commits (`309e813`, `b8fa2f7`, `441257d`) confirmed present in git history.
