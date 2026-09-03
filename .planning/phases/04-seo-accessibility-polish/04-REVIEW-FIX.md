---
phase: 04-seo-accessibility-polish
fixed_at: 2026-09-03T23:59:00Z
review_path: .planning/phases/04-seo-accessibility-polish/04-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-09-03T23:59:00Z
**Source review:** .planning/phases/04-seo-accessibility-polish/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (1 Critical, 3 Warning — `fix_scope: critical_warning`; the 4 Info findings were out of scope for this run and left untouched)
- Fixed: 4
- Skipped: 0

All fixes were applied in an isolated git worktree (`gsd-reviewfix/04-*` branch), committed one-per-finding, then fast-forwarded onto `master`. After all four fixes, `npm run verify` (the full build + all seven verify gates, including `verify:a11y`) was run end-to-end and passed clean: `A11Y SUMMARY routes=2 violations=0 incomplete_total=40 incomplete_resolved=40 contrast_checked=40 exit=0`, and every other gate (`sec01`, `tokens`, `shell`, `sections`, `schema`, `seo`) reported `violations=0`.

## Fixed Issues

### CR-01: `generate-og-image.mjs` contradicts its own "guaranteed fallback" claim and can hard-fail the production build

**Files modified:** `scripts/generate-og-image.mjs`
**Commit:** `69cacb8`
**Applied fix:** Added a `catch` block (the script previously had only `try { ... } finally { ... }`, no fallback path at all). On any Chromium/Playwright failure, it now logs the failure, falls back to copying the previously-committed `public/og-image.png` into `dist/og-image.png` if that file exists, and only calls `process.exit(1)` (via the existing `fail()` helper) when no committed fallback exists anywhere — making the header comment's "guaranteed fallback" claim actually true for subsequent builds, while still failing loudly on a genuinely unrecoverable first-run failure. Verified live during `npm run verify`: the happy path (Chromium available) still regenerates the image correctly (`OG-IMAGE SUMMARY outputs=public/og-image.png,dist/og-image.png dimensions=1200x630 bytes=111557`), and the code was read to confirm the fallback branch is reachable and correct; the failure branch itself was not exercised (Chromium was available in this environment), so the fallback path relies on code review + Tier 1/2 verification rather than an observed failure-path execution.

### WR-01: `index.astro` hardcodes the real production title, bypassing `site.ts` and the project's placeholder convention

**Files modified:** `src/data/site.ts`, `src/pages/index.astro`
**Commit:** `f86f0a4`
**Applied fix:** Added a `pageTitle` field to `site.ts` (`"PLACEHOLDER — título da aba/SEO a definir"`, following the same `PLACEHOLDER — … a definir` convention already used by `metaDescription` and other descriptive fields) and changed `index.astro`'s `<Base title="Portfólio Dev — Felipe Salles" ...>` to `<Base title={site.pageTitle} ...>`. The real name/persona literal no longer appears anywhere in `index.astro`; a future content swap now only requires editing `site.ts`.

### WR-02: `og-template` renders a different data field than the Hero it is supposed to mirror

**Files modified:** `src/pages/og-template/index.astro`
**Commit:** `9d21d94`
**Applied fix:** Changed the OG template's `<h1>{site.brand}</h1>` to `<h1>{site.heroHeading}</h1>`, matching the field the live Hero `<h1>` on `index.astro` actually renders. Restores the "OG image can never visually drift from the live Hero" guarantee `generate-og-image.mjs`'s own documentation claims, for the case where `brand` and `heroHeading` hold different real content later.

### WR-03: `verify-a11y.mjs`'s contrast check ignores the alpha channel of computed colors

**Files modified:** `scripts/verify-a11y.mjs`
**Commit:** `2a7b693`
**Applied fix:** `cssColorToHex()` now accepts an `bgHex` parameter and alpha-blends the parsed `r,g,b,a` components onto the sampled background pixel before hexifying, instead of discarding `a` and returning the raw unblended triplet. Added a small `hexToRgb()` helper to parse `bgHex` back into components for blending. Also reordered the call site: the background pixel is now sampled (via `locator.screenshot()` + `sharp`) *before* the foreground color is hexified, since blending now requires the background value — previously `fgHex` was computed before `bgHex` existed. Ran live via `npm run verify:a11y` as part of the full `npm run verify` chain: `A11Y SUMMARY routes=2 violations=0 incomplete_total=40 incomplete_resolved=40 contrast_checked=40 exit=0` — all 40 deferred color-contrast entries across both routes were measured and resolved with the corrected alpha-aware logic, with full coverage (no entries fell through unaccounted) and zero contrast violations found against the current (still-placeholder) content.

**Note for reviewer:** This fix changes a contrast-ratio *algorithm* (alpha compositing math), not just wiring/data-source correctness like WR-01/WR-02. `npm run verify:a11y` passing (0 violations, full 40/40 coverage) is strong evidence the change is not obviously broken and did not regress the gate, but the blend formula itself (`fg * alpha + bg * (1 - alpha)`, rounded per channel) has not been independently checked against a second reference implementation or a synthetic semi-transparent-color test case. Recommend a quick manual sanity check (e.g. temporarily apply a known `/50` opacity text class and confirm the reported ratio matches a manual calculation) before treating this as fully verified.

## Skipped Issues

None — all four in-scope findings were fixed.

---

_Fixed: 2026-09-03T23:59:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
