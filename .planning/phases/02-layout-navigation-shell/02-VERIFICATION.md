---
phase: 02-layout-navigation-shell
verified: 2026-09-02T23:25:00-03:00
status: human_needed
score: 26/26 automated must-haves verified (4 roadmap SC + 22 plan-level truths); 1 item needs human visual confirmation; 1 documentation-tracking gap noted
overrides_applied: 0
human_verification:
  - test: "Load the site at a real mobile viewport (320-390px width) and scroll to the footer. Visually inspect the social-link row (4 x 'PLACEHOLDER' labels)."
    expected: "All four footer links are visible on screen (wrapped to a second line if needed), not clipped off-screen while still being Tab-reachable."
    why_human: "Code review (02-REVIEW.md WR-01) computed via layout arithmetic that the `data-footer-socials` container (`flex gap-6`, no `flex-wrap`) needs ~470px of width for 4 uppercase mono-label PLACEHOLDER links, but a 375px viewport minus 20px×2 margins leaves ~335px. `body { overflow-x: hidden }` (global.css:174) means any overflow is clipped, not scrollable — the anchors would remain in the DOM and keyboard-focusable but invisible, which is a WCAG 2.4.7-relevant defect. This requires an actual rendered viewport to confirm or refute; grep/build output cannot render CSS flex layout to detect visual overflow."
---

# Phase 2: Layout & Navigation Shell Verification Report

