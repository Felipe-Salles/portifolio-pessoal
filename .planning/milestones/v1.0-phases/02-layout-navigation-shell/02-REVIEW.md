---
phase: 02-layout-navigation-shell
reviewed: 2026-09-02T23:30:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - scripts/verify-shell.mjs
  - src/components/Footer.astro
  - src/components/Nav.astro
  - src/layouts/Base.astro
  - src/pages/index.astro
  - src/styles/global.css
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-09-02T23:30:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the Phase 2 site-shell files (nav, footer, base layout, homepage scaffold, global CSS, and the `verify-shell.mjs` gate script) at standard depth, including a live `npm run build` + `npm run verify:shell` run to confirm claims against real `dist/` output rather than trusting comments. No security vulnerabilities, injection risks, or crash-level defects were found — the code is well-documented, the CSP/SEC-01 constraints are respected (no `set:html`, no icon fonts, no external origins), and the shell gate genuinely passes (`violations=0`) against the current build.

That said, four verifiable functional/robustness issues were found that should be fixed before this ships as final: a real horizontal-overflow bug in the footer's social link row on mobile viewports (confirmed via layout arithmetic against the actual `PLACEHOLDER` content and the `overflow-x: hidden` body rule), a modal-dialog accessibility gap (background landmarks aren't hidden from assistive tech while the mobile overlay is open), a static-build staleness bug in the footer's build-time-only copyright year, and an internal inconsistency in the gate script's own CSS-selector-matching robustness. Five additional lower-severity/code-quality items are listed as Info.

## Warnings

### WR-01: Footer social link row can overflow and be invisibly clipped on narrow mobile viewports

**File:** `src/components/Footer.astro:29-38`
**Issue:** The `data-footer-socials` container is `class="flex gap-6 ..."` with no `flex-wrap` utility, so its four `<a>` children lay out on a single, non-wrapping row. With the current `site.socials` content (four entries all labeled `"PLACEHOLDER"`, confirmed in the built `dist/index.html`), each label renders at 14px JetBrains Mono (`text-mono-label`) with `uppercase` + `0.05em` letter-spacing, i.e. roughly ~95-100px per label. Four labels + three `gap-6` (24px) gaps require ~470px of width — wider than the available content width on any phone-class viewport (e.g. a 375px-wide screen minus `px-margin-mobile` 20px×2 leaves ~335px). Because `global.css:174` sets `body { overflow-x: hidden }` globally, the overflowing portion of the row is not reachable by horizontal scroll — it is simply clipped from view while the underlying `<a>` elements remain present and keyboard-focusable. The practical result: on a real phone, 1-2 of the four footer links are invisible but still tabbable (a WCAG 2.4.7/2.4.3 "focus visible / logical order" mismatch — a sighted keyboard user can tab into a link they cannot see).
**Fix:** Add wrapping (and optionally tighten the gap on narrow screens) so the row degrades safely regardless of label length:
```astro
<div data-footer-socials class="flex flex-wrap gap-4 md:gap-6 font-mono-label text-mono-label uppercase text-on-surface-variant">
```
Verify at 320-375px width once real (shorter) labels land in `src/data/site.ts` — but the fix should not depend on labels staying short.

### WR-02: Footer copyright year is computed only at build time — will go stale in production with no rebuild trigger

**File:** `src/components/Footer.astro:27`
**Issue:** `© {new Date().getFullYear()} {site.brand} — todos os direitos reservados` runs `Date()` during `astro build` (this is `output: "static"`, per `astro.config.mjs`), not in the visitor's browser. The rendered year is therefore frozen into the static HTML at whatever moment the site was last built/deployed. There is no `vercel.json` cron, GitHub Actions scheduled workflow, or ISR/ on-demand revalidation configured anywhere in the repo (checked: no `vercel.json`, no `.github/workflows/`) that would trigger a rebuild at the start of each year. Left as-is, the footer will silently show, e.g., "© 2026" throughout 2027 and beyond until the next unrelated deploy.
**Fix:** Either (a) schedule an annual rebuild (Vercel Cron Job hitting a deploy hook, or a scheduled GitHub Action) so the static output stays current, or (b) explicitly accept and document this as a known limitation for v1. Silently relying on `new Date()` in build-time-only code without either safeguard is a latent bug, not a working feature.

