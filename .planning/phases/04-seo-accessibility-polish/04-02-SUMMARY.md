---
phase: 04-seo-accessibility-polish
plan: 02
subsystem: seo-a11y
tags: [astro, playwright, og-image, 404-page, share-preview]

# Dependency graph
requires:
  - phase: 04-seo-accessibility-polish
    plan: 01
    provides: Base.astro description/ogImage/ogType Props contract, astro.config.mjs site URL + sitemap filter excluding /og-template/, playwright + chromium + sharp toolchain installed
provides:
  - src/pages/404.astro — branded 404 reusing Base's Nav/Footer/skip-link (A11Y-02)
  - src/pages/og-template/index.astro — internal noindex 1200x630 screenshot target reading live site.ts content (SEO-02, D-01–D-04)
  - scripts/generate-og-image.mjs — build-chained Playwright screenshot generator, deterministic output
  - public/og-image.png — committed 1200x630 share preview asset
affects: [04-03-a11y-gate, 04-04, 04-05, phase-05-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standalone (non-Base) Astro page for internal/screenshot-only routes: hand-written html/head/body shell mirroring Base.astro's structure, own noindex meta tag, no Nav/Footer/skip-link"
    - "Build-chained generator script using astro's programmatic preview() + Playwright, server/browser always torn down in try/finally, never spawn() a child process on Windows"
    - "Deterministic screenshot capture: page.evaluate(() => document.fonts.ready) + screenshot({ animations: 'disabled' }) to eliminate FOUC and animate-pulse frame nondeterminism"

key-files:
  created:
    - src/pages/404.astro
    - src/pages/og-template/index.astro
    - scripts/generate-og-image.mjs
    - public/og-image.png
  modified:
    - package.json

key-decisions:
  - "og-image.png generation chained into the build script itself (astro build && node scripts/generate-og-image.mjs) rather than a separate verify-only step, per RESEARCH.md's build-step sequencing — every build regenerates a fresh, verified-deterministic image"
  - "public/og-image.png committed to git (not just dist/) so a build environment without a working Chromium (a real Vercel-build concern flagged for Phase 5/DEPLOY-01) still ships a valid share preview"
  - "og-template page hand-writes its own html/head/body shell instead of importing Base — avoids pulling in Nav/Footer/skip-link markup that would never render at the fixed 1200x630 screenshot viewport and would trip the landmark-uniqueness assumptions elsewhere"

patterns-established:
  - "Programmatic astro preview() + Playwright screenshot pipeline for any future build-time visual-artifact generation (favicons already used sharp directly; this is the first screenshot-based generator)"

requirements-completed: [SEO-02, A11Y-02]

# Metrics
duration: 55min
completed: 2026-09-03
---

# Phase 4 Plan 2: Custom 404 Page and OG Share-Image Pipeline Summary

**Branded 404 page reusing the full Base layout (nav/footer/skip-link intact) plus a build-time Playwright screenshot pipeline that renders the real Hero treatment at a fixed 1200x630 canvas into a deterministic, committed `og-image.png`.**

## Performance

- **Duration:** ~55 min (including recovery from a Windows npm optional-dependency install race — see Issues Encountered)
- **Tasks:** 3/3 completed
- **Files modified/created:** 5

## Accomplishments

- `src/pages/404.astro` reuses `Base` verbatim (Nav/Footer/skip-link, no duplicated landmarks) with a cyan-bordered glass panel: terminal-tone `ERRO 404 — ROTA NÃO ENCONTRADA` label, `O sistema não localizou este caminho.` heading, and a single typography-only `btn-primary` CTA (`VOLTAR AO INÍCIO`) back to `/` — unique title/description per SEO-01
- `src/pages/og-template/index.astro` is a standalone (non-Base) internal route: hand-written `html`/`head`/`body` shell with `noindex`, reusing the Hero's real badge/wordmark/tagline classes verbatim inside a fixed `w-[1200px] h-[630px]` canvas, reading `site.brand`/`site.title`/`site.availabilityStatus` live — stays excluded from the sitemap via plan 04-01's filter
- `scripts/generate-og-image.mjs` starts Astro's preview server programmatically (`import { preview } from "astro"`, port 4325), drives headless Chromium via Playwright, waits for `document.fonts.ready`, captures with `animations: "disabled"` for determinism, and writes the PNG to both `public/og-image.png` (committed) and `dist/og-image.png` — server and browser are always torn down in a `finally` block
- `package.json`'s `build` script now chains `astro build && node scripts/generate-og-image.mjs`; added standalone `generate:og` script
- Verified byte-identical `public/og-image.png` across two consecutive `npm run build` runs (sha256 match), confirmed exact 1200x630 PNG dimensions via `sharp`, and confirmed port 4325 is released after the script exits

## Task Commits

Each task was committed atomically:

1. **Task 1: Ship the custom 404 page** - `e7ee1ea` (feat)
2. **Task 2: Build the internal 1200x630 OG template route** - `905d693` (feat)
3. **Task 3: Generate og-image.png at build time via Playwright and chain it into the build** - `93e9cdd` (feat)

_Plan metadata commit (SUMMARY.md) is created separately, per worktree-mode convention — orchestrator handles STATE.md/ROADMAP.md updates after merge._

## Files Created/Modified

- `src/pages/404.astro` - New: branded 404 page, imports only `Base`, no `Icon`/`site`/`getCollection`
- `src/pages/og-template/index.astro` - New: internal noindex screenshot target, standalone html/head/body shell, Hero markup reuse
- `scripts/generate-og-image.mjs` - New: programmatic `astro preview()` + Playwright screenshot generator, contract-header comment, try/finally cleanup
- `public/og-image.png` - New: committed 1200x630 deterministic share preview
- `package.json` - `build` script chained with the OG generator; new `generate:og` standalone script

## Decisions Made

- OG image generation is chained directly into `build` (not a separate opt-in step) so every build always ships a fresh, verified image — matches RESEARCH.md's documented build-step sequencing.
- `public/og-image.png` is committed to git specifically because a Vercel build environment might lack a working Chromium at some point — this guarantees `astro build`'s copy of `public/` always contains a valid asset even if the Playwright screenshot step were to fail in a future environment. Flagged again here for Phase 5/DEPLOY-01 awareness (T-04-02-04 in the plan's threat register).
- The OG template route hand-writes its own `<html>/<head>/<body>` shell rather than extending `Base`, since it needs zero navigational chrome and Base's Nav/Footer/skip-link would only add irrelevant markup to a screenshot-only page.

