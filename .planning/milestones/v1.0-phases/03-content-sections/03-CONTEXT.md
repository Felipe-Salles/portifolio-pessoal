# Phase 3: Content Sections - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The visitor reads every core content section of the portfolio — Hero, Dossier, Tech Stack, Projects, Contact — rendered inside the shell (nav/footer) Phase 2 already built, matching the prototype's visual design and reflowing correctly on mobile. This phase does NOT touch the nav/footer shell itself (Phase 2, done), SEO/meta tags or the 404 page (Phase 4), or production security headers/deploy (Phase 5).

Covers requirements HERO-01, HERO-02, DOSS-01, DOSS-02, TECH-01, TECH-02, PROJ-01, PROJ-02, PROJ-03, PROJ-04, CONT-01, LAY-01, LAY-02.

</domain>

<decisions>
## Implementation Decisions

### Hero Content Mapping
- **D-01:** The H1 renders `site.heroHeading` (same placeholder value as `site.brand`, consistent with the nav wordmark) — not `site.name`.
- **D-02:** `site.title` (professional title/persona, required by HERO-01's "identidade/título profissional") renders as a secondary line between the H1 and the body paragraph. Three text levels in the Hero: H1 (`heroHeading`) → title line (`title`) → paragraph (`heroSubtitle`).
- **D-03:** `site.name` is NOT used anywhere in the Hero section — it stays reserved for other future use (e.g. meta tags). Do not invent a place to render it here.
- **D-04:** The availability badge (pulsing dot + `site.availabilityStatus` text) keeps the prototype's CSS-only pulse animation (`animate-pulse` equivalent) — zero JS.

### Projects Grid & Featured Treatment
- **D-05:** The grid is always 3 columns on desktop (`md:grid-cols-3`, matching the prototype), regardless of how many projects exist. With today's 1-entry placeholder collection, the single card occupies the first cell and the rest of the row is empty — that's expected, not a bug to work around with dynamic column logic.
- **D-06:** `featured: boolean` gives the card real visual hierarchy: a featured project spans 2 columns (`col-span-2`) and/or gets a stronger border/glow treatment — not just a sort-order signal.
- **D-07:** Sort order: featured projects first (sorted among themselves by `order`), then the remaining projects (also by `order`, falling back to file order when `order` is absent).
- **D-08:** Cards without `coverImage` (today's placeholder state) render a cyan gradient fallback with a centered generic icon — reusing design-system colors/glow, no external image dependency. This refines Phase 1's D-05 ("generic visual placeholder") with a concrete shape.
- **D-09:** The gradient fallback gets a subtle hover reaction (stronger glow, or a slight icon opacity/scale change) rather than staying fully static — preserves the prototype's "alive" card feeling even without a real photo. The prototype's grayscale→color photo-reveal hover effect itself is reserved for when real `coverImage` assets exist (v2) — do not attempt to fake that specific effect on a gradient.

### Contact Section
- **D-10:** Contact reuses `site.socials` exactly as-is — the same 4-entry array Footer already consumes (single source of truth, Phase 2's D-03 precedent). When real links replace the placeholders in v2, both Footer and Contact update from one edit in `site.ts`. Do NOT add separate `contactEmail`/`contactGithub`/`contactLinkedin` fields.
- **D-11:** Visually, Contact keeps the prototype's circular icon-button treatment (`w-12 h-12 rounded-full`, border + cyan glow on hover) — different from Footer's plain text-link row. Both read from the same `site.socials[].icon`/`.href`/`.label`, just styled differently per section.
- **D-12:** The Contact section's invitational heading + paragraph (prototype: "LET'S BUILD SOMETHING GREAT." + supporting copy — currently fictional SYSTEM_ARCHITECT persona text) gets its own placeholder fields in `site.ts` (e.g. `contactHeading` / `contactSubtitle`), following the same D-03 placeholder-marker convention as the rest of the site — not hardcoded generic text directly in the component.
- **D-13:** Contact's social links carry `rel="noopener noreferrer"` from the start, matching the Footer's T-02-17 mitigation from Phase 2 — applied by default, not a discussed choice (there's no real alternative once the links become real external URLs).

### Claude's Discretion
- Exact wording/shape of the new `contactHeading`/`contactSubtitle` placeholder field names in `site.ts` — follow the existing naming convention (`heroHeading`/`heroSubtitle`) for consistency.
- Exact gradient fallback composition (color stops, which icon) for project cards without `coverImage` — follow DESIGN.md's cyan glow language; Phase 1's D-05 already established the general direction, this phase just needs a concrete implementation.
- Exact hover treatment intensity on the gradient fallback (D-09) — subtle, not a full effect swap.
- Dossier layout (8/4 column split for bio + System Specs) — the prototype's structure is clear and uncontested; no gray area was raised.
- Tech Stack badge rendering — straightforward 3-category badge grid per DESIGN.md/TECH-02; no gray area was raised.
- Mobile reflow mechanics (20px margins, background grid scaling per LAY-01) — technical implementation detail for the researcher/planner, not a user-facing choice.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract
- `Arquivos de design/DESIGN.md` — full design system: colors, typography, spacing, motion/glow layering, "Mobile Reflow" note (§ Layout & Spacing) on background grid scaling
- `Arquivos de design/code.html` lines 246-397 — the prototype markup for all 5 sections (Hero 248-263, Dossier 265-292, Stack 294-325, Projects 327-377, Contact 379-396) being adapted
- `Arquivos de design/screen.png` — visual reference (desktop only)

### Phase 1 & 2 outputs (this phase builds directly on top of)
- `src/data/site.ts` — typed singleton with ALL Hero/Dossier/Tech Stack/Contact placeholder fields already scaffolded (D-02 from Phase 1); this phase ADDS `contactHeading`/`contactSubtitle` per D-12 above
- `src/content.config.ts` — `projects` Content Collection schema, including `featured`/`order`/`coverImage` fields whose visual meaning this phase's D-05 through D-09 now define
- `src/content/projects/placeholder-project.md` — the one existing placeholder entry (no `coverImage`, no `featured`, no `order` set) — the grid must render sensibly with just this one entry
- `src/layouts/Base.astro` — `<main id="main-content">` wraps the slot where these sections mount; `<Nav>`/`<Footer>` already point their anchors at `#dossier`/`#stack`/`#projects`/`#contact` (Phase 2) — this phase's section `id` attributes must match those exactly
- `src/components/Footer.astro` — precedent for reading `site.socials` and applying `rel="noopener noreferrer"` (D-10, D-13 reuse this exact pattern)
- `.planning/phases/02-layout-navigation-shell/02-01-SUMMARY.md`, `02-02-SUMMARY.md`, `02-03-SUMMARY.md` — what Phase 2 already built (nav, mobile overlay, footer, focus-visible glow, skip link)

### Requirements
- `.planning/REQUIREMENTS.md` — HERO-01/02, DOSS-01/02, TECH-01/02, PROJ-01/02/03/04, CONT-01, LAY-01/02 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/site.ts` — `heroHeading`, `title`, `heroSubtitle`, `availabilityStatus`, `bio[]`, `systemSpecs[]`, `techStack.{languages,frameworks,infrastructure}`, `socials[]` all directly consumable; only `contactHeading`/`contactSubtitle` need adding
- `src/content.config.ts` — schema already has everything Phase 3 needs (`title`, `description`, `tags`, `liveUrl`, `repoUrl`, `coverImage`, `featured`, `order`) — no schema migration required
- Tailwind `@theme` tokens + CSS primitives from Phase 1 (`glass-panel`, `border-glow-cyan`, `:focus-visible` glow from Phase 2) — directly reusable for section cards/panels
- `astro-icon` + `@iconify-json/material-symbols` — `arrow_forward`, `open_in_new`, `code`, `work`, `mail`, `chat` icons already verified available (Phase 1 pipeline proof)

### Established Patterns
- Placeholder-content convention (D-03, Phase 1) — bracketed `[…]` or `PLACEHOLDER — … a definir`, centralized in `site.ts`, never inline in markup — applies to any new `contactHeading`/`contactSubtitle` fields
- Single-source-of-truth data binding (D-03, Phase 2) — `site.socials` feeds both Footer and now Contact; don't fork it
- `astro:assets` `image()` optimization for `coverImage` (PROJ-04) — schema already typed for it from Phase 1
- SEC-01 self-hosted-only discipline — no external image URLs like the prototype's `lh3.googleusercontent.com` references; the gradient fallback (D-08) sidesteps this entirely for now

### Integration Points
- All 5 sections mount inside `src/layouts/Base.astro`'s `<main id="main-content">`, replacing `src/pages/index.astro`'s current Phase 1 pipeline-proof scaffolding content
- Section `id` attributes (`dossier`, `stack`, `projects`, `contact`) must match Phase 2's nav anchors exactly, plus `scroll-mt-32` (or equivalent) so the fixed nav doesn't cover the section heading on anchor-jump, same as the prototype

</code_context>

<specifics>
## Specific Ideas

- Hero: 3-level text hierarchy (H1 heroHeading → title line → heroSubtitle paragraph), pulsing availability badge — user's explicit choice
- Projects: always-3-column grid regardless of count, featured = visually bigger card (col-span-2 + stronger glow), featured-first sort, gradient-with-icon fallback with subtle hover reaction — user's explicit choices
- Contact: reuses `site.socials` (not new dedicated fields), circular icon-button style distinct from Footer's text-link style, new `contactHeading`/`contactSubtitle` placeholder fields for the invitational copy — user's explicit choices

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (The prototype's grayscale→color photo hover effect was considered and explicitly deferred to whenever real `coverImage` assets land — see D-09 — not treated as a new-capability idea needing its own phase.)

</deferred>

---

*Phase: 3-Content Sections*
*Context gathered: 2026-09-03*
