---
phase: 04-seo-accessibility-polish
plan: 01
subsystem: seo
tags: [astro, sitemap, robots-txt, favicon, open-graph, twitter-card, aria-hidden, sharp, png-to-ico, playwright, axe-core]

# Dependency graph
requires:
  - phase: 03-content-sections
    provides: Base.astro layout, index.astro Hero/Dossier/Stack/Projects/Contact sections, site.ts placeholder singleton
provides:
  - astro.config.mjs site URL + @astrojs/sitemap integration (og-template excluded)
  - public/robots.txt permitting full indexing, pointing at sitemap-index.xml
  - Scripted >_ favicon set (favicon.svg/.ico, apple-touch-icon.png) via scripts/generate-favicons.mjs
  - Base.astro Props extended with description/ogImage/ogType, full meta/OG/Twitter head contract, favicon links
  - aria-hidden pass on the 4 decorative elements (2 glow-cloud divs, 2 decorative icons)
  - SEC-01 gate narrowed to allow rel="canonical" absolute hrefs only
  - playwright + chromium binary + @axe-core/playwright + wcag-contrast installed (toolchain for plans 04-02..04-05)
affects: [04-02-og-image-404-page, 04-03-a11y-gate, 04-04, 04-05, phase-05-deploy]

# Tech tracking
tech-stack:
  added: ["@astrojs/sitemap@^3.7.4", "playwright@^1.62.1", "@axe-core/playwright@^4.13.0", "png-to-ico@^3.0.2", "wcag-contrast@^3.0.0", "sharp@^0.35.4 (promoted to explicit devDependency)"]
  patterns:
    - "Base.astro Props contract: title/description required, ogImage/ogType optional with defaults, all absolute URLs built via new URL(path, Astro.site)"
    - "One-time generator scripts (scripts/generate-*.mjs) vs. build-chained scripts, following the same shebang + contract-header convention as verify-*.mjs"
    - "SEC-01 <link> allowlist keyed on strict rel equality, never substring/regex"

key-files:
  created:
    - public/robots.txt
    - public/favicon.svg
    - public/favicon.ico
    - public/apple-touch-icon.png
    - scripts/generate-favicons.mjs
  modified:
    - astro.config.mjs
    - package.json
    - package-lock.json
    - src/data/site.ts
    - src/layouts/Base.astro
    - src/pages/index.astro
    - scripts/verify-no-external-origins.mjs

key-decisions:
  - "Placeholder site URL set to the RFC 2606-reserved https://portfolio-felipe-salles.example (per RESEARCH.md Assumption A2), with a TODO(Phase 5) comment marking the one-line swap DEPLOY-01 must perform"
  - "generate:favicons kept as a manually-invoked script, not chained into build/verify (RESEARCH.md Assumption A4) — the >_ glyph is stable, re-running per build is unnecessary"
  - "SEC-01 <link> allowlist narrowed to rel === \"canonical\" only (strict equality), proven by a negative preload probe rather than assumed safe"

patterns-established:
  - "Pattern: Base.astro head metadata contract (description required, ogImage/ogType optional defaults, absolute canonical/OG/Twitter URLs via new URL(path, Astro.site)) — reused by every future page (404.astro in plan 04-02)"
  - "Pattern: aria-hidden=\"true\" applied directly via astro-icon's verified prop passthrough for purely decorative <Icon> instances, never a wrapper span or display:none"

requirements-completed: [SEO-01, SEO-03, SEO-04, SEO-05, A11Y-03]

# Metrics
duration: 25min
completed: 2026-09-03
---

# Phase 4 Plan 1: SEO Toolchain, Site Identity & Decorative Aria-Hidden Pass Summary

**Astro site now crawlable and share-ready: @astrojs/sitemap + robots.txt, a scripted `>_` cyan favicon set (SVG/ICO/apple-touch-icon), Base.astro's full meta description/canonical/Open Graph/Twitter Card contract with absolute URLs, and the D-11/D-12 aria-hidden pass on all 4 decorative elements.**

## Performance