### WR-03: Mobile nav overlay doesn't hide background landmarks from assistive tech while open

**File:** `src/components/Nav.astro:156-177`
**Issue:** `setOpen()` implements a keyboard **Tab-key** focus trap (correctly cycling between the toggle button and the overlay's links) but does not apply `aria-hidden="true"` / `inert` to the rest of the page (`<main>`, `<footer>`, and the desktop nav content hidden via `hidden md:flex`/`hidden md:block`) while `data-menu-open="true"`. A sighted mouse/touch user is fully blocked by the overlay's `fixed inset-0` full-viewport coverage, but a screen-reader user in browse/virtual-cursor mode (not just linear Tab navigation — e.g. VoiceOver rotor, NVDA browse mode, swipe navigation on mobile) can still navigate into `<main>`/`<footer>` content that is visually hidden behind the modal, which is exactly the scenario `role="dialog"` + `aria-modal="true"` is meant to prevent. `aria-modal="true"` is a hint to AT, not a hard guarantee across all screen readers/browsers — the WAI-ARIA Authoring Practices pattern for a true modal recommends inerting/hiding siblings explicitly.
**Fix:** In `setOpen()`, toggle `inert` (or `aria-hidden="true"`) on the `<main>` and `<footer>` elements (leave `<nav>` alone since it hosts the close/toggle control):
```ts
const mainEl = document.getElementById("main-content");
const footerEl = document.querySelector("footer");
// inside setOpen(open, ...):
mainEl?.toggleAttribute("inert", open);
footerEl?.toggleAttribute("inert", open);
```

### WR-04: `verify-shell.mjs` CSS-selector matching is inconsistent — two check groups aren't tolerant of minifier selector-merging the way the rest of the script is

**File:** `scripts/verify-shell.mjs:316-317, 346-347` (contrast with `findCssBlock`, lines 91-106, used by the `overlay` check group at lines 533+)
**Issue:** The script's own header comment (lines 91-96) and inline comments elsewhere explicitly document that Lightning CSS "groups multiple identical-declaration selectors into a comma-separated selector list," and `findCssBlock()` was written specifically to tolerate a selector being followed by `,` as well as `{`. However, the `focuscss` check (`focusVisibleBlockRegex = /:focus-visible\{([^}]*)\}/`, line 316) and the `skiplink` CSS check (`skipLinkCssBlockRegex = /\.skip-link:not\(:focus\)\{([^}]*)\}/`, line 346) both require the selector to be *immediately* followed by `{`, with no comma-list tolerance. If Lightning CSS ever merges either of these selectors into a shared block with another rule that has byte-identical declarations (as the script's own comments acknowledge it does for other rules in this codebase), these two checks will silently false-fail the gate even though the CSS is correct — undermining trust in a gate that is otherwise built specifically to avoid that class of false positive.
**Fix:** Route both regexes through `findCssBlock()` for consistency with the rest of the script:
```js
const focusVisibleBlock = findCssBlock(cssStripped, ":focus-visible");
// ...
const skipLinkCssBlock = findCssBlock(cssStripped, "\\.skip-link:not\\(:focus\\)");
```

## Info

### IN-01: `.btn-primary` / `.btn-primary:hover` CSS is unused across all Phase 2 files

**File:** `src/styles/global.css:242-245`
**Issue:** `.btn-primary:hover` is defined but grep across `src/` (all `.astro` files) finds zero usages of `btn-primary` outside this declaration. It's likely intended for a future phase's CTA button, but as of this review it's dead CSS shipping in the bundle.
**Fix:** If this is intentionally staged for Phase 3, a short comment noting "consumed by Phase 3's Hero CTA" would prevent a future reviewer from re-flagging it as dead code; otherwise remove until used.

