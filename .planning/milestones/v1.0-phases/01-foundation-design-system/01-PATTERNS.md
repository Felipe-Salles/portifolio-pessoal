# Phase 1: Foundation & Design System - Pattern Map

**Mapped:** 2026-09-02
**Files analyzed:** 8
**Analogs found:** 5 / 8 (design-prototype analogs) + 3 files use RESEARCH.md verified patterns (no codebase analog exists — greenfield)

**Important:** This is a greenfield repo — `git status`/`Glob` confirm no `src/`, no `package.json`, no prior application code of any kind. There is nothing in "the codebase" to copy runtime patterns from. The two design-prototype files are the only prior art and are treated as analogs per the orchestrator's explicit instruction:
- `Arquivos de design/code.html` — static HTML+Tailwind CDN prototype (source of truth for exact token values/keys and markup/content shape)
- `Arquivos de design/DESIGN.md` — canonical design tokens (frontmatter) + prose component rules

For the three purely mechanical config files that have no equivalent in either prototype file (`package.json`, `astro.config.mjs`, `tsconfig.json`), there is no analog to copy from at all — these are listed in "No Analog Found" and the planner should use RESEARCH.md's Architecture Patterns (already verified, ready-to-use) directly.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/styles/global.css` | config (theme tokens) | transform (design tokens → CSS custom properties) | `Arquivos de design/code.html` (tailwind.config script block) + `Arquivos de design/DESIGN.md` (frontmatter) | exact (values), syntax-transform (v3 JS → v4 CSS-first) |
| `src/content.config.ts` | model / schema | CRUD (defines validated collection) | none in codebase — use RESEARCH.md Pattern 5 | no-analog |
| `src/content/projects/placeholder-project.md` | model / data (content entry) | CRUD | `Arquivos de design/code.html` Projects section (lines 326-377) — field shape only, not wording | role-match (shape), explicit-mismatch (content style, see D-03) |
| `src/data/site.ts` | model / config (singleton) | transform (static data → typed export) | `Arquivos de design/code.html` (Nav brand, Hero, Dossier, Stack, Contact, Footer sections) | role-match (shape), explicit-mismatch (content style, see D-03) |
| `src/layouts/Base.astro` (scaffolded, not populated with real markup until Phase 2/3) | component / layout | request-response (renders `<head>`/`<body>` shell) | `Arquivos de design/code.html` `<head>`/`<body>` wrapper structure (lines 1-13, 220-224) | role-match (structure), explicit-mismatch (must remove all external origins) |
| `astro.config.mjs` | config | — (build config) | none — use RESEARCH.md Pattern 2 | no-analog |
| `package.json` | config | — (dependency manifest) | none — use RESEARCH.md Standard Stack install list | no-analog |
| `tsconfig.json` | config | — (compiler config) | none — use RESEARCH.md (`astro/tsconfigs/strict`) | no-analog |

## Pattern Assignments

### `src/styles/global.css` (config, transform)

**Analog:** `Arquivos de design/code.html` lines 70-218 (`tailwind.config` script block) cross-checked against `Arquivos de design/DESIGN.md` lines 1-103 (frontmatter — canonical per CONTEXT.md)