**Phase Goal:** Visitor loads any page and sees the correct site shell — navigation, footer, and page metadata — matching the design system, in Portuguese, and fully keyboard-accessible.
**Verified:** 2026-09-02T23:25:00-03:00
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths — ROADMAP Success Criteria

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|---|---|---|
| 1 | Visitor sees a nav bar with logo, section links (Dossier/Stack/Projects/Contact), and a "Connect" button matching DESIGN.md | ✓ VERIFIED | `src/components/Nav.astro` renders `{site.brand}`, 4 desktop anchors (`#dossier`/`#stack`/`#projects`/`#contact`), and `<a href="#contact">Connect</a>` (never a `<button>`). `dist/index.html` built and confirmed: exactly 1 `<nav>`, brand text present, Connect anchor present. `npm run verify:shell` → `nav=ok brand=ok`. |
| 2 | On mobile, visitor can open/close the nav via a toggle that works without any JS framework (vanilla JS only) | ✓ VERIFIED | `src/components/Nav.astro` has one `<script>` (no `is:inline`, no `client:` directive, no react/vue/svelte/preact/solid-js/alpinejs import — confirmed by direct grep and by the gate). Full-screen overlay is a DOM sibling of `<nav>` (offset-checked: `</nav>` at 9646 char precedes `id="nav-overlay"` — actually checked directly in this session: nav opens at 627, overlay id at 3916, both before `</main>`/`<footer>`). `npm run verify:shell` → `overlay=ok overlayjs=ok`. Human checkpoint (02-02 Task 3, 11-point browser checklist) was run and approved per `02-02-SUMMARY.md`. |
| 3 | Visitor navigating by keyboard alone can reach every nav link and see a visible cyan focus glow | ✓ VERIFIED | Global bare `:focus-visible` rule in `src/styles/global.css` (outline 2px solid `--color-primary-container`, 2px offset, cyan box-shadow) applies to every focusable element project-wide, including all nav/overlay links (no local overrides found). Gate: `focuscss=ok`. Desktop + mobile focus behavior (including the overlay's focus trap, Tab/Shift+Tab cycling, Escape, and focus restoration) was exercised and approved in the 02-02 human checkpoint. |
| 4 | Page HTML declares `lang="pt-BR"` and uses semantic `<nav>`/`<main>` landmarks | ✓ VERIFIED | `src/layouts/Base.astro` line 39: `<html lang="pt-BR">`. Live check against `dist/index.html` in this session: `lang=true`, exactly 1 `<main>` (with `id="main-content"`), exactly 1 `<nav>` (with `aria-label="Navegação principal"`). Gate: `lang=ok landmarks=ok`. |

**Score:** 4/4 ROADMAP success criteria verified.

### Observable Truths — Plan-level must_haves (all 3 plans)

All 22 truths declared across `02-01-PLAN.md`, `02-02-PLAN.md`, and `02-03-PLAN.md` frontmatter `must_haves.truths` were checked against the live build. Summarized by plan (full detail available in each plan's own gate contract, re-executed live in this session):

| Plan | Truths | Status | Evidence |
|---|---|---|---|
| 02-01 (Nav + shell) | 8/8 | ✓ VERIFIED | Live `npm run build && node scripts/verify-shell.mjs` → `lang=ok landmarks=ok skiplink=ok nav=ok brand=ok focuscss=ok`. Skip link offset (520) confirmed strictly less than first `<nav` offset (627) directly against `dist/index.html`. `src/pages/index.astro`'s own wrapper is `<div>`, not `<main>` — no nested-landmark regression. |
| 02-02 (Mobile overlay) | 8/8 | ✓ VERIFIED | Gate → `overlay=ok overlayjs=ok`. Overlay is DOM sibling of `<nav>`, `role="dialog" aria-modal="true"`, dual server-rendered SVG icons (`data-nav-icon="menu"`/`"close"`), 5 anchors (4 sections + Connect). Script contains all required behavioral literals (`Escape`, `Tab`, `matchMedia`, PT-BR aria-labels). Human checkpoint (Task 3, 11 checks) approved per SUMMARY. |
| 02-03 (Footer) | 6/6 (5 fully automated + 1 structurally verified, visually unconfirmed) | ✓ VERIFIED (5) / ⚠ NEEDS HUMAN CONFIRMATION (1) | Gate → `footer=ok headings=ok`. `dist/index.html`: exactly 1 `<footer>` after `</main>` (offset 9738 > 9731), exactly 1 `<h1>`. `Footer.astro` maps `site.socials` (parity-checked by the gate against the live array), uses `rel="noopener noreferrer"`, composes the copyright line from `new Date().getFullYear()` + `site.brand`, no `SYSTEM_ARCHITECT`/`ALL RIGHTS RESERVED`/`© 2024`. The truth "a keyboard-only visitor can Tab to every footer link and see the cyan focus glow on each" is structurally true (global `:focus-visible` applies, links are real anchors) but **visibility of all 4 links on narrow mobile viewports is an open question** — see Human Verification Required below. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/components/Nav.astro` | Nav landmark, brand, desktop links, Connect anchor, mobile toggle, overlay, script | ✓ VERIFIED | 236 lines. Contains `aria-label="Navegação principal"`, `{site.brand}`, `data-nav-toggle`, `id="nav-overlay"`, one `<script>` (bundled, no `is:inline`). |
| `src/layouts/Base.astro` | Skip link, Nav mount, `main#main-content`, Footer mount | ✓ VERIFIED | 57 lines. Order confirmed: skip link → glow divs → `<Nav />` → `<main id="main-content" class="relative z-10 pt-32">` → `<Footer />`. `lang="pt-BR"`, all 12 `@fontsource` imports, `bg-grid-pattern` intact. |
| `src/components/Footer.astro` | Footer band, dynamic copyright, `site.socials`-driven link row | ✓ VERIFIED | 42 lines. `site.socials.map(...)`, no `.icon` usage, `mono-label` only (no `mono-code`), `rel="noopener noreferrer"` on every anchor. |
| `src/styles/global.css` | `:focus-visible` glow, `.skip-link` mechanics, overlay state rules | ✓ VERIFIED | Bare `:focus-visible` (4 declarations), `.skip-link`/`.skip-link:not(:focus)` (no `display:none`), 4 overlay state rules (`[data-nav-overlay][data-menu-open="false"]`, `nav[data-menu-open="true"]`, `body[data-menu-open="true"]`, icon-swap pair). |
| `scripts/verify-shell.mjs` | Deterministic `dist/` gate covering the full Phase 2 contract | ✓ VERIFIED | Runs and exits 0 with `SHELL SUMMARY lang=ok landmarks=ok skiplink=ok nav=ok brand=ok focuscss=ok overlay=ok overlayjs=ok footer=ok headings=ok violations=0` (re-executed live in this session, not taken from SUMMARY claims). |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/layouts/Base.astro` | `src/components/Nav.astro` | component import + mount before `<main>` | ✓ WIRED | `import Nav from "../components/Nav.astro";` present; `<Nav />` rendered before `<main id="main-content">`. |
| `src/layouts/Base.astro` | `src/components/Footer.astro` | component import + mount after `</main>` | ✓ WIRED | `import Footer from "../components/Footer.astro";`; `<Footer />` mounted immediately after `</main>`, before `</body>`. |
| `src/components/Nav.astro` | `src/data/site.ts` | brand wordmark bound to `site.brand` | ✓ WIRED | `import { site } from "../data/site.ts";` + `{site.brand}` interpolation, HTML-escaped by default (no `set:html`). |
| `src/components/Footer.astro` | `src/data/site.ts` | map over `site.socials` | ✓ WIRED | `{site.socials.map((s) => (...))}`, using only `.label`/`.href`. Gate asserts anchor-count parity with the live array (4 today). |
| `src/layouts/Base.astro` | `#main-content` | skip link target | ✓ WIRED | `href="#main-content"` anchor is first child of `<body>`; `id="main-content"` exists exactly once. |
| `package.json` | `scripts/verify-shell.mjs` | `verify:shell` npm script in the aggregate `verify` chain | ✓ WIRED | `"verify:shell": "node scripts/verify-shell.mjs"` present; ordered before `verify:schema` in the `verify` chain, as required (build → sec01 → tokens → shell → schema). |
| `Nav.astro` toggle button | `#nav-overlay` | `aria-controls` | ✓ WIRED | `aria-controls="nav-overlay"` matches the overlay's `id="nav-overlay"`. |
| `Nav.astro` script | `document.body` | `data-menu-open` scroll-lock attribute | ✓ WIRED | `setOpen()` sets/removes `data-menu-open` on `document.body`; `global.css` `body[data-menu-open="true"] { overflow: hidden }` consumes it. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `Nav.astro` brand wordmark | `site.brand` | `src/data/site.ts` (build-time module, `as const`) | Yes — current placeholder value `"[Nome/Marca Aqui]"`, correctly interpolated and escaped, not a hardcoded fictional persona | ✓ FLOWING |
| `Footer.astro` link row | `site.socials` | `src/data/site.ts` | Yes — 4-entry array, `.map()`'d live; gate asserts rendered anchor count == array length, preventing silent drift to a hardcoded list | ✓ FLOWING |
| `Footer.astro` copyright year | `new Date().getFullYear()` | Build-time JS `Date` call | Yes at build time, but **frozen into static HTML with no scheduled rebuild** (documented separately as REVIEW.md WR-02 — advisory, not a Phase 2 truth) | ⚠ STATIC (documented, non-blocking) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full build succeeds | `npm run build` | Exit 0, 1 page built | ✓ PASS |
| Shell gate passes | `node scripts/verify-shell.mjs` | `SHELL SUMMARY ... violations=0`, exit 0 | ✓ PASS |
| SEC-01 non-regression | `node scripts/verify-no-external-origins.mjs` | `SEC01 SUMMARY files=2 woff2=55 fontface=61 inline_svg=9 external_refs=0`, exit 0 | ✓ PASS |
| Token fidelity gate | `npm run verify:tokens` | `TOKENS SUMMARY colors=47/47 typography=7/7 radius=6/6 spacing=5/5 custom_classes=6/6 mismatches=0`, exit 0 (previously blocked by an untracked `Arquivos de design/` folder — resolved by commit `d02c32a`, confirmed passing now) | ✓ PASS |
| Type-check | `npx astro check` | 0 errors, 0 warnings, 12 pre-existing hints (unrelated `z.array`/`z.string` deprecation notices in `content.config.ts`, outside this phase's scope) | ✓ PASS |
| Landmark cardinality against real `dist/index.html` | inline node script (this session) | `main count 1`, `nav count 1`, `footer count 1`, `h1 count 1`, `lang true`, skip-link offset 520 < first-nav offset 627, footer offset 9738 > main-end offset 9731 | ✓ PASS |
| Debt-marker scan | grep `TODO\|FIXME\|HACK\|XXX\|TBD\|coming soon\|not yet implemented` across `src/` | No matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| LAY-03 | 02-01, 02-02 | Nav inclui logo, links, Connect, toggle mobile sem framework JS | ✓ SATISFIED | Functionally verified (see above) **and** correctly marked `[x]`/`Complete` in `REQUIREMENTS.md` (commit `ca154cd`). |
| SEO-06 | 02-01 | HTML declara `lang="pt-BR"` | ✓ SATISFIED (implementation) / ⚠ TRACKING GAP | `lang="pt-BR"` is implemented and gate-verified (`lang=ok`). **However `REQUIREMENTS.md` still shows `SEO-06` as unchecked `[ ]` and `Pending` in the Traceability table** — neither the `ca154cd` commit (which closed LAY-03/A11Y-01) nor any later commit updated SEO-06's status, even though `02-01-PLAN.md`'s own `requirements_note` states "SEO-06 is fully closed here." This is a documentation/tracking omission, not a functional defect — flagged so it doesn't get lost before Phase 4 (which also touches `SEO-*`). |
| A11Y-01 | 02-01, 02-02, 02-03 | Navegação semântica, hierarquia de headings, navegável por teclado, foco visível | ✓ SATISFIED | Functionally verified (landmarks, skip link, focus-visible, heading hierarchy, overlay focus trap) **and** correctly marked `[x]`/`Complete` in `REQUIREMENTS.md`. |

No orphaned requirements: `REQUIREMENTS.md`'s Traceability table maps exactly LAY-03, SEO-06, A11Y-01 to Phase 2, matching the three IDs declared across all Phase 2 plans' frontmatter.

### Anti-Patterns Found

No blocking anti-patterns (no `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`, no stub returns, no hardcoded-empty renders) in any file this phase modified.

The following items are carried over from `02-REVIEW.md` (advisory per this verification's instructions, not treated as blocking gates, but reproduced here for visibility since two of them bear directly on this phase's accessibility truths):

| File | Pattern | Severity | Impact |
|---|---|---|---|
| `src/components/Footer.astro:29` | `data-footer-socials` container has `flex gap-6` with no `flex-wrap`; computed against real current `site.socials` content, 4 uppercase mono-label `PLACEHOLDER` links need ~470px but a 375px phone viewport leaves ~335px after margins, and `body{overflow-x:hidden}` clips (not scrolls) the overflow | WARNING (REVIEW WR-01) | Footer links may be keyboard-focusable but visually clipped on real phone widths — routed to Human Verification below rather than silently accepted |
| `src/components/Footer.astro:27` | `new Date().getFullYear()` only evaluates at `astro build` time; no scheduled rebuild exists (`vercel.json` cron / GitHub Action) to refresh it annually | WARNING (REVIEW WR-02) | Latent staleness bug, not a Phase 2 truth violation — deploy-process concern for Phase 5 |
| `src/components/Nav.astro:156-177` | Overlay focus trap correctly manages Tab-key order but does not `inert`/`aria-hidden` `<main>`/`<footer>` while open | WARNING (REVIEW WR-03) | Screen-reader virtual-cursor users could browse into visually-hidden background content while the overlay is open — not covered by this phase's literal must-have truths (which specify Tab/Shift+Tab/Escape only), but relevant to A11Y-01's broader intent |
| `scripts/verify-shell.mjs:316-317,346-347` | `focuscss`/`skiplink` CSS checks require an immediate `{` after the selector, unlike `findCssBlock()` used elsewhere in the same gate, which tolerates minifier comma-grouping | WARNING (REVIEW WR-04) | Gate-internal consistency issue; did not cause a false result in this build, but could false-fail a future build if Lightning CSS groups either selector |

## Human Verification Required

### 1. Footer social-link row visibility on real mobile viewports

**Test:** Open the built site (`npm run preview` or `npm run dev`) at a real phone-class viewport (320-390px wide, e.g. iPhone SE/12 emulation) and scroll to the footer.
**Expected:** All four footer link labels (`PLACEHOLDER` × 4) are fully visible on screen — wrapped to a second line if the row doesn't fit, not clipped off the right edge.
**Why human:** `data-footer-socials` uses `flex gap-6` with no `flex-wrap`, and layout-arithmetic (confirmed independently in this verification, matching `02-REVIEW.md` WR-01) suggests the row is wider than a phone viewport's content width given the current placeholder content. `body { overflow-x: hidden }` means any overflow is invisible rather than scrollable, so the affected links would remain in the DOM and keyboard-focusable but not visible — a real accessibility concern (WCAG 2.4.7) that only a rendered browser can confirm or refute. This was not covered by `02-02`'s human checkpoint (which tested the nav overlay, not the footer) and `02-03` shipped with no checkpoint task of its own.

## Gaps Summary

No FAILED truths, MISSING/STUB artifacts, or NOT_WIRED key links were found. All three plans' gates (`verify-shell.mjs`, 10 check groups, `violations=0`) were re-executed live in this session against a fresh build, not taken on SUMMARY.md's word, and every claim in the three SUMMARY.md files that was checkable against the codebase held up.

Two items keep this from an unconditional `passed`:
1. **Footer mobile overflow (human verification required)** — a real, arithmetically-plausible visual defect on narrow viewports that no automated gate in this phase checks for (the gate only checks anchor count/parity/`rel`, never rendered width). Routed to human verification rather than assumed either way.
2. **SEO-06 REQUIREMENTS.md tracking gap** — the requirement is functionally implemented and gate-verified, but the checkbox/traceability-table entry in `.planning/REQUIREMENTS.md` was never flipped to complete. Cheap fix (edit two lines), flagged so it isn't lost before Phase 4.

---

_Verified: 2026-09-02T23:25:00-03:00_
_Verifier: Claude (gsd-verifier)_