## Deviations from Plan

None — plan executed exactly as written. All three tasks match their `<action>` specs and every listed acceptance criterion passed.

## Issues Encountered

This worktree's `node_modules` did not yet have plan 04-01's added packages (`playwright`, `@axe-core/playwright`, `sharp`, `@astrojs/sitemap`, etc.) despite `package.json`/`package-lock.json` already containing them post-merge. Running `npm install` while the coordinator's instructions were still in flight resulted in two overlapping `npm install` invocations executing concurrently against the same `node_modules` directory (a Windows-specific race — concurrent `rmdir`/file operations under `node_modules` produced `ENOTEMPTY`/`TAR_ENTRY_ERROR` corruption, and `astro`'s `dist/` and `node_modules/.bin/astro` symlink ended up missing, breaking `astro build` with a misleading `Cannot find native binding` / rolldown WASM-fallback error). Recovered by killing/waiting out the stray processes, deleting the corrupted `node_modules` (safe — gitignored, no tracked files affected), and running a single clean `npm install` to completion, verified via `node node_modules/astro/bin/astro.mjs --version`. No source files were affected by the corruption; only the local dependency cache. The Playwright Chromium binary was already cached from plan 04-01's install (`ms-playwright` OS cache), so `npx playwright install chromium` was correctly skipped per the plan's instruction, avoiding a redundant ~300MB download.

## User Setup Required

None — no external service configuration required. Chromium was already present in the local Playwright OS cache from plan 04-01.

## Next Phase Readiness

- `/404` and `/og-template/` both build cleanly and pass all five pre-existing `verify:*` gates plus the plan's own acceptance-criteria scripts.
- `public/og-image.png` and `dist/og-image.png` exist, measure exactly 1200x630, and are byte-identical across builds — ready for plan 04-03's a11y gate (which will scan `/` and `/404.html`) and any later Open Graph unfurl testing.
- `scripts/generate-og-image.mjs` is chained into `build`, so no manual step is needed going forward — every future `npm run build` (including Phase 5's Vercel build) regenerates the image automatically, with the committed `public/og-image.png` as a fallback if Chromium is unavailable in that environment.
- No blockers for 04-03/04-04/04-05.

---
*Phase: 04-seo-accessibility-polish*
*Completed: 2026-09-03*

## Self-Check: PASSED

All 4 created files (`src/pages/404.astro`, `src/pages/og-template/index.astro`, `scripts/generate-og-image.mjs`, `public/og-image.png`) verified present on disk. All 3 task commit hashes (`e7ee1ea`, `905d693`, `93e9cdd`) verified present in `git log`.