**Color tokens — copy every key verbatim from DESIGN.md frontmatter** (`Arquivos de design/DESIGN.md` lines 4-50):
```yaml
surface: '#111417'
surface-dim: '#111417'
surface-bright: '#37393d'
surface-container-lowest: '#0c0e12'
surface-container-low: '#191c1f'
surface-container: '#1d2023'
surface-container-high: '#282a2e'
surface-container-highest: '#323539'
on-surface: '#e1e2e7'
on-surface-variant: '#b9cacb'
inverse-surface: '#e1e2e7'
inverse-on-surface: '#2e3134'
outline: '#849495'
outline-variant: '#3b494b'
surface-tint: '#00dbe9'
primary: '#dbfcff'
on-primary: '#00363a'
primary-container: '#00f0ff'
on-primary-container: '#006970'
inverse-primary: '#006970'
secondary: '#c2c7ce'
on-secondary: '#2c3137'
secondary-container: '#42474d'
on-secondary-container: '#b1b5bc'
tertiary: '#f1f6ff'
on-tertiary: '#2a3139'
tertiary-container: '#d3dae4'
on-tertiary-container: '#585f68'
error: '#ffb4ab'
on-error: '#690005'
error-container: '#93000a'
on-error-container: '#ffdad6'
primary-fixed: '#7df4ff'
primary-fixed-dim: '#00dbe9'
on-primary-fixed: '#002022'
on-primary-fixed-variant: '#004f54'
secondary-fixed: '#dee3ea'
secondary-fixed-dim: '#c2c7ce'
on-secondary-fixed: '#171c21'
on-secondary-fixed-variant: '#42474d'
tertiary-fixed: '#dce3ed'
tertiary-fixed-dim: '#c0c7d1'
on-tertiary-fixed: '#151c23'
on-tertiary-fixed-variant: '#40474f'
background: '#111417'
on-background: '#e1e2e7'
surface-variant: '#323539'
```
Each becomes `--color-{dash-cased-key}: {hex};` inside `@theme { }` (RESEARCH.md Pattern 1 already shows the correct CSS-first syntax — this table is the exhaustive value list RESEARCH.md's example truncated with "...remaining ~35 frontmatter color keys...").

**Cross-check confirms `code.html`'s live `tailwind.config.theme.extend.colors` object (lines 75-123) matches this DESIGN.md list key-for-key and value-for-value** — no drift between the two sources for colors. Safe to treat DESIGN.md as the single source of truth.

**Typography tokens** (`Arquivos de design/DESIGN.md` lines 51-90, cross-checked against `code.html` lines 160-214 `fontSize` block — also matches exactly):
```yaml
display-lg:       { fontFamily: Lexend,          fontSize: 72px, fontWeight: '700', lineHeight: 80px, letterSpacing: -0.02em }
display-lg-mobile: { fontFamily: Lexend,          fontSize: 40px, fontWeight: '700', lineHeight: 48px, letterSpacing: -0.02em }
headline-md:       { fontFamily: Lexend,          fontSize: 32px, fontWeight: '600', lineHeight: 40px, letterSpacing: -0.01em }
body-lg:           { fontFamily: Inter,           fontSize: 18px, fontWeight: '400', lineHeight: 28px }
body-md:           { fontFamily: Inter,           fontSize: 16px, fontWeight: '400', lineHeight: 24px }
mono-label:        { fontFamily: JetBrains Mono,  fontSize: 14px, fontWeight: '500', lineHeight: 20px, letterSpacing: 0.05em }
mono-code:         { fontFamily: JetBrains Mono,  fontSize: 13px, fontWeight: '400', lineHeight: 20px }
```
Maps to RESEARCH.md Pattern 1's double-hyphen modifier syntax: `--text-{name}`, `--text-{name}--line-height`, `--text-{name}--letter-spacing`, `--text-{name}--font-weight`, plus a matching `--font-{name}` family declaration (see `code.html` lines 137-159 `fontFamily` block for the name→family mapping, e.g. `display-lg` → Lexend, `body-md`/`body-lg` → Inter, `mono-label`/`mono-code` → JetBrains Mono).

**Spacing** (`Arquivos de design/DESIGN.md` lines 98-103, matches `code.html` lines 130-136):
```yaml
unit: 8px
container-max: 1280px
gutter: 24px
margin-mobile: 20px
section-gap: 160px
```

**Radius — DISCREPANCY FLAG:** `DESIGN.md` frontmatter (lines 91-97) and `code.html`'s live `tailwind.config.borderRadius` (lines 124-129) do **not** match key-for-key, unlike colors/typography/spacing:
```
DESIGN.md `rounded:`          code.html `borderRadius:`
sm:      0.125rem             DEFAULT: 0.125rem
DEFAULT: 0.25rem              lg:      0.25rem
md:      0.375rem             xl:      0.5rem
lg:      0.5rem               full:    0.75rem
xl:      0.75rem
full:    9999px
```
`code.html`'s `full: 0.75rem` is clearly a prototype authoring error (0.75rem is not a "full/pill" radius — DESIGN.md's `full: 9999px` is correct and matches the "pill/circle" usage seen at runtime, e.g. status indicators, contact icon circles `w-12 h-12 rounded-full` at `code.html` lines 383-393). **Planner should treat `DESIGN.md`'s `rounded:` block (6 keys: sm/DEFAULT/md/lg/xl/full) as canonical** per CONTEXT.md's general "frontmatter is canonical" instruction — `code.html`'s borderRadius object is the one place the two sources genuinely diverge and should not be copied as-is.

