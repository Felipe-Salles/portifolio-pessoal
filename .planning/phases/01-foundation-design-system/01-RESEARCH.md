# Phase 1: Foundation & Design System - Research

**Researched:** 2026-09-02
**Domain:** Astro 7 static site foundation — self-hosted build pipeline (Tailwind v4, fonts, icons) + Content Layer schema
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (Font self-hosting):** Use `@fontsource/*` packages (Inter, Lexend, JetBrains Mono) instead of the Astro Fonts API's `fontProviders.google()`. Rationale: `@fontsource` ships the font files inside the npm package itself, so the build is 100% offline-reproducible — zero network call at any point, including during `astro build` / CI, not just at runtime.
- **D-02 (Placeholder data architecture):** Singleton site content (identity/title, bio, "System Specs" stats, tech stack grouped by the 3 categories, social links) lives in a single typed TypeScript config file (e.g. `src/data/site.ts`), NOT in separate Astro Content Collections. Astro Content Collections are reserved for `projects`, which is a real repeating list. Downstream implication: `src/data/site.ts` (or equivalent) should be scaffolded in this phase alongside the `projects` collection, even though it isn't rendered until Phase 3.
- **D-03 (Placeholder content style):** All placeholder text (name, title, bio, project descriptions, etc.) must be obviously and explicitly marked as provisional — e.g. `[Seu Nome Aqui]`, `PLACEHOLDER — bio a definir` — rather than plausible-looking filler in the style of the prototype's fictional "SYSTEM_ARCHITECT" persona.
- **D-04 (Content Collection schema — `projects`):** Beyond the fields already required by REQUIREMENTS.md (title, description, tech tags, live/repo links per PROJ-01/02/03), the Phase 1 schema also includes: `featured: boolean` (optional) — lets Phase 3 decide card hierarchy/ordering without a later schema migration; `order: number` (optional) — manual display-order control, independent of file naming or alphabetical sort.
- **D-05 (`coverImage` optionality):** `coverImage` is optional in the schema (not required on the placeholder entry). Cards without a `coverImage` should fall back to a generic visual placeholder (e.g. a gradient/pattern in the cyan palette) rather than blocking the placeholder project entry on having a real image asset. `coverImage`, when present, must still go through `astro:assets` for optimization (PROJ-04) at render time in Phase 3, but the schema field type should be Astro's `image()` schema helper from Phase 1 onward so the type is correct from the start.

### Claude's Discretion

- Exact `@fontsource` weight subsets to install (map from DESIGN.md's specified weights per typeface: Lexend 400/500/600/700/800, Inter 400/500/600/700, JetBrains Mono 400/500/700 — confirmed from `code.html`'s Google Fonts URL).
- Exact shape/wording of the generic cover-image fallback placeholder visual.
- Package manager and other purely technical setup choices not covered above.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| SEC-01 | Site não carrega nenhuma origem externa de script/fonte/ícone (Tailwind, fontes e ícones compilados/self-hosted no build) | Standard Stack (Tailwind via `@tailwindcss/vite`, fonts via `@fontsource/*`, icons via `astro-icon` + `@iconify-json/material-symbols` — all build-time, zero external origin) + Common Pitfalls #7 (deterministic `dist/` grep verification method, since this requirement's acceptance check needs to be more rigorous than a visual DevTools scan) + Security Domain (Known Threat Patterns table). |

Note: this phase also lays groundwork consumed by later-phase requirements — PROJ-04 (`astro:assets` optimization) is only *typed* now via the `image()` schema helper (D-05), not exercised until Phase 3; not a Phase 1 acceptance gate.
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`./CLAUDE.md` already contains an extensive, decided tech-stack write-up for this project (not an open question — treated as locked, same authority as CONTEXT.md decisions). Directives extracted and enforced in this research:

