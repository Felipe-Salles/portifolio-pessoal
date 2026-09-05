# Phase 2: Layout & Navigation Shell - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The visitor loads any page and sees the correct site shell — nav bar, footer, and page metadata — matching DESIGN.md, in Portuguese, and fully keyboard-accessible. This phase does NOT build the Hero/Dossier/Tech Stack/Projects/Contact sections (Phase 3) — nav links and the Connect button point at anchors (`#dossier`, `#stack`, `#projects`, `#contact`) that don't resolve to real sections until Phase 3 lands. That's expected: the shell is built ahead of the content it will eventually wrap.

Covers requirements LAY-03, SEO-06, A11Y-01. Footer is in scope per the ROADMAP goal narrative ("navigation, footer, and page metadata") even though it isn't one of the 4 itemized success criteria.

</domain>

<decisions>
## Implementation Decisions

### Mobile Nav Toggle
- **D-01:** Tapping the mobile `menu` icon opens a **full-screen overlay** (not a compact dropdown) — covers the viewport, large centered links, consistent with the dark/glassmorphism "command deck" feel of DESIGN.md. Must be built with vanilla JS only (no framework island), per ROADMAP success criterion 2.

### Connect Button
- **D-02:** The nav "Connect" button is a real anchor: `href="#contact"`. It is a live link now even though `#contact` doesn't resolve to anything until Phase 3 renders the Contact section — this is the intended sequencing, not a bug to work around.

### Footer Links
- **D-03:** Footer's link row reuses `site.socials` from `src/data/site.ts` (the same structural data Phase 1 scaffolded) rendered as text-style links, instead of a separate hardcoded footer link list. This replaces the prototype's literal "GitHub / LinkedIn / Documentation" text links — `site.socials` currently has 4 entries (code/work/mail/chat icons with placeholder hrefs+labels), so the footer will show however many entries `site.socials` has, not exactly 3. Single source of truth for social links across footer and (future) Contact section.

### Accessibility — Skip Link
- **D-04:** Add a "Pular para o conteúdo" skip-link now, in this phase, as part of the nav/shell build — not deferred to Phase 4. It directly reinforces A11Y-01 (fully keyboard-navigable) and is cheap to add alongside the rest of the shell.

### Claude's Discretion
- Exact overlay open/close animation/timing, icon swap (menu ↔ close), and focus-trap implementation for the full-screen mobile overlay — follow DESIGN.md's motion/glass patterns (glass-panel, cyan glow) and standard a11y practice (trap focus while open, restore focus to the toggle button on close, close on Escape).
- Whether nav uses scroll-spy / active-link highlighting as sections are scrolled past — not required by LAY-03/A11Y-01; skip unless trivial, since Phase 3 hasn't built the sections it would track yet.
- Footer copyright line content — follow the placeholder-content convention already established in `src/data/site.ts` (D-03 from Phase 1: bracketed `[…]` / `PLACEHOLDER — … a definir`), not the prototype's fake "© 2024 SYSTEM_ARCHITECT" text.
- 404 page is explicitly Phase 4 (A11Y-02) — do not build it here even though it would reuse this phase's layout/nav.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract
- `Arquivos de design/DESIGN.md` — full design system: colors, typography, spacing, motion/glow layering (§ "Level 1/2/3" glow hierarchy), focus-state treatment (cyan glow on interactive elements)
- `Arquivos de design/code.html` lines 220-244 (nav) and 398-410 (footer) — the prototype markup being adapted; note the mobile-open state has NO markup in the prototype (menu icon only, closed state) — the full-screen overlay (D-01) has no prototype reference and must be designed fresh within DESIGN.md's system
- `Arquivos de design/screen.png` — visual reference (desktop only; no mobile/expanded-nav screenshot exists)

### Phase 1 outputs (this phase builds directly on top of)
- `src/layouts/Base.astro` — existing HTML shell (lang="pt-BR", global.css import, glow-cloud divs, slot) — nav/footer/skip-link get added here, not a new layout
- `src/data/site.ts` — typed singleton with `brand` (nav wordmark) and `socials` (D-03's footer source) already scaffolded; placeholder-content convention (D-03 from Phase 1) to follow for any new placeholder text
- `.planning/phases/01-foundation-design-system/01-01-SUMMARY.md`, `01-02-SUMMARY.md`, `01-03-SUMMARY.md` — what Phase 1 already built (SEC-01 gate, Tailwind `@theme` tokens + 6 CSS primitives incl. `glass-panel`/`border-glow-cyan`, content collection)

### Requirements
- `.planning/REQUIREMENTS.md` — LAY-03, SEO-06, A11Y-01 definitions; also note A11Y-02/03/04 are explicitly Phase 4, not this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/Base.astro` — nav and footer mount here, wrapping `<slot />`; already has `lang="pt-BR"`, font imports, glow-cloud atmosphere divs
- `src/data/site.ts` — `site.brand` (wordmark), `site.socials` (icon/href/label array) both directly consumable by nav and footer components
- Tailwind `@theme` tokens from Phase 1 (`src/styles/global.css`) — full color/typography/spacing/radius scale already available as utility classes; no new tokens needed
- CSS primitives already ported in Phase 1: `glass-panel`, `border-glow-cyan`, grid background, button hover glow, scrollbar — reusable for nav/footer/overlay styling
- `astro-icon` + `@iconify-json/material-symbols` already installed (Phase 1) — `menu` and social icons (`code`/`work`/`mail`/`chat`) available as inline SVG via `<Icon name="material-symbols:menu" />`

### Established Patterns
- Self-hosted-only discipline (SEC-01) — any new nav/footer markup must not introduce external origins (already enforced by `scripts/verify-no-external-origins.mjs`, which will run against this phase's build too)
- Placeholder-content convention (D-03, Phase 1) — bracketed `[…]` or `PLACEHOLDER — … a definir`, centralized in `src/data/site.ts`, never inline in markup

### Integration Points
- Nav/footer/skip-link render inside `src/layouts/Base.astro`, wrapping whatever `src/pages/index.astro` currently contains (Phase 1's "PIPELINE OK" scaffolding page — untouched by this phase except to sit inside the new shell)
- Mobile overlay toggle is vanilla JS (`<script>` in the nav component or a small inline script) — no Alpine/React/framework island, per ROADMAP success criterion 2 and CLAUDE.md's "complexity only when necessary" stack preference

</code_context>

<specifics>
## Specific Ideas

- Full-screen mobile overlay, not a dropdown — user's explicit choice (D-01)
- Connect button is a real `#contact` anchor now, not inert — user's explicit choice (D-02)
- Footer reuses `site.socials` as its single source of truth rather than a parallel hardcoded link list — user's explicit choice (D-03)
- Skip link ships in this phase, not deferred to Phase 4's a11y polish — user's explicit choice (D-04)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Scroll-spy active-link highlighting and the 404 page were considered and explicitly left to Claude's discretion / Phase 4 respectively — see `<decisions>` → Claude's Discretion — not deferred as new-capability ideas.)

</deferred>

---

*Phase: 02-layout-navigation-shell*
*Context gathered: 2026-09-02*