**Anti-patterns to avoid when writing this file** (RESEARCH.md Pitfalls 4, and explicit anti-pattern list):
- Do NOT copy `code.html`'s JS `fontSize: ["32px", {...}]` tuple syntax literally — that's Tailwind v3 JS-config syntax; CSS-first `@theme` uses flat `--text-{name}--{modifier}` properties instead.
- Do NOT create a `tailwind.config.js` at all — `@tailwindcss/vite` in this project is 100% CSS-first.

---

### `src/content.config.ts` (model/schema, CRUD)

**Analog:** none in codebase (greenfield) — use RESEARCH.md Pattern 5 verbatim, it is already verified/ready-to-use:
```typescript
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      liveUrl: z.string().url().optional(),
      repoUrl: z.string().url().optional(),
      coverImage: image().optional(),   // D-05
      featured: z.boolean().optional(), // D-04
      order: z.number().optional(),     // D-04
    }),
});

export const collections = { projects };
```
**Critical:** file must live at `src/content.config.ts` (project root of `src/`), NOT `src/content/config.ts` (RESEARCH.md Pitfall 1 — legacy location silently ignored by Astro 6+).
**Critical:** `schema` must be a function `({ image }) => z.object({...})`, not a plain object, or `image()` throws `ReferenceError` (RESEARCH.md Pitfall 6).

---

### `src/content/projects/placeholder-project.md` (model/data, CRUD)

**Analog for field shape:** `Arquivos de design/code.html` lines 330-345 (Project 1 card — "Neural Engine") shows the full field set this schema must accommodate: title, short description, 2 tech tags, both `liveUrl` and `repoUrl` present. Lines 346-360 (Project 2 — "Vault-X") shows a card with `repoUrl` only (no live link) — confirms both URL fields are legitimately optional per-entry. Lines 361-375 (Project 3 — "Omni-Stream") shows `liveUrl` only (no repo link).