- **Tech stack is locked:** Astro `^7.2.10`, Tailwind CSS `^4.3.3` via `@tailwindcss/vite` (never `@astrojs/tailwind` — explicitly deprecated, must not be installed), `@astrojs/vercel` `^11.0.9` (for the `staticHeaders`/CSP bridge — this research recommends deferring its *installation* to Phase 5, where it's actually exercised, without contradicting the stack choice itself), `astro-icon` `^1.2.0` + `@iconify-json/material-symbols` `^1.2.90`, `@fontsource/*` for fonts (never a raw Google Fonts `<link>`).
- **Node.js `>=22.12.0` required** — set in `package.json` `engines` and as the Vercel project's Node version (this machine already runs v24.14.0, satisfying it).
- **`output: 'static'`** — do not switch to `server`/`hybrid`.
- **No Astro middleware for security headers** — static site, headers belong in `vercel.json` (Phase 5), not middleware.
- **Reach for vanilla JS / lightweight solutions before a UI framework** — not directly applicable to Phase 1 (no interactivity in this phase), but constrains later phases' architecture built on this foundation.
- **Content Collections must use the `glob()` loader (Content Layer API)**, not the legacy `type: 'content'` API — confirmed current via this research's own Astro docs fetch (Pitfall 1).
- **A contact form + serverless email function is explicitly forbidden** — not relevant to Phase 1's scope, noted for completeness since it constrains the `src/data/site.ts` singleton shape (no form-related fields).
- CLAUDE.md flagged its own TypeScript version guidance as "LOW-MEDIUM confidence, re-verify at implementation time" — this research does that re-verification (see Standard Stack, Pitfall 3) and **corrects** the recommendation to `typescript@^6.0.3`, since the npm `latest` tag (`7.0.2`) is incompatible with `@astrojs/check`'s peer range.

## Summary

Phase 1 is pure plumbing: no UI renders, so the risk is entirely in getting exact, current syntax right for four mechanical wiring tasks — Tailwind v4 CSS-first `@theme` tokens, self-hosted fonts via `@fontsource/*`, self-hosted icons via `astro-icon`, and an Astro Content Layer `projects` collection with a Zod schema (including the `image()` helper). All core package versions named in `CLAUDE.md` were re-verified live against the npm registry today and are current (`astro@7.2.10`, `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `astro-icon@1.2.0`, `@iconify-json/material-symbols@1.2.90`, `@fontsource/inter|lexend|jetbrains-mono@5.3.0`). One real discrepancy was found and must be corrected: `CLAUDE.md` flags TypeScript version selection as "LOW-MEDIUM confidence, re-verify" — re-verification shows the npm `latest` dist-tag for `typescript` is genuinely `7.0.2`, but `@astrojs/check`'s published `peerDependencies` cap TypeScript at `^5.0.0 || ^6.0.0`. Installing `typescript@latest` would create a real peer-dependency conflict; the correct pin is `typescript@^6.0.3` (current latest release inside `@astrojs/check`'s supported range).

Two packages named in `CLAUDE.md`'s broader stack table are out of scope for *this* phase specifically: `@astrojs/vercel` (needed for `staticHeaders`/CSP, but that work is Phase 5 per `REQUIREMENTS.md` traceability — SEC-02/03/04 and DEPLOY-01/02) and `@astrojs/sitemap` (SEO-03 is Phase 4). Installing them now doesn't break anything, but it's dependency surface Phase 1's own success criteria don't require — recommend deferring both to keep the phase's install list minimal and its verification story ("zero external origins, tokens wired, one schema validates") uncluttered.

The other substantive finding is about the Material Symbols icon glyphs named in `01-CONTEXT.md`/`01-UI-SPEC.md`. The prototype's variable icon font used `font-variation-settings: 'FILL' 0` (outlined) vs `'FILL' 1` (filled) — a continuous-axis trick that does not exist for static SVG icon sets. Querying the live Iconify search API for all 7 required glyphs (`menu`, `arrow_forward`, `open_in_new`, `code`, `work`, `mail`, `chat`) shows that 4 of them (`menu`, `arrow-forward`, `open-in-new`, `code`) have only **one** glyph shape in `material-symbols` regardless of fill (no `-outline` variant exists), and the 3 that do have a filled/outlined pair (`work`, `mail`, `chat`) follow Iconify's convention of **base name = filled, `-outline` suffix = outlined**. Since the prototype uses FILL 1 (filled) for exactly those 3 icons in the Contact section, all 7 required icons in this project resolve to their **base `material-symbols:` name with no suffix** — there is no need to reference any `-outline` variant anywhere in this project's icon set.

**Primary recommendation:** Scaffold with `npm create astro@latest` (TypeScript strict template, no starter theme), then manually add `@tailwindcss/vite` (not `astro add tailwind`, to avoid the deprecated `@astrojs/tailwind` auto-install path), `astro-icon` + `@iconify-json/material-symbols`, and the three `@fontsource/*` packages. Define all DESIGN.md tokens in `src/styles/global.css` under a single `@theme { }` block using Tailwind v4's double-hyphen modifier syntax (`--text-{name}--line-height`, `--text-{name}--letter-spacing`, `--text-{name}--font-weight`) — not a JS-array/tuple, which is a Tailwind v3 pattern that does not translate literally into CSS. Define the `projects` collection in `src/content.config.ts` (not the legacy `src/content/config.ts`, which Astro 6+ no longer reads at all) using `glob()` + a schema function that destructures `{ image }`.

## Architectural Responsibility Map

This is a purely static site (`output: 'static'`, no adapter-backed SSR routes, no database, no auth) — the standard 5-tier model (Browser / Frontend-SSR / API-Backend / CDN-Static / Database) doesn't have a Backend or Database tier at all in this project. Every capability in this phase resolves at **build time** and ships as static assets served from Vercel's CDN.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens (`@theme` colors/typography/spacing/radii) | CDN / Static (compiled CSS asset) | Browser / Client (utility classes applied to DOM) | Tailwind v4 compiles `@theme` into a single static CSS file at `astro build` time; Vercel serves it from the edge. No token exists at runtime as JS. |
| Font self-hosting (`@fontsource/*`) | CDN / Static | Browser / Client | Font files (WOFF2) ship as static assets in the build output; `@font-face` CSS is generated at build time — zero runtime network origin beyond the site's own domain. |
| Icon self-hosting (`astro-icon`) | Build pipeline (compile-time, no runtime tier at all) | Browser / Client (renders inlined markup) | `<Icon />` resolves to raw inline `<svg>` markup written directly into the prerendered HTML — there is no separate icon "asset" or request of any kind, not even same-origin. |
| `projects` Content Collection + Zod schema | Build pipeline / Content Layer (compile-time only) | — | Astro's Content Layer reads Markdown/frontmatter files from the repo filesystem and validates them against the Zod schema during `astro build`/`astro dev`; output becomes static page data. There is no runtime database — this is the closest static-site analogue to a "data tier," but it produces zero runtime queries. |
| `src/data/site.ts` singleton config (D-02) | Build pipeline | — | Plain TypeScript module imported at build time; becomes part of static HTML output. No runtime fetch, no API route. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| `astro` | `7.2.10` | Site framework, static build, Content Layer | Already locked (CLAUDE.md, project decision). `[VERIFIED: npm registry, 2026-09-02]` — `npm view astro version` returns `7.2.10`, matching CLAUDE.md exactly. |
| `tailwindcss` | `4.3.3` | Utility-first CSS engine, CSS-first `@theme` config | `[VERIFIED: npm registry]` — matches CLAUDE.md. |
| `@tailwindcss/vite` | `4.3.3` | Official Vite plugin integrating Tailwind v4 into Astro's build | `[VERIFIED: npm registry]`. Must stay on the exact same major.minor as `tailwindcss` core — they ship from the same release train. `[CITED: tailwindcss.com/docs/installation/framework-guides/astro]` confirms this is the documented Astro integration path (not `astro add tailwind`, which historically installed the now-deprecated `@astrojs/tailwind`). |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro-icon` | `1.2.0` | `<Icon />` component, build-time inline SVG | `[VERIFIED: npm registry]`. Peer requirement `node >= 22.12.0` `[VERIFIED: npm view astro-icon engines]` — matches this machine's Node 24.14.0. |
| `@iconify-json/material-symbols` | `1.2.90` | Full Material Symbols glyph set consumed by `astro-icon` | `[VERIFIED: npm registry]`. slopcheck flagged an informational (not blocking) `NO_REPO` signal — see Package Legitimacy Audit. |
| `@fontsource/inter` | `5.3.0` | Self-hosted Inter (body text, weights 400/500/600/700) | `[VERIFIED: npm registry]` |
| `@fontsource/lexend` | `5.3.0` | Self-hosted Lexend (headings/display, weights 400/500/600/700/800) | `[VERIFIED: npm registry]` |
| `@fontsource/jetbrains-mono` | `5.3.0` | Self-hosted JetBrains Mono (labels/code, weights 400/500/700) | `[VERIFIED: npm registry]` |
| `@astrojs/check` | `0.9.10` | `astro check` — type-checks `.astro` files, validates schemas | `[VERIFIED: npm registry]`. **Peer dependency caps TypeScript:** `{"typescript": "^5.0.0 || ^6.0.0"}` `[VERIFIED: npm view @astrojs/check peerDependencies]` — see Common Pitfalls #3. |
| `typescript` | `^6.0.3` (NOT `latest`/`7.0.2`) | Type-checking | `[VERIFIED: npm registry]` — `npm view typescript dist-tags` shows `latest: 7.0.2`, but `6.0.3` is the newest release inside `@astrojs/check`'s supported peer range. **This corrects CLAUDE.md's flagged-as-uncertain TS version guidance.** |

**Deferred — not installed in this phase (structurally out of scope, see Summary):**

| Library | Deferred to | Reason |
|---------|-------------|--------|
| `@astrojs/vercel` | Phase 5 | Needed for `staticHeaders`/CSP → `vercel.json` bridge, which is SEC-02/03 scope, not SEC-01. |
| `@astrojs/sitemap` | Phase 4 | Maps to SEO-03, not this phase's SEC-01. |
| `prettier-plugin-astro`, `eslint-plugin-astro` | Claude's discretion (per CONTEXT.md) | Dev-ergonomics tooling, not required by any of Phase 1's 3 success criteria. Optional to add now if the executor wants formatting/linting from day one; does not block any acceptance check either way. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource/*` (locked, D-01) | Astro's built-in `fontProviders.google()` | `fontProviders.google()` still self-hosts the *final* font files (no runtime Google request either), but it fetches from Google during `astro build`/CI, breaking fully-offline-reproducible builds. D-01 already rejected this — not re-litigating. |
| `astro-icon` inline SVG | Keep Material Symbols variable icon font | Rejected by design: an icon font is itself an external-origin-shaped dependency (even self-hosted, it needs `font-src`/`@font-face` wiring) and can't inline into HTML the way SVG does. Inline SVG is strictly better for SEC-01. |
| `npx astro add tailwind` | Manual `@tailwindcss/vite` install | `astro add tailwind` is the "official" quick-start command, but historically resolves to the deprecated `@astrojs/tailwind` integration on older recipes cached in some tooling. Manual install (`npm install tailwindcss @tailwindcss/vite` + hand-edit `astro.config.mjs`) is the CLAUDE.md-mandated, unambiguous path. |

**Installation:**
```bash
npm install tailwindcss @tailwindcss/vite
npm install astro-icon @iconify-json/material-symbols
npm install @fontsource/inter @fontsource/lexend @fontsource/jetbrains-mono
npm install -D @astrojs/check typescript@^6.0.3
```

**Version verification performed:** `npm view <pkg> version` run live against the npm registry on 2026-09-02 for every package above (see Standard Stack tables for individual results). `npm view @astrojs/check peerDependencies` and `npm view astro-icon engines` were also run to confirm compatibility constraints. Node on this machine: `v24.14.0` (satisfies `astro@7`'s `>=22.12.0` floor). npm: `11.13.0`.

## Package Legitimacy Audit

slopcheck `0.6.1` was available and run against every package this phase installs (`python -m slopcheck scan --pkg npm <name> --json`).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|--------------|-----------|--------------|
| `astro` | npm | not reported by slopcheck output | not reported | github.com/withastro/astro (well-known) | `[OK]` | Approved |
| `tailwindcss` | npm | not reported | not reported | github.com/tailwindlabs/tailwindcss (well-known) | `[OK]` | Approved |
| `@tailwindcss/vite` | npm | not reported | not reported | tailwindlabs/tailwindcss monorepo | `[OK]` | Approved |
| `astro-icon` | npm | not reported | not reported | not reported by tool | `[OK]` | Approved |
| `@iconify-json/material-symbols` | npm | not reported | not reported | none linked | `[OK]` with info flag: `NO_REPO` — "No source repository linked. Harder to verify what this code actually does." | Approved — flag is informational severity, not `SUS`/`SLOP`. Package is a well-known, mechanically-generated Iconify icon-data package (author: Google, per Iconify's own collection metadata fetched separately); low-risk despite the flag. |
| `@fontsource/inter` | npm | not reported | not reported | not reported | `[OK]` | Approved |
| `@fontsource/lexend` | npm | not reported | not reported | not reported | `[OK]` | Approved |
| `@fontsource/jetbrains-mono` | npm | not reported | not reported | not reported | `[OK]` | Approved |
| `@astrojs/check` | npm | not reported | not reported | github.com/withastro/astro | `[OK]` | Approved |
| `typescript` | npm | not reported | not reported | github.com/microsoft/TypeScript | `[OK]` | Approved |

No postinstall scripts were found on any of the above packages (`npm view <pkg> scripts.postinstall` returned empty for all, checked individually including transitively-bundled `sharp`).

**Packages removed due to slopcheck `[SLOP]` verdict:** none
**Packages flagged as suspicious `[SUS]`:** none (`@iconify-json/material-symbols` received an `info`-severity `NO_REPO` flag only, not `SUS`)

This slopcheck run's output does not include package age/downloads columns (only status + flags), so those two audit-table columns are marked "not reported" rather than fabricated — cross-reference npm's website directly if a numeric download/age figure is needed before approval.

## Architecture Patterns

### System Architecture Diagram

```
                     BUILD TIME (astro build / astro dev)
┌──────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  DESIGN.md tokens ──► src/styles/global.css                           │
│  (colors/type/spacing)   @theme { --color-*, --text-*, --spacing-*,   │
│                            --radius-* }          ──┐                  │
│                                                     │                  │
│  @fontsource/* imports ──► layout <style>/<script> │  Vite build      │
│  (WOFF2 files, per weight)                         │  (@tailwindcss/  │
│                                                     ├─►  vite plugin)  │
│  src/icons/ + astro-icon                           │                  │
│  <Icon name="material-symbols:menu" />  ───────────┘                  │
│  (resolves to inline <svg> at build time)                             │
│                                                                        │
│  src/content.config.ts (Content Layer)                                │
│    glob() loader reads src/content/projects/*.md                     │
│         ──► Zod schema validates each entry ──► typed collection      │
│                                                                        │
│  src/data/site.ts (typed singleton config, not rendered this phase)   │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 dist/ (fully static HTML + CSS + WOFF2, zero
                 external <link>/<script src> origins — SEC-01 gate)
                              │
                              ▼
                    Vercel CDN / static hosting (Browser tier
                    fetches only same-origin assets)
```

Every arrow above terminates at build time. There is no request-time (browser → server) arrow in this phase because no UI/routes render yet — the diagram shows the pipeline that later phases' components will sit on top of.

### Recommended Project Structure
```
src/
├── content.config.ts        # Content Layer collections definition (projects)
├── content/
│   └── projects/
│       └── placeholder-project.md   # one placeholder entry (D-03 convention)
├── data/
│   └── site.ts               # singleton typed config (D-02): identity, bio, stats, tech stack, socials
├── icons/                    # optional local custom SVGs (not needed if only using material-symbols set)
├── layouts/
│   └── (scaffolded, not populated with real markup until Phase 2/3)
├── styles/
│   └── global.css            # @import "tailwindcss"; + @theme { ...DESIGN.md tokens... }
astro.config.mjs              # vite.plugins: [tailwindcss()], integrations: [icon()]
tsconfig.json                 # extends astro/tsconfigs/strict
```

### Pattern 1: Tailwind v4 CSS-first `@theme` token block
**What:** All DESIGN.md tokens (colors, 7 typography roles, spacing, radii) defined as CSS custom properties inside a single `@theme { }` block in `src/styles/global.css`, imported once in the base layout.
**When to use:** This phase, exclusively — it's the entire deliverable for success criterion #2.
**Example:**
```css
/* Source: tailwindcss.com/docs/theme, tailwindcss.com/docs/font-size (fetched 2026-09-02) */
@import "tailwindcss";

@theme {
  /* Colors — dash-cased, matching DESIGN.md frontmatter + code.html key names 1:1 */
  --color-surface: #111417;
  --color-surface-container: #1d2023;
  --color-surface-container-high: #282a2e;
  --color-on-surface: #e1e2e7;
  --color-on-surface-variant: #b9cacb;
  --color-primary-container: #00f0ff;
  --color-on-primary-container: #006970;
  --color-outline-variant: #3b494b;
  /* ...remaining ~35 frontmatter color keys, reproduced verbatim... */

  /* Typography — font families */
  --font-display-lg: "Lexend", sans-serif;
  --font-headline-md: "Lexend", sans-serif;
  --font-body-md: "Inter", sans-serif;
  --font-mono-label: "JetBrains Mono", monospace;

  /* Typography — sizes, using the double-hyphen modifier syntax
     (NOT a JS array/tuple — that's a Tailwind v3 config-file pattern
     that does not exist in CSS-first @theme) */
  --text-display-lg: 72px;
  --text-display-lg--line-height: 80px;
  --text-display-lg--letter-spacing: -0.02em;
  --text-display-lg--font-weight: 700;

  --text-headline-md: 32px;
  --text-headline-md--line-height: 40px;
  --text-headline-md--letter-spacing: -0.01em;
  --text-headline-md--font-weight: 600;

  --text-mono-label: 14px;
  --text-mono-label--line-height: 20px;
  --text-mono-label--letter-spacing: 0.05em;
  --text-mono-label--font-weight: 500;

  /* Spacing — the 4 named DESIGN.md tokens, default 4px scale stays available */
  --spacing-unit: 8px;
  --spacing-margin-mobile: 20px;
  --spacing-gutter: 24px;
  --spacing-section-gap: 160px;

  /* Radius — DESIGN.md frontmatter `rounded` block */
  --radius-sm: 0.125rem;
  --radius-DEFAULT: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
}
```

### Pattern 2: Astro config wiring (Vite plugin + icon integration)
```javascript
// Source: tailwindcss.com/docs/installation/framework-guides/astro,
//         astroicon.dev/getting-started (fetched 2026-09-02)
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  output: "static", // Astro 7 default — kept explicit per CLAUDE.md
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Pattern 3: Self-hosted font imports (per-weight, not the bare package)
```typescript
// Source: fontsource.org/docs/getting-started/install (fetched 2026-09-02)
// In the base layout's frontmatter — imports only the weights DESIGN.md actually uses
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "@fontsource/lexend/700.css";
import "@fontsource/lexend/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
```

### Pattern 4: Icon usage (all 7 glyphs use base names — see Summary)
```astro
---
// Source: astroicon.dev/getting-started + api.iconify.design/search (live query, 2026-09-02)
import { Icon } from "astro-icon/components";
---
<Icon name="material-symbols:menu" />
<Icon name="material-symbols:arrow-forward" />
<Icon name="material-symbols:open-in-new" />
<Icon name="material-symbols:code" />
<Icon name="material-symbols:work" />
<Icon name="material-symbols:mail" />
<Icon name="material-symbols:chat" />
```

### Pattern 5: `projects` Content Collection with `image()` schema helper
```typescript
// src/content.config.ts
// Source: docs.astro.build/en/guides/content-collections/,
//         docs.astro.build/en/guides/images/ (fetched 2026-09-02)
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
      // D-05: optional, typed correctly now even though unused until Phase 3
      coverImage: image().optional(),
      // D-04: Phase-1-added fields for Phase 3 card ordering/hierarchy
      featured: z.boolean().optional(),
      order: z.number().optional(),
    }),
});

export const collections = { projects };
```

Placeholder entry (`src/content/projects/placeholder-project.md`), following D-03's marker convention:
```markdown
---
title: "[Nome do Projeto]"
description: "PLACEHOLDER — descrição do projeto a definir"
tags: ["PLACEHOLDER"]
---
```
(no `coverImage`, `liveUrl`, `repoUrl`, `featured`, or `order` — all optional, confirming the schema tolerates a minimal entry, per success criterion #3)

### Anti-Patterns to Avoid
- **Copying `code.html`'s `tailwind.config` object literally into a `tailwind.config.js`:** Tailwind v4 in this project uses zero JS config files — a `tailwind.config.js` would be silently ignored by `@tailwindcss/vite` unless explicitly loaded via `@config`, and doing so reintroduces the exact JS-config pattern this stack decision (CLAUDE.md) rejected.
- **Leaving any `<link rel="preconnect" href="https://fonts.googleapis.com">` in a copy-pasted layout head:** even without a matching stylesheet `<link>`, a bare `preconnect` still opens a DNS/TCP handshake to an external origin — technically violates SEC-01's "zero external network requests" even though no font/script actually loads. Must be removed entirely, not just the stylesheet links.
- **Referencing a `-outline` icon name that doesn't exist in `material-symbols`** (e.g. `material-symbols:menu-outline`, `material-symbols:code-outline`) — confirmed via live Iconify search that these specific glyphs have no outline variant; `astro-icon` throws a build-time error for an unresolvable icon name, which is the correct failure mode, but planning tasks should reference the verified base names directly (Pattern 4) to avoid unnecessary trial-and-error.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Font subsetting / self-hosting `@font-face` rules | Manually downloading Lexend/Inter/JetBrains Mono `.woff2` files and hand-writing `@font-face` CSS | `@fontsource/*` packages | Fontsource already ships correctly subsetted, per-weight WOFF2 files with generated `@font-face` CSS matching Google Fonts' own subsetting — hand-rolling risks missing `unicode-range`, wrong `font-display`, or bloated file sizes. |
| Icon sprite/inlining pipeline | A custom Vite plugin or build script that reads SVGs from `node_modules` and inlines them | `astro-icon` + `@iconify-json/material-symbols` | This is precisely astro-icon's job — tree-shaken, build-time SVG inlining with zero runtime cost. A hand-rolled version would need to reimplement icon resolution, caching, and tree-shaking from scratch for no benefit. |
| Frontmatter data validation | Manually parsing YAML/Markdown frontmatter and writing custom validation `if` checks | Astro Content Layer `glob()` loader + Zod `schema` | Zod gives typed, declarative validation with clear build-time error messages when a project entry is malformed — a hand-rolled parser would need to reimplement this for strictly worse DX. |

**Key insight:** Every "don't hand-roll" item in this phase is already covered by a package explicitly locked in `CLAUDE.md`/`01-CONTEXT.md` — the planning risk here isn't reinventing these tools, it's using stale/incorrect syntax for them (Tailwind v3-style config, old content-collection file location, wrong icon names). The Code Examples above are the concrete guard-rail against that.

## Common Pitfalls

### Pitfall 1: Legacy Content Collection file location
**What goes wrong:** Defining the `projects` schema in `src/content/config.ts` (the pre-Astro-5 location).
**Why it happens:** Most existing tutorials, and some AI training data, still show the old path.
**How to avoid:** Use `src/content.config.ts` at the `src/` root — mandatory as of Astro 6+; the old location is no longer read at all `[CITED: docs.astro.build/en/guides/upgrade-to/v5/, cross-referenced via WebSearch, 2026-09-02]`.
**Warning signs:** `getCollection('projects')` returns an empty array with no error, or TypeScript can't infer collection types.

### Pitfall 2: `@astrojs/tailwind` reappearing via `astro add tailwind`
**What goes wrong:** Running `npx astro add tailwind` installs the deprecated `@astrojs/tailwind` integration on some cached recipes instead of `@tailwindcss/vite`.
**Why it happens:** The command name hasn't changed even though the underlying recommended integration has (Tailwind v3 → v4 migration).
**How to avoid:** Install manually: `npm install tailwindcss @tailwindcss/vite`, hand-edit `astro.config.mjs` (Pattern 2), skip `astro add` entirely for Tailwind.
**Warning signs:** `@astrojs/tailwind` appears in `package.json` after running the add command; a `tailwind.config.mjs` (v3-style) gets scaffolded instead of a `@theme` CSS block.

### Pitfall 3: TypeScript peer-dependency conflict with `@astrojs/check`
**What goes wrong:** Installing `typescript@latest` (currently `7.0.2` on npm) alongside `@astrojs/check@0.9.10`.
**Why it happens:** npm's `latest` dist-tag moved to TypeScript 7 `[VERIFIED: npm view typescript dist-tags]`, but `@astrojs/check`'s peer range is still `^5.0.0 || ^6.0.0` `[VERIFIED: npm view @astrojs/check peerDependencies]` — a real version-skew gap between the two packages' release cadences.
**How to avoid:** Pin `typescript@^6.0.3` explicitly (verified current release inside the supported range) rather than installing the bare `typescript` package, which would resolve to `latest`.
**Warning signs:** `npm install` prints an `ERESOLVE`/peer-dependency warning, or `astro check` behaves unpredictably against untested TS 7 output.

### Pitfall 4: Tailwind v4 font-size "tuple" syntax confusion
**What goes wrong:** Porting `code.html`'s JS `fontSize: ["32px", { lineHeight: "40px", ... }]` array literally as if it were valid inside a CSS `@theme` block.
**Why it happens:** That syntax is real — but only in Tailwind v3's JS `tailwind.config.js`, which this project explicitly does not use.
**How to avoid:** In CSS-first `@theme`, each modifier is its own custom property with a double-hyphen suffix: `--text-headline-md: 32px; --text-headline-md--line-height: 40px; --text-headline-md--letter-spacing: -0.01em; --text-headline-md--font-weight: 600;` `[CITED: tailwindcss.com/docs/font-size, fetched 2026-09-02]`.
**Warning signs:** `text-headline-md` utility applies the font-size but not the line-height/letter-spacing/weight; visual output looks "close but off" compared to the prototype.

### Pitfall 5: Fontsource bare-package import only loads weight 400
**What goes wrong:** `import "@fontsource/inter";` (no weight path) is assumed to load all weights DESIGN.md specifies (400/500/600/700).
**Why it happens:** The bare import is valid syntax and doesn't error — it silently only loads the default (400) weight file.
**How to avoid:** Import each weight explicitly per Pattern 3 (`@fontsource/inter/500.css`, `/600.css`, `/700.css`, etc.) — confirmed by fontsource's own docs: "to minimize your bundle size, it is recommended to import only the specific weights and styles you need" `[CITED: fontsource.org/docs/getting-started/install]`.
**Warning signs:** Bold headings render as browser-synthesized faux-bold (slightly distorted, not the real Lexend 700 glyphs) instead of the actual font file — subtle enough to pass a casual visual check but fails strict LAY-02 fidelity later.

### Pitfall 6: `image()` schema helper requires a schema *function*, not a plain object
**What goes wrong:** Writing `schema: z.object({ coverImage: image().optional(), ... })` directly — `image` isn't in scope there.
**Why it happens:** Most non-image Content Collection examples online use the plain-object form (`schema: z.object({...})`), and it's easy to copy that shape without noticing `image()` needs the function wrapper.
**How to avoid:** `schema: ({ image }) => z.object({ coverImage: image().optional(), ... })` — the schema field must be a function that Astro calls with an `image` helper injected `[CITED: docs.astro.build/en/guides/images/, fetched 2026-09-02]`.
**Warning signs:** `ReferenceError: image is not defined` or a TypeScript error at the `content.config.ts` definition site.

### Pitfall 7: Verifying "zero external requests" by eyeballing the Network tab only
**What goes wrong:** Manually watching DevTools' Network panel during `astro dev`/`astro preview` and concluding SEC-01 passes because no failed/loaded resource appears — but a stray `<link rel="preconnect">` to an external origin (harmless-looking, loads nothing) still opens a DNS/TCP connection and technically breaches "zero external network requests."
**Why it happens:** `preconnect` tags don't show up as a loaded "resource" the way a script/stylesheet does, so a quick visual Network-tab scan misses them.
**How to avoid:** After `astro build`, grep the static output for any off-origin reference: `grep -rn "fonts.googleapis\|fonts.gstatic\|cdn.tailwindcss\|material-symbols" dist/` should return nothing, and `grep -rn '<link[^>]*href="https\?://' dist/` / `grep -rn '<script[^>]*src="https\?://' dist/` should also return nothing. This is a deterministic, automatable check the planner should turn into a verification task rather than relying on manual DevTools inspection alone.
**Warning signs:** A `dist/` grep for `googleapis`/`gstatic` returns a hit even though the page "looks fine" in preview.

## Code Examples

See Architecture Patterns above (Patterns 1–5) — all five are verified, ready-to-use code, not illustrative pseudocode.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---------------|-------------------|----------------|--------|
| `src/content/config.ts` (legacy collections API) | `src/content.config.ts` + `glob()` loader (Content Layer API) | Astro 5.0 (introduced), mandatory-only as of Astro 6+ | Old location silently stops being read — a project scaffolded from an old tutorial would build with zero collections and no error. |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` plugin | Tailwind v4 release (integration officially deprecated per its own npm README) | `@astrojs/tailwind` install still succeeds (no hard error) but wires nothing useful for v4's CSS-first `@theme` model. |
| Astro CSP as an `experimental.csp` flag | Stable `security.csp` config | Astro 6.0 | Not consumed in this phase (Phase 5 scope), but confirms `CLAUDE.md`'s claim that the CSP API is stable in the pinned Astro version `[CITED: docs.astro.build/en/reference/experimental-flags/csp/, fetched 2026-09-02]`. |
| Tailwind v3 JS `fontSize: [value, {...}]` tuple config | Tailwind v4 CSS `--text-{name}` + `--text-{name}--{modifier}` custom properties | Tailwind v4 release | Directly relevant to reproducing `code.html`'s type scale — see Pitfall 4. |

**Deprecated/outdated:**
- `@astrojs/tailwind`: officially deprecated per its own npm README banner (confirmed in `CLAUDE.md`'s existing research); do not install.
- Legacy Content Collections `type: 'content'`/`src/content/config.ts`: unsupported location as of Astro 6+.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Material Symbols FILL 0/FILL 1 variable-font distinction maps to Iconify's base-name(filled)/`-outline`-suffix(outlined) convention, and specifically that all 7 required glyphs (`menu`, `arrow_forward`, `open_in_new`, `code`, `work`, `mail`, `chat`) resolve to their bare base name with no suffix. Derived by querying the live `api.iconify.design/search` endpoint and reasoning about which glyphs have a second variant — not an explicit statement from official astro-icon or Iconify documentation. | Architecture Patterns (Pattern 4), Anti-Patterns | Low — if a name is wrong, `astro-icon` fails the build loudly (unresolvable icon name) rather than silently rendering the wrong glyph; worst case is a few minutes of trial-and-error correcting one icon name during Phase 2/3 implementation, not a data-integrity or security issue. |
| A2 | `import { defineCollection, z } from "astro:content"` is the current canonical import path for the Zod re-export in a schema file (vs. `import { z } from "astro/zod"`, also reportedly valid). Based on WebSearch synthesis of community sources, not a directly fetched official-docs statement pinning one path as canonical. | Architecture Patterns (Pattern 5) | Low — both import paths reportedly work; if wrong, TypeScript/the build reports a missing-export error immediately at `content.config.ts`, caught before any other work depends on it. |

**If confirmed wrong:** Both assumptions fail fast and loudly at build time (never silently ship wrong behavior), so no additional human-verification checkpoint is strictly required before implementation — but the planner may still want a quick manual glyph-name sanity check against `icon-sets.iconify.design/material-symbols` before finalizing Phase 2/3 icon-consuming tasks, since A1 spans into those phases.

## Open Questions (RESOLVED)

1. **Should `@astrojs/vercel` be installed in this phase even though it isn't strictly required until Phase 5?**
   - What we know: Phase 1's 3 success criteria (zero external origins, tokens wired, one schema validates) don't require an adapter at all — `output: 'static'` with no adapter still builds and previews fine locally.
   - What's unclear: Whether the project owner wants deploy-target wiring done incrementally per-phase (this research's recommendation) or established once, early, to avoid touching `astro.config.mjs` again later.
   - RESOLVED: Defer to Phase 5, per `REQUIREMENTS.md`'s own traceability table (SEC-02/03, DEPLOY-01/02 → Phase 5). Keeps this phase's dependency footprint and verification story minimal, consistent with `mode: mvp` / `granularity: coarse`. Confirmed applied — 01-01-PLAN.md does not install `@astrojs/vercel`.

2. **Package manager choice (npm/pnpm/yarn) for `npm create astro@latest` scaffolding.**
   - What we know: `01-CONTEXT.md` explicitly delegates "package manager and other purely technical setup choices" to Claude's discretion. This machine has npm `11.13.0` available and working; no pnpm/yarn was probed.
   - What's unclear: No stated preference either way.
   - RESOLVED: Default to npm (already verified present, matches all `npm view` commands used throughout this research, zero extra setup). Confirmed applied — all three plans use npm throughout.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Astro 7 build/dev (`engines: >=22.12.0`) | ✓ | v24.14.0 | — |
| npm | Package install/scripts | ✓ | 11.13.0 | — |
| git | Version control, already an initialized repo | ✓ | (repo confirmed present) | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — this phase has no external service dependency (no database, no Docker, no deploy target probing needed; Vercel CLI/deploy is Phase 5 scope).

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json` (absent from `workflow` block → treated as enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|-----------------|---------|---------------------|
| V2 Authentication | No | No auth exists or is planned anywhere in this project (`REQUIREMENTS.md` "Out of Scope"). |
| V3 Session Management | No | No sessions — fully static site, no cookies set by this phase. |
| V4 Access Control | No | No access-controlled resources; every page is public. |
| V5 Input Validation | Yes | Zod schema (`content.config.ts`) validates every `projects` entry at build time — this *is* this phase's input-validation control, applied to repo-authored content rather than user input, since there is no user input in this project at all. |
| V6 Cryptography | No | No cryptographic operations in this phase. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Third-party script/font/icon origins (tracking exposure, availability dependency on an external CDN, mixed-origin trust) | Information Disclosure | Self-host everything at build time (Tailwind compiled CSS, `@fontsource` WOFF2, `astro-icon` inline SVG) — this is SEC-01, this phase's one mapped requirement. |
| Supply-chain risk / hallucinated or typosquatted npm package | Tampering | Package Legitimacy Gate (slopcheck + `npm view` registry check) run against every package before recommending it — see Package Legitimacy Audit above. |
| XSS via unsanitized `set:html` rendering of content-sourced strings | Tampering | Not used anywhere in this phase (no rendering happens at all yet). Forward-looking note for Phase 3: Content Collection string fields (`title`, `description`) should render via normal Astro expression interpolation (`{project.data.title}`), never `set:html`, since they're Zod-typed strings, not pre-sanitized HTML. |
| Content Collection schema drift silently corrupting build output | Tampering (data integrity) | Zod's `schema` enforcement makes malformed frontmatter a hard build failure (`astro build`/`astro dev` throws), not a silent bad-data pass-through — this is the desired behavior, not a gap to close. |

## Sources

### Primary (HIGH confidence)
- `npm view <package> version/engines/peerDependencies/dist-tags` — live npm registry queries, 2026-09-02, for: `astro`, `@astrojs/vercel`, `tailwindcss`, `@tailwindcss/vite`, `astro-icon`, `@iconify-json/material-symbols`, `@fontsource/inter`, `@fontsource/lexend`, `@fontsource/jetbrains-mono`, `@astrojs/sitemap`, `@astrojs/check`, `typescript`, `prettier-plugin-astro`, `eslint-plugin-astro`, `sharp`.
- `api.iconify.design/search` — live Iconify search API queries, 2026-09-02, for all 7 required Material Symbols glyph names and their filled/outline variants.
- slopcheck `0.6.1` — live package legitimacy scan, 2026-09-02, all 11 phase-relevant packages.
- [Tailwind CSS `@theme` reference](https://tailwindcss.com/docs/theme), [`font-size` reference](https://tailwindcss.com/docs/font-size), [Astro framework guide](https://tailwindcss.com/docs/installation/framework-guides/astro) — official docs, fetched 2026-09-02.
- [Astro Content Collections guide](https://docs.astro.build/en/guides/content-collections/), [Astro Images guide](https://docs.astro.build/en/guides/images/), [Astro CSP experimental-flags reference](https://docs.astro.build/en/reference/experimental-flags/csp/), [Astro Vercel adapter guide](https://docs.astro.build/en/guides/integrations-guide/vercel/) — official docs, fetched 2026-09-02.
- [astro-icon Getting Started](https://www.astroicon.dev/getting-started/), [Fontsource install guide](https://fontsource.org/docs/getting-started/install) — official package docs, fetched 2026-09-02.
- Local files read directly: `Arquivos de design/DESIGN.md` (frontmatter tokens, canonical), `Arquivos de design/code.html` (prototype `tailwind.config`, icon usage, Google Fonts URL weight query strings), `.planning/phases/01-foundation-design-system/01-CONTEXT.md`, `.planning/phases/01-foundation-design-system/01-UI-SPEC.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`, `./CLAUDE.md`.

### Secondary (MEDIUM confidence)
- WebSearch: Astro `content.config.ts` vs `src/content/config.ts` location history — cross-referenced against the official Astro v5 upgrade guide link surfaced in results; consistent with the primary-source `docs.astro.build` fetch above.
- WebSearch: Iconify material-symbols naming convention (`-outline` suffix pattern) — corroborated by the live `api.iconify.design/search` API query (Primary), used together to reach the A1 conclusion in the Assumptions Log.

### Tertiary (LOW confidence)
- WebSearch: Zod `z` import path (`astro:content` vs `astro/zod`) — ambiguous synthesis across community sources, not resolved against a single authoritative statement; flagged as A2 in Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack (versions/compatibility): HIGH — every version and peer-dependency claim was verified live against the npm registry today, not sourced from training data.
- Architecture (Tailwind `@theme`, Content Layer, icon/font wiring): HIGH — all five code patterns were fetched from current official documentation today, not reconstructed from training knowledge.
- Pitfalls: HIGH for pitfalls 1–6 (each backed by an official-docs fetch or a live registry/API check); MEDIUM for pitfall 7's specific verification-command recommendation (methodology is sound but the exact grep patterns are this researcher's synthesis, not a documented Astro/SEC-01-specific procedure).

**Research date:** 2026-09-02
**Valid until:** ~2026-10-02 (30 days) — this stack moves fast (Astro shipped two major versions in 2026 already per CLAUDE.md's own notes); re-verify npm versions if planning is delayed past that window, especially the `typescript`/`@astrojs/check` peer-range pairing, which is the most likely to drift.
