# Architecture Research

**Domain:** Astro-based static personal developer portfolio (single-page, content-collection-driven)
**Researched:** 2026-09-02
**Confidence:** HIGH (Astro/Tailwind mechanics via official docs) / MEDIUM (Vercel header config, not Astro-specific)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BUILD-TIME LAYER (Astro)                      │
├──────────────────────────────────────────────────────────────────────┤
│  astro.config.mjs                                                    │
│   ├─ @tailwindcss/vite plugin (Tailwind v4)                          │
│   ├─ astro:config fonts[] (Fonts API — self-hosts Google Fonts)      │
│   └─ output: 'static' (no adapter required; Vercel builds it)        │
├──────────────────────────────────────────────────────────────────────┤
│  src/styles/global.css        src/data/site.ts     src/content.config.ts │
│   @theme design tokens          placeholder/config    projects collection │
│   (DESIGN.md → CSS vars)        (name, bio, stats,     schema (zod + image())│
│                                  stack, socials, nav)                  │
├────────────┬───────────────────────┬──────────────────┬─────────────┤
│            │                       │                  │             │
│   src/layouts/BaseLayout.astro (head, fonts, grid/glow bg, <slot/>)  │
│            │                       │                  │             │
├────────────┴───────────────────────┴──────────────────┴─────────────┤
│  src/components/  (presentational, consume site.ts or props)         │
│  ┌────────┐ ┌──────┐ ┌─────────┐ ┌───────┐ ┌──────────┐ ┌─────────┐ │
│  │  Nav   │ │ Hero │ │ Dossier │ │ Stack │ │ Projects │ │ Contact │ │
│  └────────┘ └──────┘ └─────────┘ └───┬───┘ └────┬─────┘ └─────────┘ │
│                                       │          │  ┌────────┐       │
│                                       │          └─▶│ProjectCard│(×N)│
│  ┌────────┐                          │             └────────┘       │
│  │ Footer │                          │                               │
│  └────────┘                          │                               │
├───────────────────────────────────────────────────────────────────────┤
│  src/content/projects/*.md(x)  ──▶  getCollection('projects')       │
│  (placeholder entries now, real content later — same shape)          │
├───────────────────────────────────────────────────────────────────────┤
│  src/pages/index.astro  — composes BaseLayout + sections in order    │
└──────────────────────────────┬────────────────────────────────────────┘
                                │  astro build (SSG)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       OUTPUT / DEPLOY LAYER                          │
│  dist/ (static HTML/CSS/JS, optimized images)  +  vercel.json        │
│  (security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy,     │
│   Permissions-Policy) → Vercel static hosting + CDN + HTTPS          │
└──────────────────────────────────────────────────────────────────────┘
```

This is a **fully static site** (SSG). There is no server runtime, no API routes, no client-side data fetching, and — per the "no contact form" constraint — no form submission surface. Nearly everything happens at `astro build` time. The only client-side JavaScript needed is a small vanilla `<script>` for the mobile nav toggle; there is no case for React/Vue/Svelte islands in this project.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| `BaseLayout.astro` | HTML shell: `<head>` (meta, fonts, favicon, SEO tags), global background layers (grid pattern, glow clouds), wraps page content in `<slot />` | Astro layout component, imported once per page |
| `Nav.astro` | Fixed top nav: logo/wordmark, anchor links to sections (#dossier, #stack, #projects, #contact), "Connect" CTA, mobile menu toggle | Astro component + tiny inline `<script>` for mobile toggle (no framework island) |
| `Hero.astro` | Above-the-fold identity: status badge, name/title, tagline, CTA to #projects | Astro component, pulls copy from `site.ts` |
| `Dossier.astro` | Bio/about text + "System Specs" stat list (experience, focus, domain) | Astro component, pulls bio + stats array from `site.ts` |
| `Stack.astro` | Tech stack grid, 3 categories (Languages/Frameworks/Infrastructure) | Astro component, iterates a `stack` config array (category → tags[]) from `site.ts` |
| `Projects.astro` | Section shell + data query: calls `getCollection('projects')`, sorts/filters, maps entries to `ProjectCard` | Astro component; **owns** the content-collection query (self-contained section) |
| `ProjectCard.astro` | Renders one project: cover image, title, description, tech tags, conditional Live/Repo links | Presentational component, takes typed props (from collection entry `data`), no data fetching of its own |
| `Contact.astro` | CTA panel with social/contact icon links (GitHub, LinkedIn, email, etc.) | Astro component, pulls links array from `site.ts` |
| `Footer.astro` | Copyright line + secondary link list | Astro component, pulls same social links + current year |
| `src/data/site.ts` | Single source of truth for all placeholder/real copy: name, title, bio, stats, nav items, stack categories, social links | Typed TS module (`export const site = {...} as const`), imported directly — not a content collection (no Markdown body needed) |
| `src/content.config.ts` | Defines the `projects` collection loader + zod schema (title, description, tags, cover image, liveUrl?, repoUrl?) | `glob()` loader over `src/content/projects/*.md`, `image()` helper for cover art |

## Recommended Project Structure

```
src/
├── assets/                 # Images imported by src/ code (processed by astro:assets)
│   └── projects/           # Cover images for placeholder + real projects
├── components/             # Reusable/section Astro components (see table above)
│   ├── Nav.astro
│   ├── Hero.astro
│   ├── Dossier.astro
│   ├── Stack.astro
│   ├── Projects.astro
│   ├── ProjectCard.astro
│   ├── Contact.astro
│   └── Footer.astro
├── content/
│   └── projects/           # One .md(x) file per project (placeholder now, real later)
│       ├── neural-engine.md
│       ├── vault-x.md
│       └── omni-stream.md
├── content.config.ts       # defineCollection({ loader: glob(...), schema: ... })
├── data/
│   └── site.ts             # Centralized placeholder/config data (name, bio, stats, stack, socials, nav)
├── layouts/
│   └── BaseLayout.astro    # <head>, fonts, background layers, <slot/>
├── pages/
│   └── index.astro         # Single page: composes layout + all sections in order
├── styles/
│   └── global.css          # `@import "tailwindcss";` + `@theme { ... }` design tokens
public/
├── favicon.svg
└── robots.txt
astro.config.mjs            # Tailwind v4 vite plugin, Fonts API config, output: 'static'
vercel.json                 # Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
```

### Structure Rationale

- **`src/data/site.ts` over scattering strings in components:** PROJECT.md explicitly requires placeholders to be "centralized... not scattered across markup" so real content can replace them later without touching component code. A typed config module is the simplest mechanism — no need for a content collection singleton since this data has no Markdown body, just structured fields.
- **`src/content/projects/` as a Content Collection, not `site.ts`:** Projects are repeatable, have long-form Markdown bodies (description could grow), and match Astro's Content Collections use case exactly (structured + type-safe + easy to add/remove entries as files). This is also an explicit project requirement.
- **`ProjectCard.astro` split out from `Projects.astro`:** keeps the data-fetching section component (`Projects.astro`) separate from the pure-presentation card, matching the prototype's implicit "card" component boundary and making it trivial to reuse the card elsewhere later (e.g., a "featured projects" widget) without duplicating markup.
- **`src/layouts/BaseLayout.astro` even for a single page:** the prototype's `<head>` (fonts, meta, background atmosphere layers) is substantial enough to warrant isolation; it also gives a natural seam if a 404 page or future project detail page is added later.
- **No `src/pages/projects/[slug].astro`:** the requirements only call for cards linking out to *external* live/repo URLs, not internal project detail pages — building one now would be premature scope. The collection schema should still be written in a way that doesn't block adding a `slug`/detail page later (see Anti-Patterns).

## Architectural Patterns

### Pattern 1: Design tokens as Tailwind v4 `@theme` CSS variables

**What:** `Arquivos de design/DESIGN.md` and `code.html` express the design system as a Tailwind **v3-style JS config object** (`tailwind.config` with `extend.colors`, `fontFamily`, `fontSize`, `borderRadius`, `spacing`). Current Astro + Tailwind integration uses **Tailwind v4**, which is configured via the **`@theme` directive inside CSS**, not a JS config file. The `@astrojs/tailwind` integration (which supported the old JS-config pattern) is deprecated; the official path is the `@tailwindcss/vite` plugin.
**When to use:** Always, for this project — translate every token category from the DESIGN.md frontmatter (colors, typography, rounded, spacing) into `--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--spacing-*` CSS custom properties inside a single `@theme` block in `src/styles/global.css`.
**Trade-offs:** No `tailwind.config.mjs` to maintain (less indirection, tokens live next to the CSS that uses them); but it means literally transcribing the DESIGN.md palette/typography table by hand into CSS variable names — do this once, carefully, as the very first implementation step, since every component's utility classes (`bg-surface-container`, `text-primary-container`, `font-mono-label`, `rounded-DEFAULT`, etc.) depend on these names matching exactly what the prototype's `tailwind.config` block already defines.

**Example:**
```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  /* Colors — from DESIGN.md `colors:` block */
  --color-background: #111417;
  --color-on-background: #e1e2e7;
  --color-surface-container: #1d2023;
  --color-surface-container-lowest: #0c0e12;
  --color-primary-container: #00f0ff;
  --color-on-primary-container: #006970;
  --color-outline-variant: #3b494b;
  /* ...remaining tokens from DESIGN.md colors: block */

  /* Typography */
  --font-display: "Lexend", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-body: "Inter", sans-serif;

  /* Spacing (DESIGN.md spacing:) */
  --spacing-gutter: 24px;
  --spacing-margin-mobile: 20px;
  --spacing-section-gap: 160px;

  /* Radius (DESIGN.md rounded:) */
  --radius-DEFAULT: 0.25rem;
  --radius-lg: 0.5rem;
}
```
Astro-side wiring:
```js
// astro.config.mjs
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  fonts: [
    { name: 'Lexend', cssVariable: '--font-lexend', provider: fontProviders.google() },
    { name: 'Inter', cssVariable: '--font-inter', provider: fontProviders.google() },
    { name: 'JetBrains Mono', cssVariable: '--font-jetbrains-mono', provider: fontProviders.google() },
  ],
});
```

### Pattern 2: Content Collections for repeatable project entries

**What:** Define one `projects` collection with a `glob()` loader over `src/content/projects/*.md` and a zod schema mirroring the fields the prototype's card markup already needs (title, description, tags, cover image, optional live/repo URLs).
**When to use:** For any content that repeats (project 1..N) and benefits from type safety + easy editing as separate files — exactly the "projects" requirement in PROJECT.md.
**Trade-offs:** Slightly more ceremony than a plain array in `site.ts`, but gives frontmatter validation (catches typos/missing fields at build time) and keeps `Projects.astro` decoupled from how many projects exist.

**Example:**
```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    cover: image(),
    coverAlt: z.string(),
    liveUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    order: z.number().default(0), // manual sort control, since file order isn't guaranteed
  }),
});

export const collections = { projects };
```
```astro
---
// src/components/Projects.astro
import { getCollection } from 'astro:content';
import ProjectCard from './ProjectCard.astro';

const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
---
<section id="projects" class="scroll-mt-32">
  <h2>PROJECTS</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    {projects.map((p) => <ProjectCard {...p.data} />)}
  </div>
</section>
```

### Pattern 3: Zero-JS-by-default, no framework islands for this project

**What:** Astro's islands architecture (`client:load`, `client:visible`, etc.) exists to hydrate interactive UI framework components (React/Vue/Svelte). This portfolio has exactly one interactive behavior (mobile nav toggle) and no state, forms, or data mutation.
**When to use:** Reach for a framework island only if a genuinely stateful, complex interaction is added later (e.g., a filterable/searchable project grid). For the current scope, use a plain `<script>` tag inside `Nav.astro` to toggle a mobile menu class — Astro ships this with zero extra JS framework runtime.
**Trade-offs:** Keeps bundle size near-zero (aligned with the "simplicity by default" stack constraint) but means resisting the temptation to add React "just for a dropdown."

## Data Flow

### Placeholder/Config Data Flow

```
src/data/site.ts (name, title, bio, stats, stack categories, nav items, social links)
    ↓ (direct import, build-time only)
Nav.astro · Hero.astro · Dossier.astro · Stack.astro · Contact.astro · Footer.astro
    ↓ (Astro renders to static HTML at build)
dist/index.html
```
One-directional, no runtime fetch. When real content is ready, only `site.ts` values change — no component code changes needed (this is the mechanism that satisfies PROJECT.md's "placeholders centralized, easy to swap" constraint).

### Project Content Flow

```
src/content/projects/*.md (frontmatter: title, description, tags, cover, links)
    ↓ validated against zod schema in content.config.ts (build-time)
getCollection('projects')  [called inside Projects.astro]
    ↓ sort by `order` field
Projects.astro maps entries → <ProjectCard {...data} />
    ↓
ProjectCard.astro renders <Image src={cover}> (astro:assets, optimized) + title/description/tags/links
    ↓ (static HTML output)
dist/index.html (#projects section)
```
Adding/editing/removing a project = add/edit/remove a Markdown file. No component touches the collection except `Projects.astro`; `ProjectCard.astro` never imports `astro:content` directly (keeps it reusable/testable as pure presentation).

### Key Data Flows

1. **Design tokens → Tailwind utility classes:** `@theme` variables in `global.css` generate the utility classes (`bg-surface-container`, `text-primary-container`, etc.) that every component's `class` attribute references. This flow must exist *before* any component is written, or class names will silently fail to resolve to the intended colors.
2. **Content Collection → Projects grid:** described above — the only "N-many" data flow in the app; everything else is 1:1 static config.
3. **Fonts config → self-hosted font files:** Astro's Fonts API (`fonts: [...]` in `astro.config.mjs`) downloads Google Fonts (Lexend, Inter, JetBrains Mono) at build time and serves them from the same origin, exposed as `--font-*` CSS variables consumed by the `@theme` block — replacing the prototype's `<link href="fonts.googleapis.com">` tags, which would otherwise require CSP `connect-src`/`font-src` allowances for third-party origins.

## Scaling Considerations

This is a static personal portfolio; traffic/scale is not a realistic architectural concern. The relevant "scale" axis is **content volume** (number of projects) and **build/asset performance**, not concurrent users.

| Scale | Architecture Adjustments |
|-------|---------------------------|
| 1–10 projects (expected) | Current structure (flat `src/content/projects/*.md`, single-page grid) is sufficient as-is. |
| 10–30 projects | Still fine; consider adding a `featured: boolean` field to schema to cap Hero/above-fold cards and move the rest below a "show more" or a dedicated `/projects` page. |
| 30+ projects / need for individual case-study pages | Add `src/pages/projects/[slug].astro` using `getStaticPaths()` over the same collection — the schema proposed above (with `order`, without hardcoded routing assumptions) does not need to change to support this later. |

### Scaling Priorities

1. **First (and only realistic) bottleneck:** unoptimized images (project covers, hero/background art) inflating page weight. Mitigate by always going through `astro:assets`'s `<Image />` (automatic WebP/AVIF, responsive sizes) instead of raw `<img>` or CSS `background-image: url(...)` as the prototype does.
2. **Second:** font payload from including too many weights/styles. Mitigate by only specifying the weights actually used (DESIGN.md typography table lists exact weights per role: 700/600 for Lexend, 400 for Inter, 400/500 for JetBrains Mono) in the Fonts API config, not the full variable range.

## Anti-Patterns

### Anti-Pattern 1: Porting the prototype's Tailwind CDN `tailwind.config` object as-is

**What people do:** Copy the `tailwind.config` `<script>` block from `code.html` verbatim into an Astro project, assuming it "just works."
**Why it's wrong:** That config targets the Tailwind **CDN runtime** (JIT-in-browser, v3-style JS config). The current, non-deprecated Astro integration path is **Tailwind v4 via `@tailwindcss/vite`**, which reads tokens from a CSS `@theme` block, not a JS object. A JS `tailwind.config.js` will silently be ignored (or require the deprecated `@astrojs/tailwind` + Tailwind v3, which is explicitly documented as deprecated).
**Do this instead:** Transcribe every token from DESIGN.md's frontmatter into `@theme` CSS variables (Pattern 1) using Tailwind v4 + `@tailwindcss/vite`.

### Anti-Pattern 2: Loading Google Fonts via `<link>` tags to `fonts.googleapis.com`

**What people do:** Copy the prototype's `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` tags directly into `BaseLayout.astro`.
**Why it's wrong:** Adds two third-party origins to the critical rendering path (extra DNS/TLS handshakes, ~100–300ms), leaks visitor IP to Google on every page load, and forces the CSP (a hard project requirement) to allowlist `fonts.googleapis.com`/`fonts.gstatic.com` in `style-src`/`font-src` — weakening an otherwise tight policy for no real benefit.
**Do this instead:** Use Astro's built-in Fonts API (`fontProviders.google()`), which downloads and self-hosts the font files at build time and serves them same-origin (Pattern 3 in Data Flow section above).

### Anti-Pattern 3: Reaching for a UI framework (React/Vue) "to be safe" for interactivity

**What people do:** Add `@astrojs/react` and a `client:load` component for the mobile menu toggle or hover effects "in case more interactivity is needed later."
**Why it's wrong:** Ships an entire framework runtime for a feature that's a single class toggle; directly contradicts the explicit stack constraint ("Astro... adding complexity only when necessary").
**Do this instead:** Use a plain `<script>` in `Nav.astro` (vanilla DOM APIs) for the mobile menu; only introduce a framework + island if a future feature genuinely needs client-side state.

### Anti-Pattern 4: Scattering placeholder copy across every component file

**What people do:** Hardcode `"SYSTEM_ARCHITECT"`, bio paragraphs, stat numbers, and social URLs directly inside `Hero.astro`, `Dossier.astro`, `Contact.astro`, `Footer.astro`, etc., planning to "find and replace" later.
**Why it's wrong:** PROJECT.md explicitly calls for placeholders to be centralized "ideally in Content Collections / config data, not scattered through markup" — scattering means the final content pass touches N files and risks missed/inconsistent replacements (e.g., name repeated in Nav, Hero, and Footer).
**Do this instead:** Centralize all non-project copy in `src/data/site.ts` (Structure Rationale above); components only reference `site.xxx` fields.

### Anti-Pattern 5: Using remote placeholder image URLs (as the prototype does) in the shipped project

**What people do:** Keep the prototype's `lh3.googleusercontent.com/aida-public/...` image URLs as the actual `cover` values in the content collection.
**Why it's wrong:** Remote, unowned URLs can disappear or change, aren't processed by `astro:assets` optimization pipeline the same way local images are, and (like the fonts case) would require the CSP `img-src` to allow an arbitrary third-party host.
**Do this instead:** Store placeholder cover images locally under `src/assets/projects/` (even if they're deliberately generic/placeholder art) and reference them via the collection's `image()` schema helper, so the final content swap is just replacing files, not touching CSP config.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Vercel (hosting/CDN/HTTPS) | `astro build` output deployed to Vercel; static output needs no adapter for basic hosting, though `@astrojs/vercel` can be added later if image-CDN/adapter features are wanted | HTTPS/CDN are automatic on Vercel; no serverless functions needed given no contact-form backend |
| Google Fonts (Lexend, Inter, JetBrains Mono) | Astro native Fonts API (`fontProviders.google()`) — build-time download, self-hosted output | Not a runtime integration; no client-side third-party request at all |
| GitHub / LinkedIn / email (contact links) | Plain `<a href="...">` anchors, no SDK/API | Matches "no contact form" constraint — zero backend surface |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|----------------|-------|
| `site.ts` ↔ layout/section components | Direct ES module import (build-time constant) | No prop-drilling needed; components import only the slice they need (e.g., `import { site } from '../data/site'`) |
| Content Collection ↔ `Projects.astro` | `getCollection('projects')` (Astro content API, build-time) | Only `Projects.astro` talks to `astro:content`; keeps the collection schema change-surface small |
| `Projects.astro` ↔ `ProjectCard.astro` | Props (spread of `entry.data`) | `ProjectCard` has no knowledge of collections — pure presentational boundary |
| `global.css` (`@theme`) ↔ all components | Tailwind utility class names | Implicit coupling — every component's classes assume the token names defined in `@theme`; must be set up first (see Build Order) |

## Suggested Build Order

Dependencies flow from "things everything else depends on" toward "composition":

1. **`astro.config.mjs`** — register `@tailwindcss/vite`, configure the Fonts API (Lexend/Inter/JetBrains Mono via `fontProviders.google()`), set `output: 'static'`. Nothing downstream can be styled or use fonts correctly until this exists.
2. **`src/styles/global.css`** — transcribe DESIGN.md's full token set (colors, typography scale, spacing, radius) into the `@theme` block (Pattern 1). This is the design contract made literal; every subsequent component depends on these exact token names.
3. **`src/data/site.ts`** — centralize all placeholder copy (name, tagline, bio, stats, stack categories + tags, nav items, social links). Components 6+ read from this.
4. **`src/content.config.ts`** — define the `projects` collection schema (Pattern 2), independent of any actual project files yet.
5. **Placeholder project entries** in `src/content/projects/*.md` (mirror the prototype's 3 fake projects: Neural Engine, Vault-X, Omni-Stream) — validates the schema end-to-end before components consume it.
6. **`src/layouts/BaseLayout.astro`** — head/meta/fonts wiring, atmospheric background layers (grid + glow), `<slot />`. Depends on steps 1–2 (fonts, tokens) but not on 3–5.
7. **Structural components with no data dependency:** `Nav.astro`, `Footer.astro` (depend only on `site.ts`, step 3) — build these before section components since they wrap every page and are simplest to verify against the design contract.
8. **Section components, in prototype order, each verified individually against the design/screenshot:** `Hero.astro` → `Dossier.astro` → `Stack.astro` (all depend only on `site.ts`) → `ProjectCard.astro` (pure presentational, depends on nothing but its own props — build before `Projects.astro`) → `Projects.astro` (depends on `content.config.ts` + `ProjectCard.astro`) → `Contact.astro` (depends on `site.ts`).
9. **`src/pages/index.astro`** — compose `BaseLayout` + `Nav` + all sections in prototype order + `Footer`. This is the integration point; nothing here should contain original markup/logic, only composition.
10. **`vercel.json`** security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) — can be done in parallel with steps 6–9 since it's deploy-config, not app code, but must exist before the site is considered "done" per PROJECT.md's security requirement. Verify the CSP is compatible with self-hosted fonts/images (should be strict, since no third-party origins are needed per Anti-Patterns 2 and 5).
11. **Deploy to Vercel** — connect repo, confirm static build output and headers apply, verify against DESIGN.md screenshot (`Arquivos de design/screen.png`) for visual parity.

This order front-loads everything that acts as a "contract" other work depends on (config, tokens, data shape, content schema) before any visual component is built, and defers composition/deploy concerns to the end — minimizing rework if a token or schema field is missing.

## Sources

- [Astro Project Structure docs](https://github.com/withastro/docs/blob/main/src/content/docs/en/basics/project-structure.mdx) — via Context7 (`/withastro/docs`), HIGH confidence
- [Astro Content Collections guide](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/content-collections.mdx) — via Context7, HIGH confidence
- [Astro Content Loader Reference (`glob()`)](https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/content-loader-reference.mdx) — via Context7, HIGH confidence
- [Astro Images guide (`image()` schema helper, `<Image />`)](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/images.mdx) — via Context7, HIGH confidence
- [Astro Styling guide — Tailwind v4 via `@tailwindcss/vite`, `@astrojs/tailwind` deprecated](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/styling.mdx) — via Context7, HIGH confidence
- [Tailwind CSS `@theme` directive docs](https://tailwindcss.com/docs/theme) — WebFetch, HIGH confidence (official docs)
- [Astro Fonts guide (native Fonts API, `fontProviders.google()`)](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/fonts.mdx) — via Context7, HIGH confidence
- [Astro Font Provider Reference](https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/font-provider-reference.mdx) — via Context7, HIGH confidence
- [Astro Vercel adapter guide (`staticHeaders`, CSP)](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/integrations-guide/vercel.mdx) — via Context7, HIGH confidence
- [Astro Framework Components guide (`client:*` directives, islands)](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/framework-components.mdx) — via Context7, HIGH confidence
- Self-hosting Google Fonts rationale (privacy/perf) — WebSearch, MEDIUM confidence (multiple independent sources agree, cross-checked against official Astro Fonts API existence)
- Vercel `vercel.json` `headers` array pattern for non-Next.js static sites — WebSearch, MEDIUM confidence (consistent across multiple sources; not verified against a single canonical Vercel docs page in this session)
- `Arquivos de design/DESIGN.md` and `Arquivos de design/code.html` (project's own design contract/prototype) — primary source for component boundaries and token values

---
*Architecture research for: Astro-based static personal developer portfolio*
*Researched: 2026-09-02*
