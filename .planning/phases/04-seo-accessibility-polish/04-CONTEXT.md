# Phase 4: SEO, Accessibility & Polish - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The site becomes discoverable, shareable, and accessible — passing the baseline SEO/a11y checks a technical recruiter or search engine would expect. Concretely: unique `<title>`/meta description and OG/Twitter Card preview image, `sitemap.xml` + `robots.txt`, a Cyber-Sophisticate-styled favicon, a custom 404 page reusing the shared nav/layout, descriptive alt text on all images/icons, and verified WCAG contrast on the real rendered glassmorphism panels. This phase does NOT touch production security headers or the Vercel deploy itself (Phase 5) — it only prepares the artifacts and markup those later steps will ship.

Covers requirements SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, A11Y-02, A11Y-03, A11Y-04.

**Site shape note:** the site is a single real page (`src/pages/index.astro`, all sections addressed by in-page `#anchors`) plus the new 404 page this phase adds — there are no per-project detail pages or other routes. "Every page" in SEO-01 therefore means these two pages.

</domain>

<decisions>
## Implementation Decisions

### OG/Twitter Share Image (SEO-02)
- **D-01:** Content is the wordmark + tagline — reuses `site.brand`/`site.title` (or equivalent Hero fields) directly, not separate hardcoded OG copy. When real content replaces the placeholders, the OG image updates automatically with no separate edit.
- **D-02:** Visual composition reuses the Hero's existing treatment (grid background pattern + glow clouds + glass-panel framing) rather than a simplified thumbnail-optimized layout — visual consistency with what the visitor sees after clicking through.
- **D-03:** One shared OG image serves the whole site, including the 404 page — no dedicated "not found" preview image. A 404 is rarely shared directly; a second image is effort without real payoff.
- **D-04:** Image text keeps the same bracketed placeholder style already used in `site.ts` (e.g. `[Nome/Marca Aqui]`) — consistent with Phase 1's D-03 placeholder convention (never look like real, finished content).