- **Duration:** ~25 min (including ~6 min for `npx playwright install chromium`'s 300MB download)
- **Tasks:** 3/3 completed
- **Files modified/created:** 12

## Accomplishments
- `astro.config.mjs` now has `site` set (RFC 2606 `.example` placeholder, `TODO(Phase 5)` swap note) and `@astrojs/sitemap` wired with a filter excluding `/og-template/`; `dist/sitemap-index.xml` + `dist/sitemap-0.xml` emit with exactly one `<loc>`
- `public/robots.txt` permits full indexing and points at the sitemap index, host matching `astro.config.mjs`'s `site` value exactly
- A single scripted source (`scripts/generate-favicons.mjs`) owns the `>_` glyph (genuine vector chevron+underscore, `#00f0ff`, no text element) and emits `favicon.svg`, a 3-size `favicon.ico`, and a 180×180 `apple-touch-icon.png` on a solid `#0c0e12` field
- `Base.astro`'s `Props` widened to `title`/`description`/`ogImage`/`ogType`; every page now carries a unique description, absolute canonical URL, full Open Graph + Twitter Card set, and three favicon `<link>` tags
- The 4 decorative elements named by D-11/D-12 (2 glow-cloud divs, Hero CTA arrow icon, project cover fallback icon) are `aria-hidden="true"`; Live/Repo link icons and tech/tag `<span>` text remain untouched (D-13)
- `scripts/verify-no-external-origins.mjs`'s SEC-01 gate narrowed to allow `rel="canonical"` absolute hrefs only (strict equality) — proven safe with a negative `rel="preload"` probe that correctly fails the gate
- `playwright`, `@axe-core/playwright`, `png-to-ico`, `wcag-contrast`, `sharp` installed as devDependencies and Chromium downloaded — toolchain ready for plans 04-02 (OG image + 404) and 04-03 (a11y gate)

## Task Commits

Each task was committed atomically:

1. **Task 1: Provision the phase toolchain, set the site URL, and publish robots.txt** - `2118b4a` (feat)
2. **Task 2: Generate the >_ favicon set from a single scripted source of truth** - `4a36649` (feat)
3. **Task 3: Ship the Base.astro head metadata contract and the decorative aria-hidden pass** - `4e7eddd` (feat)

_Plan metadata commit (SUMMARY.md) is created separately, per worktree-mode convention — orchestrator handles STATE.md/ROADMAP.md updates after merge._

## Files Created/Modified
- `astro.config.mjs` - Added placeholder `site` URL (TODO(Phase 5) swap note) + `@astrojs/sitemap` integration filtering `/og-template/`
- `public/robots.txt` - New: `User-agent: *` / `Allow: /` / `Sitemap:` pointing at the sitemap index
- `scripts/generate-favicons.mjs` - New: one-time generator producing the `>_` glyph SVG source and rasterizing it via `sharp`/`png-to-ico` into all three favicon files
- `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png` - New: generated favicon assets
- `src/data/site.ts` - Added `metaDescription` placeholder field (SEO-01 default for `/`)
- `src/layouts/Base.astro` - Widened `Props`, added full head metadata block + favicon `<link>` tags, `aria-hidden` on both glow-cloud divs
- `src/pages/index.astro` - Passes `description={site.metaDescription}` to `<Base>`, `aria-hidden` on the Hero CTA arrow and project cover fallback icons
- `scripts/verify-no-external-origins.mjs` - Narrowed the `<link>` external-origin check to allow `rel="canonical"` only
- `package.json` / `package-lock.json` - Added `@astrojs/sitemap` (dependency); `playwright`, `@axe-core/playwright`, `png-to-ico`, `wcag-contrast`, `sharp` (devDependencies); `generate:favicons` script

## Decisions Made
- Placeholder `site` domain: `https://portfolio-felipe-salles.example` (RFC 2606-reserved, matches RESEARCH.md's recommendation) — every canonical/OG/sitemap/robots.txt absolute URL derives from this single value, so Phase 5's DEPLOY-01 swap touches exactly `astro.config.mjs` + `public/robots.txt`.
- `generate:favicons` stays a manually-invoked script (RESEARCH.md Assumption A4) — the glyph is stable, and re-running on every build would be unnecessary overhead with no correctness benefit.
- SEC-01's `<link>` allowlist keys on strict `rel === "canonical"` equality (never a substring/regex match) so every other `rel` value (`preload`, `stylesheet`, `icon`, `preconnect`, `dns-prefetch`) still fails exactly as before — verified with a negative probe, not just asserted.

## Deviations from Plan

None — plan executed exactly as written. All package installs matched the plan's exact 6-package Package Legitimacy Audit list (`@astrojs/sitemap`, `playwright`, `@axe-core/playwright`, `png-to-ico`, `wcag-contrast`, `sharp`); no legitimacy checkpoint was required per RESEARCH.md's pre-cleared audit.

## Issues Encountered

`npm install` and `npx playwright install chromium` ran as long-lived background processes (several minutes each, including a ~300MB Chromium download) — handled by polling `package.json`/output files until each completed rather than blocking synchronously. No functional issues.

## User Setup Required

None - no external service configuration required. `npx playwright install chromium` downloaded a browser binary into the local OS Playwright cache (`~/AppData/Local/ms-playwright`) automatically; no manual step needed.

## Next Phase Readiness

- `Base.astro`'s Props contract (`description` required, `ogImage`/`ogType` optional) is ready for plan 04-02's `404.astro` to consume directly.
- `astro.config.mjs`'s sitemap `filter` already excludes `/og-template/` — plan 04-02's OG-template page will not need any additional sitemap wiring.
- Playwright + Chromium + `@axe-core/playwright` + `wcag-contrast` are installed and Chromium-launch-verified — plan 04-03's `verify-a11y.mjs` gate can be written directly against this toolchain with no further installation step.
- All 5 pre-existing `verify:*` gates (`sec01`, `tokens`, `shell`, `sections`, `schema`) plus `npm run check` pass with zero violations — no Phase 1-3 regression.
- No blockers for 04-02/04-03/04-04/04-05.

---
*Phase: 04-seo-accessibility-polish*
*Completed: 2026-09-03*