**Content style — explicit mismatch, do not copy wording:** Per D-03, do not reuse `code.html`'s plausible-sounding fictional copy ("Neural Engine", "A high-performance machine learning inference pipeline built for real-time data processing at scale"). Use obviously-provisional markers instead, per RESEARCH.md's exact example:
```markdown
---
title: "[Nome do Projeto]"
description: "PLACEHOLDER — descrição do projeto a definir"
tags: ["PLACEHOLDER"]
---
```
Leave `coverImage`, `liveUrl`, `repoUrl`, `featured`, `order` all absent — confirms the schema tolerates a minimal entry (this is Phase 1's success criterion #3, per CONTEXT.md/ROADMAP.md).

---

### `src/data/site.ts` (model/config singleton, transform)

**Analog for field shape (not wording):** `Arquivos de design/code.html` — this file's singleton shape mirrors the following prototype sections, field-for-field:

| `site.ts` field group | `code.html` source | Lines |
|---|---|---|
| Identity/brand text (nav) | `<div class="font-headline-md ...">SYSTEM.CORE</div>` | 227-229 |
| Title/persona + hero heading/subtitle + availability status | Hero section: status badge `AVAILABLE FOR NEW PROJECTS`, `<h1>ARCHITECT</h1>`, subtitle paragraph | 248-263 |
| Bio (Dossier) | Two `<p>` paragraphs in `#dossier` | 269-272 |
| "System Specs" stats (label/value pairs) | `<ul>` of `<li class="flex justify-between">` — EXPERIENCE/FOCUS/DOMAIN | 276-289 |
| Tech stack, grouped by 3 categories | `#stack` section: LANGUAGES / FRAMEWORKS / INFRASTRUCTURE, each a `glass-panel` with an array of tag spans | 293-325 |
| Social links (contact icons + footer) | Contact section 4 icon links (`code`, `work`, `mail`, `chat` glyphs) + footer 3 text links (GitHub, LinkedIn, Documentation) | 379-410 |

**Content style — explicit mismatch, do not copy wording:** per D-03, do not port the fictional "SYSTEM_ARCHITECT" / "ARCHITECT" persona verbatim as if it were real content — use bracketed/PLACEHOLDER markers (e.g. `[Seu Nome Aqui]`) for every string field, consistent with the `placeholder-project.md` convention above. The *shape* (stat label/value pairs, 3 tech categories each with an array of tag strings, social link array with icon-name + href + label) is what should be copied; the *values* should not.

**Type shape suggestion** (derived from the table above, not prescriptive — Claude's discretion per CONTEXT.md):
```typescript
export const site = {
  name: "[Seu Nome Aqui]",
  title: "PLACEHOLDER — título/persona a definir",
  availabilityStatus: "PLACEHOLDER — disponibilidade a definir",
  heroHeading: "[Nome/Marca Aqui]",
  heroSubtitle: "PLACEHOLDER — subtítulo a definir",
  bio: ["PLACEHOLDER — parágrafo 1 da bio a definir", "PLACEHOLDER — parágrafo 2 a definir"],
  systemSpecs: [
    { label: "EXPERIENCE", value: "PLACEHOLDER" },
    { label: "FOCUS", value: "PLACEHOLDER" },
    { label: "DOMAIN", value: "PLACEHOLDER" },
  ],
  techStack: {
    languages: ["PLACEHOLDER"],
    frameworks: ["PLACEHOLDER"],
    infrastructure: ["PLACEHOLDER"],
  },
  socials: [
    { icon: "material-symbols:code", href: "#", label: "PLACEHOLDER" },
    { icon: "material-symbols:work", href: "#", label: "PLACEHOLDER" },
    { icon: "material-symbols:mail", href: "#", label: "PLACEHOLDER" },
    { icon: "material-symbols:chat", href: "#", label: "PLACEHOLDER" },
  ],
} as const;
```

---

### `src/layouts/Base.astro` (component/layout, request-response — scaffolded only this phase)

**Analog:** `Arquivos de design/code.html` lines 1-13 (`<head>`) and 220-224 (`<body>` opening wrapper)

**What to copy (structure only):**
```html
<html lang="pt-BR">  <!-- code.html line 3 used lang="en" — MUST change to pt-BR per PROJECT.md PT-BR constraint -->
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <title>...</title>
  <!-- global.css import + @fontsource imports go here (RESEARCH.md Pattern 3) -->
</head>
<body class="bg-background text-on-background bg-grid-pattern relative min-h-screen">
  <!-- Atmospheric glow layers -->
  <div class="glow-cloud-top-right"></div>
  <div class="glow-cloud-bottom-left"></div>
  <slot />
</body>
</html>
```
(`code.html` lines 220-223 show the exact glow-cloud div markup and body classes to reproduce; the `.glow-cloud-*`/`.bg-grid-pattern`/`.glass-panel`/`.border-glow-cyan` custom CSS classes at `code.html` lines 13-69 should be ported into `global.css` as plain CSS, since they're not expressible as Tailwind utilities alone.)

**What must NOT be copied (explicit mismatch — SEC-01):**
```html
<!-- code.html lines 7-12 — DO NOT PORT ANY OF THESE -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:..." rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Lexend:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
```
Per RESEARCH.md's Anti-Patterns/Pitfall 7: even the bare `<link rel="preconnect">` (no matching stylesheet) must be removed entirely — it still opens a DNS/TCP handshake to an external origin, which breaches SEC-01's "zero external network requests" even though nothing visibly fails to load. Replace with `@fontsource/*` weight-specific imports (RESEARCH.md Pattern 3) and `astro-icon`'s `<Icon />` (RESEARCH.md Pattern 4) instead of the Material Symbols icon-font `<link>` and the Tailwind CDN `<script>`.

**Font weight reference** (`Arquivos de design/code.html` line 11 query string — confirms exact weights to install per-family, matching DESIGN.md's typography fontWeight values):
```
Inter:wght@400;500;600;700
JetBrains+Mono:wght@400;500;700
Lexend:wght@400;500;600;700;800
```
This is the source CONTEXT.md's "Claude's Discretion" item referenced ("map from DESIGN.md's specified weights... confirmed from code.html's Google Fonts URL") — confirmed here directly.

---

## Shared Patterns

### Design token fidelity (colors, typography, spacing)
**Source:** `Arquivos de design/DESIGN.md` frontmatter (canonical) + `Arquivos de design/code.html` `tailwind.config` (cross-check)
**Apply to:** `src/styles/global.css` only, but every other file in this phase and beyond consumes these tokens by class name — so exact key-name fidelity here (dash-cased, e.g. `primary-container` not `primaryContainer`) is load-bearing for every future phase.

### Zero-external-origin discipline (SEC-01)
**Source:** RESEARCH.md Pitfall 7 (verification method) + Anti-Patterns section
**Apply to:** `src/layouts/Base.astro` (head tags), `astro.config.mjs` (no external CDN plugins), `src/styles/global.css` (no `@import url(...)` to external hosts)
**Verification command** (per RESEARCH.md — deterministic, not a manual DevTools scan):
```bash
grep -rn "fonts.googleapis\|fonts.gstatic\|cdn.tailwindcss\|material-symbols" dist/
grep -rn '<link[^>]*href="https\?://' dist/
grep -rn '<script[^>]*src="https\?://' dist/
```
All three should return zero matches after `astro build`.

### Placeholder-content marker convention (D-03)
**Source:** CONTEXT.md D-03, applied identically in RESEARCH.md's own code example
**Apply to:** `src/data/site.ts` and `src/content/projects/placeholder-project.md`
**Pattern:** every provisional string uses an unmistakable marker — bracketed for identity fields (`[Nome do Projeto]`, `[Seu Nome Aqui]`), `PLACEHOLDER — ... a definir` prefix for descriptive fields. Never write plausible-looking filler in the style of `code.html`'s fictional persona.

### Tailwind v4 CSS-first `@theme` syntax (not v3 JS config)
**Source:** RESEARCH.md Pattern 1 + Pitfall 4
**Apply to:** `src/styles/global.css` exclusively
**Rule:** every `code.html` JS-tuple value (`fontSize: ["32px", {...}]`) becomes flat double-hyphen CSS custom properties (`--text-headline-md: 32px; --text-headline-md--line-height: 40px; ...`). No `tailwind.config.js`/`.mjs` file should exist anywhere in the repo.

## No Analog Found

Files with no prior-art match at all (neither in the codebase nor the design prototype, since they're pure mechanical scaffolding) — planner should use RESEARCH.md's Architecture Patterns directly, which are already verified/ready-to-use:

| File | Role | Data Flow | Reason | Use Instead |
|---|---|---|---|---|
| `astro.config.mjs` | config | — | No config file exists anywhere in repo (greenfield); no config concept exists in the static HTML prototype either | RESEARCH.md Architecture Patterns → Pattern 2 (verbatim, verified) |
| `package.json` | config | — | Same — greenfield, no manifest exists | RESEARCH.md Standard Stack → Installation block (verbatim install commands + version pins) |
| `tsconfig.json` | config | — | Same — greenfield, no TS config exists; prototype is plain HTML with no build step | RESEARCH.md Standard Stack table (`@astrojs/check` + `typescript@^6.0.3`) — extend `astro/tsconfigs/strict` per CLAUDE.md |

## Metadata

**Analog search scope:** Entire repository (`Glob("**/*")` on project root confirmed zero `src/`, zero `package.json` — genuinely greenfield) plus `Arquivos de design/` (both files read in full: `code.html` 411 lines, `DESIGN.md` 164 lines).
**Files scanned:** 2 (both design-prototype source files, read in full — no re-reads, no partial ranges needed since both are well under 2,000 lines)
**Pattern extraction date:** 2026-09-02