### IN-02: Nav link list is duplicated verbatim between the desktop bar and the mobile overlay

**File:** `src/components/Nav.astro:42-57` and `103-118`
**Issue:** The four section anchors (`Dossier`/`Stack`/`Projects`/`Contact`) plus the `Connect` anchor are hand-duplicated between the desktop `<div class="hidden md:flex ...">` block and the mobile overlay `<div id="nav-overlay">` block — ten near-identical `<a>` tags total. `verify-shell.mjs`'s `nav`/`overlay` check groups do catch drift between the two lists, but the duplication itself is a maintainability smell: any future copy change (e.g. renaming a section) has to be made twice by hand.
**Fix:** Consider a small local array (`const navLinks = [{href, label}, ...]`) mapped twice in the template, which would make the two lists structurally impossible to diverge rather than just gate-checked for divergence.

### IN-03: Decorative menu/close SVG icons inside the toggle button aren't marked `aria-hidden`

**File:** `src/components/Nav.astro:83-84`
**Issue:** `<Icon name="material-symbols:menu" ... />` / `<Icon name="material-symbols:close" ... />` render as inline `<svg>` with no `aria-hidden="true"` (confirmed in `dist/index.html` — the built `<svg>` carries only `width`, `height`, `viewBox`, `data-nav-icon`, `data-icon`). The enclosing `<button>` already carries an explicit `aria-label`, which takes precedence in accessible-name computation, so this is not a functional bug today — but it's a standard best practice for decorative icons inside a labelled control, and `astro-icon` does not add `aria-hidden` by default.
**Fix:** `<Icon name="material-symbols:menu" data-nav-icon="menu" aria-hidden="true" />` (and the same for the close icon).

### IN-04: Nav/overlay section anchors (`#dossier`, `#stack`, `#projects`, `#contact`) currently resolve to nothing on the page

**File:** `src/components/Nav.astro:44,48,52,56,60,105,109,113,117,120` / `src/pages/index.astro`
**Issue:** `index.astro` still renders only the Phase 1 pipeline-proof scaffold (`<h1>PIPELINE OK</h1>` + token gallery) — no element on the page currently has `id="dossier"`, `id="stack"`, `id="projects"`, or `id="contact"`. Every nav/overlay link is therefore a dead in-page anchor in the current build. This is consistent with the documented Phase 3 scope split (content sections land in Phase 3) and `verify-shell.mjs` doesn't assert section-id presence, so it isn't a phase-2 gate regression — flagging only so it's tracked and not mistaken for "working navigation" if this build is previewed/demoed before Phase 3 lands.
**Fix:** No action needed for Phase 2 sign-off; confirm Phase 3 adds matching `id`s for all four anchors before this ships to production.

### IN-05: `rel="noopener noreferrer"` on footer social anchors has no effect without `target="_blank"`

**File:** `src/components/Footer.astro:31-37`
**Issue:** Every footer social `<a>` carries `rel="noopener noreferrer"`, but none carries `target="_blank"` (nor does `site.ts` define a `target` field). `rel="noopener noreferrer"` only has a security/privacy effect on links that open a new browsing context; on a same-tab link it's inert. The Phase 2 summary documents this as intentional forward-proofing ahead of REAL-03's real external URLs, which is a reasonable call — flagging only so `target="_blank"` isn't forgotten when real `href`s land, since `rel` alone gives a false sense that tab-nabbing protection is already active.
**Fix:** Add `target="_blank"` alongside the existing `rel` once `site.socials[].href` points to real external profiles (or add both together in the same future change, to avoid `rel`-without-`target` shipping as a permanent no-op).

---

_Reviewed: 2026-09-02T23:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