### 404 Page (A11Y-02)
- **D-05:** Copy stays in the site's "system/terminal" tone (e.g. "ERRO 404 — ROTA NÃO ENCONTRADA"), matching the Hero's `>_` badge / mono-label voice, rather than a generic plain-language error message.
- **D-06:** Includes one primary CTA back to the Home page, styled like the existing `btn-primary` (same visual weight as the Hero's "VER PROJETOS" CTA).
- **D-07:** No dedicated illustration/icon — reuses existing primitives (`glass-panel`, `border-glow-cyan`) with typography only. No new visual asset needed for this page.
- **D-08:** Keeps the full nav (including `#dossier`/`#stack`/`#projects`/`#contact` anchors) — clicking one navigates back to the home page and scrolls to that section, standard cross-page anchor behavior, no special-casing needed.

### Favicon (SEO-05)
- **D-09:** The mark is an abstract geometric glyph in the cyan palette, not a monogram/initial — specifically, reuses the `>_` glyph already used in the Hero's availability badge, rather than inventing a new brand element from scratch. This sidesteps the fact that `site.name`/`site.brand` are still placeholders (an initial-based mark would need to change later).
- **D-10:** Ship both a modern SVG favicon and PNG/ICO fallbacks for broad browser/bookmark compatibility, not SVG-only.

### Decorative Icons & Alt Text (A11Y-03 / A11Y-04)
- **D-11:** Purely decorative icons (the Hero CTA's arrow, the project-card cover-image fallback icon, and similar icons that only reinforce an already-labeled link/button) get explicit `aria-hidden="true"` — avoids double-announcing content to screen readers.
- **D-12:** The atmospheric `glow-cloud-top-right`/`glow-cloud-bottom-left` divs in `Base.astro` get `aria-hidden="true"` as well — same rationale, applied consistently to all non-content decorative elements.
- **D-13:** Tech-stack badges (`[ ASTRO ]` style) and project tag pills do NOT need a separate `aria-label` — they're `<span>` elements with real visible text, already read naturally by screen readers. No stripped-bracket aria-label rewrite needed.
- **D-14:** An automated accessibility audit (axe-core or equivalent) runs as a build gate, following the same pattern as Phases 1–3's `scripts/verify-*.mjs` scripts — not a one-time manual visual check. This gate is expected to cover both alt-text/aria completeness (A11Y-03) and contrast verification (A11Y-04) in one pass, consistent with how this project has gated every prior phase's requirements.

### Claude's Discretion
- Exact SVG markup/shape refinement of the `>_` favicon glyph and its crop/sizing for the 16×16/32×32/apple-touch-icon variants.
- Exact wording of the OG image tagline beyond reusing `site.brand`/`site.title` — follow the same fields, no new copy to invent.
- Technical mechanism for generating the static OG image (manual asset vs. build-time composition) — implementation detail, not a user-facing choice.
- Exact axe-core integration approach (Playwright + axe, `@axe-core/cli`, or equivalent) and which specific WCAG level/ruleset to gate on — technical tooling decision for research/planning.
- `robots.txt` and `sitemap.xml` content/config — no gray area was raised; standard `@astrojs/sitemap` output permitting full indexing, per SEO-03/04's existing wording.
- Meta description copy per page — follows the same placeholder convention as `site.ts` fields; no new convention needed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract
- `Arquivos de design/DESIGN.md` — full design system: colors, typography, spacing, motion/glow layering. No favicon/OG/404 guidance exists here — these are fresh compositions within the existing token system, not adaptations of prototype markup (same situation as Phase 2's mobile overlay, which also had no prototype reference).
- `Arquivos de design/code.html` — confirms no 404, favicon, or OG image markup exists in the prototype; nothing to adapt for this phase's new artifacts.

### Phase 1–3 outputs (this phase builds directly on top of)
- `src/layouts/Base.astro` — current `<head>` only sets `<title>`; SEO-01/02 meta tags (description, OG, Twitter Card) and SEO-05 favicon `<link>` tags need to be added here. Also where the `glow-cloud-top-right`/`glow-cloud-bottom-left` divs (D-12) live.
- `src/data/site.ts` — typed singleton; OG image content (D-01) reads `site.brand`/`site.title` from here, no new fields needed unless research determines otherwise.
- `src/pages/index.astro` — the only existing page; hero CTA icon (`arrow_forward`) and project cover fallback icon (`material-symbols:code`) are the concrete decorative-icon instances D-11 applies to.
- `src/components/Nav.astro` — nav markup the 404 page reuses in full per D-08 (no simplified variant).
- `scripts/verify-no-external-origins.mjs`, `verify-design-tokens.mjs`, `verify-shell.mjs`, `verify-sections.mjs`, `verify-content-schema.mjs` — established pattern D-14's new accessibility gate script should follow (naming, wiring into `npm run verify`).
- `.planning/phases/03-content-sections/03-SUMMARY.md` files — confirms project cover-image alt text (`Capa do projeto ${title}`) and social-link `aria-label`s are already in place from Phase 3; this phase does not need to redo that work, only the newly identified decorative-icon/glow-cloud gaps (D-11, D-12).

### Requirements
- `.planning/REQUIREMENTS.md` — SEO-01/02/03/04/05, A11Y-02/03/04 definitions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `site.availabilityStatus` + the Hero's `>_` badge markup (`src/pages/index.astro`) — the exact visual glyph D-09's favicon derives from.
- `btn-primary` CSS class (already used for the Hero "VER PROJETOS" CTA) — reused as-is for the 404's Home CTA per D-06.
- `glass-panel`, `border-glow-cyan` primitives (Phase 1) — reused for the 404's container per D-07, no new visual primitive needed.
- Existing `scripts/verify-*.mjs` pattern — template for the new accessibility-gate script (D-14).

### Established Patterns
- Placeholder-content convention (D-03, Phase 1) — bracketed `[…]` / `PLACEHOLDER — … a definir` — extends to the OG image's rendered text (D-04) and any new meta-description placeholder copy.
- Deterministic build-time verification gates (`npm run verify`) for every phase's core requirements — D-14 extends this to accessibility.
- `rel="noopener noreferrer"` + `aria-label` on icon-only interactive elements (Phase 2/3 precedent) — the decorative-vs-meaningful icon distinction (D-11) is the next increment of this same discipline.

### Integration Points
- New `src/pages/404.astro` — first new page/route this phase adds; wraps in the same `Base` layout + full `Nav`/`Footer` per D-08.
- `Base.astro`'s `<head>` gains: meta description, OG/Twitter meta tags (reading the static image asset + `site.brand`/`site.title`), and favicon `<link>` tags.
- New static OG image asset (exact generation mechanism left to Claude's discretion) referenced from `Base.astro`'s OG/Twitter meta tags.
- `sitemap.xml`/`robots.txt` — likely via `@astrojs/sitemap` integration added to `astro.config.mjs` (not yet installed) plus a static `public/robots.txt`.

</code_context>

<specifics>
## Specific Ideas

- OG image: wordmark + tagline text reading directly from `site.ts`, Hero's grid+glow-cloud+glass-panel visual treatment, one shared image for both the main page and 404 — user's explicit choices (D-01–D-04)
- 404: "system/terminal" tone copy, single Home CTA styled like `btn-primary`, no new illustration, full nav with cross-page anchors — user's explicit choices (D-05–D-08)
- Favicon: reuses the existing `>_` glyph from the Hero availability badge (not a new mark, not an initial), SVG + PNG/ICO fallback — user's explicit choices (D-09–D-10)
- Accessibility: `aria-hidden` on all purely decorative icons and the glow-cloud atmosphere divs, no aria-label rewrite needed on text-based tech badges, automated axe-core-style gate covering both alt-text and contrast — user's explicit choices (D-11–D-14)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-SEO, Accessibility & Polish*
*Context gathered: 2026-09-03*
