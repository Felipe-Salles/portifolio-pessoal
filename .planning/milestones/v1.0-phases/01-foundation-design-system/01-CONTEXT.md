# Phase 1: Foundation & Design System - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the secure, self-contained build foundation the whole site is built on top of — before any nav, layout, or content sections exist. Concretely: an Astro project wired to Tailwind v4's `@theme` with every DESIGN.md token (colors, typography scale, spacing, radii), zero external network origins for scripts/fonts/icons (self-hosted at build time), and the Astro Content Collection schema for `projects` validated against one placeholder entry. It does not include nav/footer (Phase 2), rendered content sections (Phase 3), SEO/a11y (Phase 4), or production security headers/deploy (Phase 5) — only SEC-01 (no external script/font/icon origins) is in scope here, structurally, because it constrains every component built afterward.

</domain>

<decisions>
## Implementation Decisions

### Font self-hosting
- **D-01:** Use `@fontsource/*` packages (Inter, Lexend, JetBrains Mono) instead of the Astro Fonts API's `fontProviders.google()`. Rationale: `@fontsource` ships the font files inside the npm package itself, so the build is 100% offline-reproducible — zero network call at any point, including during `astro build` / CI, not just at runtime.

### Placeholder data architecture
- **D-02:** Singleton site content (identity/title, bio, "System Specs" stats, tech stack grouped by the 3 categories, social links) lives in a single typed TypeScript config file (e.g. `src/data/site.ts`), NOT in separate Astro Content Collections. Reasoning: this content has exactly one instance each — a Content Collection (with per-file schema validation) is overhead for singleton data. Astro Content Collections are reserved for `projects`, which is a real repeating list.
- Downstream implication for planning: `src/data/site.ts` (or equivalent) should be scaffolded in this phase alongside the `projects` collection, even though it isn't rendered until Phase 3 — it's part of the "data foundation" this phase delivers.

### Placeholder content style
- **D-03:** All placeholder text (name, title, bio, project descriptions, etc.) must be obviously and explicitly marked as provisional — e.g. `[Seu Nome Aqui]`, `PLACEHOLDER — bio a definir` — rather than plausible-looking filler in the style of the prototype's fictional "SYSTEM_ARCHITECT" persona. Rationale: eliminates any risk of provisional content accidentally shipping to production looking like real content.

### Content Collection schema — `projects`
- **D-04:** Beyond the fields already required by REQUIREMENTS.md (title, description, tech tags, live/repo links per PROJ-01/02/03), the Fase 1 schema also includes:
  - `featured: boolean` (optional) — lets Phase 3 decide card hierarchy/ordering without a later schema migration.
  - `order: number` (optional) — manual display-order control, independent of file naming or alphabetical sort.
- **D-05:** `coverImage` is **optional** in the schema (not required on the placeholder entry). Cards without a `coverImage` should fall back to a generic visual placeholder (e.g. a gradient/pattern in the cyan palette) rather than blocking the placeholder project entry on having a real image asset. `coverImage`, when present, must still go through `astro:assets` for optimization (PROJ-04) — this applies at render time in Phase 3, but the schema field type should be Astro's image() schema helper from Phase 1 onward so the type is correct from the start.

### Claude's Discretion
- Exact `@fontsource` weight subsets to install (map from DESIGN.md's specified weights per typeface: Lexend 400/500/600/700/800, Inter 400/500/600/700, JetBrains Mono 400/500/700 — confirmed from `code.html`'s Google Fonts URL).
- Exact shape/wording of the generic cover-image fallback placeholder visual.
- Package manager and other purely technical setup choices not covered above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System (source of truth for tokens/visuals)
- `Arquivos de design/DESIGN.md` — full design system contract: color tokens (frontmatter), typography scale, spacing/radii, and prose sections describing brand, elevation, and component rules. **Note:** the frontmatter color tokens (e.g. `primary-container: #00f0ff`, `surface: #111417`) are the ones actually implemented in the prototype's Tailwind config — treat the frontmatter as canonical over the simplified hex examples in the prose "Colors" section, which describes intent/rationale rather than exact implementation values.
- `Arquivos de design/code.html` — static HTML+Tailwind CDN prototype; contains the working `tailwind.config` (colors, borderRadius, spacing, fontFamily, fontSize) that DESIGN.md's `@theme` tokens must reproduce. Also the source of truth for which Material Symbols icons are used (`menu`, `arrow_forward`, `open_in_new`, `code`, `work`, `mail`, `chat`).
- `Arquivos de design/screen.png` — visual reference screenshot of the prototype.

### Project-level requirements & constraints
- `.planning/PROJECT.md` — core value, constraints (Astro, Vercel, PT-BR, security, design fidelity, placeholder-content strategy).
- `.planning/REQUIREMENTS.md` — SEC-01 (this phase's mapped requirement) plus the full PROJ-* fields this phase's schema must support ahead of Phase 3.
- `.planning/ROADMAP.md` §"Phase 1: Foundation & Design System" — phase goal and 3 success criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

Greenfield project — no application code exists yet, only the design/prototype files above. Nothing to reuse; everything in this phase is new scaffolding.

### Established Patterns (from the prototype, to carry forward)
- Tailwind theme tokens use dash-cased custom names matching DESIGN.md exactly (`primary-container`, `on-surface-variant`, `surface-container-high`, etc.) — not Tailwind's default palette names. The `@theme` config in Astro should mirror this 1:1.
- Icons used: `menu`, `arrow_forward`, `open_in_new`, `code`, `work`, `mail`, `chat` (Material Symbols Outlined, mix of FILL 0 and FILL 1 variants) — confirms the TECH.md recommendation to use `astro-icon` + `@iconify-json/material-symbols` for these exact glyphs.

### Integration Points
- Phase 2 (nav/layout) and Phase 3 (content sections) will consume the Tailwind theme tokens and `src/data/site.ts` scaffolded in this phase.
- Phase 3 will render the `projects` Content Collection whose schema is finalized in this phase.

</code_context>

<specifics>
## Specific Ideas

No additional specific visual/behavioral references beyond what's already captured in DESIGN.md/code.html and the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation & Design System*
*Context gathered: 2026-09-02*
