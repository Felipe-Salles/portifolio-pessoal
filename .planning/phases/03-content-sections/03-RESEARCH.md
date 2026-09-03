# Phase 3: Content Sections - Research

**Researched:** 2026-09-03
**Domain:** Astro Content Collections rendering (`getCollection`), `astro:assets` image optimization inside conditional/optional fields, Tailwind v4 CSS-only fallback visuals, CSS Grid mixed-span layouts
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hero Content Mapping**
- **D-01:** The H1 renders `site.heroHeading` (same placeholder value as `site.brand`, consistent with the nav wordmark) — not `site.name`.
- **D-02:** `site.title` (professional title/persona, required by HERO-01's "identidade/título profissional") renders as a secondary line between the H1 and the body paragraph. Three text levels in the Hero: H1 (`heroHeading`) → title line (`title`) → paragraph (`heroSubtitle`).
- **D-03:** `site.name` is NOT used anywhere in the Hero section — it stays reserved for other future use (e.g. meta tags). Do not invent a place to render it here.
- **D-04:** The availability badge (pulsing dot + `site.availabilityStatus` text) keeps the prototype's CSS-only pulse animation (`animate-pulse` equivalent) — zero JS.

**Projects Grid & Featured Treatment**
- **D-05:** The grid is always 3 columns on desktop (`md:grid-cols-3`, matching the prototype), regardless of how many projects exist. With today's 1-entry placeholder collection, the single card occupies the first cell and the rest of the row is empty — that's expected, not a bug to work around with dynamic column logic.
- **D-06:** `featured: boolean` gives the card real visual hierarchy: a featured project spans 2 columns (`col-span-2`) and/or gets a stronger border/glow treatment — not just a sort-order signal.
- **D-07:** Sort order: featured projects first (sorted among themselves by `order`), then the remaining projects (also by `order`, falling back to file order when `order` is absent).
- **D-08:** Cards without `coverImage` (today's placeholder state) render a cyan gradient fallback with a centered generic icon — reusing design-system colors/glow, no external image dependency. This refines Phase 1's D-05 ("generic visual placeholder") with a concrete shape.
- **D-09:** The gradient fallback gets a subtle hover reaction (stronger glow, or a slight icon opacity/scale change) rather than staying fully static — preserves the prototype's "alive" card feeling even without a real photo. The prototype's grayscale→color photo-reveal hover effect itself is reserved for when real `coverImage` assets exist (v2) — do not attempt to fake that specific effect on a gradient.

**Contact Section**
- **D-10:** Contact reuses `site.socials` exactly as-is — the same 4-entry array Footer already consumes (single source of truth, Phase 2's D-03 precedent). When real links replace the placeholders in v2, both Footer and Contact update from one edit in `site.ts`. Do NOT add separate `contactEmail`/`contactGithub`/`contactLinkedin` fields.
- **D-11:** Visually, Contact keeps the prototype's circular icon-button treatment (`w-12 h-12 rounded-full`, border + cyan glow on hover) — different from Footer's plain text-link row. Both read from the same `site.socials[].icon`/`.href`/`.label`, just styled differently per section.
- **D-12:** The Contact section's invitational heading + paragraph gets its own placeholder fields in `site.ts` (e.g. `contactHeading` / `contactSubtitle`), following the same D-03 placeholder-marker convention as the rest of the site — not hardcoded generic text directly in the component.
- **D-13:** Contact's social links carry `rel="noopener noreferrer"` from the start, matching the Footer's T-02-17 mitigation from Phase 2 — applied by default, not a discussed choice.

### Claude's Discretion

- Exact wording/shape of the new `contactHeading`/`contactSubtitle` placeholder field names in `site.ts` — follow the existing naming convention (`heroHeading`/`heroSubtitle`) for consistency.
- Exact gradient fallback composition (color stops, which icon) for project cards without `coverImage` — follow DESIGN.md's cyan glow language; Phase 1's D-05 already established the general direction, this phase just needs a concrete implementation.
- Exact hover treatment intensity on the gradient fallback (D-09) — subtle, not a full effect swap.
- Dossier layout (8/4 column split for bio + System Specs) — the prototype's structure is clear and uncontested; no gray area was raised.
- Tech Stack badge rendering — straightforward 3-category badge grid per DESIGN.md/TECH-02; no gray area was raised.
- Mobile reflow mechanics (20px margins, background grid scaling per LAY-01) — technical implementation detail for the researcher/planner, not a user-facing choice.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. (The prototype's grayscale→color photo hover effect was considered and explicitly deferred to whenever real `coverImage` assets land — see D-09 — not treated as a new-capability idea needing its own phase.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| HERO-01 | Hero section com identidade/título profissional (placeholder) e badge de disponibilidade | Architecture Patterns Pattern 1 (Hero markup + `site.ts` field mapping per D-01/D-02/D-04) |
| HERO-02 | CTA na Hero que leva para Projetos | Pattern 1 — `<a href="#projects">` reusing `.btn-primary` primitive already in `global.css` |
| DOSS-01 | Seção "Dossier" com bio (placeholder) | Pattern 2 — 8/4 grid split, `site.bio[]` array map |
| DOSS-02 | "System Specs" stats ao lado da bio | Pattern 2 — `site.systemSpecs[]` map inside the 4-col glass panel |
| TECH-01 | Tech Stack em 3 categorias (Languages/Frameworks/Infrastructure) | Pattern 3 — fixed 3-column category grid reading `site.techStack.{languages,frameworks,infrastructure}` |
| TECH-02 | Badge monospace por DESIGN.md | Pattern 3 — `font-mono-code text-mono-code` badge primitive (already defined, unused until now) |
| PROJ-01 | Projetos renderizados de Astro Content Collection | Pattern 4 — `getCollection('projects')` + sort |
| PROJ-02 | Card exibe nome, descrição, tags, link(s) live/repo | Pattern 4 |
| PROJ-03 | Links externos usam `rel="noopener noreferrer"` | Pattern 4 (applied per-link) + Security Domain |
| PROJ-04 | Cover images otimizadas via `astro:assets` | Pattern 5 — `<Image>` component, conditional render, Pitfall 8 (background-image vs `<img>`) |
| CONT-01 | Contato com links diretos, sem formulário | Pattern 6 — `site.socials` reused with circular icon-button styling |
| LAY-01 | Reflow mobile (margens 20px, grid adaptativo, background grid reduzido) | Pattern 7 + Common Pitfalls #4 — confirms existing `global.css` mobile grid rule already covers the "reduced background grid" half; adaptive grid is the existing `grid-cols-1 md:grid-cols-*` responsive pattern already used site-wide |
| LAY-02 | Fidelidade visual ao DESIGN.md/screen.png | All patterns — every code example is a corrected port of `code.html` lines 246-397, not a reinterpretation |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`./CLAUDE.md` locks the tech stack; nothing in it is re-litigated by this phase. Directives specifically relevant to Phase 3:

- **`astro:assets` is the only sanctioned image pipeline** — CLAUDE.md's own Supporting Libraries table calls out `sharp` (Astro's default image service) as already bundled; no new package install is implied by PROJ-04.
- **No external image origins** — SEC-01 (Phase 1, already enforced by `scripts/verify-no-external-origins.mjs`) forbids anything resembling the prototype's `lh3.googleusercontent.com` cover-image URLs. This phase's placeholder collection has no `coverImage` set at all, so the gradient fallback (D-08) is the only visual this phase actually ships — real photos are v2 (REAL-02).
- **No contact form / no serverless function** — CONT-01 is explicitly link-only; this phase must not add a `<form>` or any client-side submission logic.
- **Reach for vanilla JS/CSS before a framework** — the pulsing badge (D-04) and the gradient-fallback hover (D-09) must be pure CSS (`@keyframes`/`:hover`/Tailwind `animate-pulse`), not a JS-driven animation.
- **Astro Content Collections must use the `glob()` loader** (already wired in `src/content.config.ts`, Phase 1) — this phase only *consumes* `getCollection('projects')`, it does not touch the schema.

## Summary

Phase 3 is pure composition, not new infrastructure: every data source (`site.ts` singleton fields, the `projects` Content Collection with its `image()`-typed `coverImage`) was already scaffolded in Phase 1, and the shell (`Base.astro`, `Nav`, `Footer`) was already built in Phase 2. The work is porting five sections of `code.html` (lines 246-397) into `src/pages/index.astro` (replacing the current pipeline-proof scaffolding), correcting three concrete things the prototype gets wrong for this project's stack: (1) Tailwind v4 renamed `bg-gradient-to-*` to `bg-linear-to-*` — the prototype predates this rename and any AI-generated gradient code from training data will reach for the old, now-invalid class names; (2) the prototype's project cards render cover photos as a CSS `background-image` on a bare `<div>`, which is structurally incompatible with `astro:assets`' `<Image>`/`<Picture>` components (which render real `<img>` elements) — PROJ-04 requires switching to an `<img>`-based approach styled with `object-cover` to preserve the exact same visual sizing; (3) the schema's `coverImage` field has no companion `altText` field, so `alt` (a mandatory `<Image>` prop) must be derived from `project.data.title` rather than sourced from content.

The Projects grid interacts with CSS Grid's default "sparse" auto-placement algorithm in a way worth getting right: because D-07 sorts featured projects first and D-06 makes them `col-span-2`, a featured card at the start of a 3-column row will leave one empty trailing cell that CSS's default (non-`dense`) placement never backfills — which is the *correct* behavior to keep here, not a bug to fix with `grid-auto-flow: dense`, because `dense` reorders items to fill gaps and would silently violate D-07's explicit featured-first visual ordering. This conclusion (verified against MDN's `grid-auto-flow` spec text) is the single most important CSS finding in this research — it directly resolves the ambiguity the phase description flagged as needing investigation.

Both `getCollection()` sorting (double-key sort with `?? Infinity` fallback for missing `order`) and `<Image>` conditional rendering (ternary between `<Image>` and a static gradient `<div>`, never passing `undefined` as `src`) are standard, low-risk Astro patterns confirmed against current official documentation. No new npm packages are required for this phase.

**Primary recommendation:** Port `code.html` section-by-section into `src/pages/index.astro`, reusing `Base.astro`'s existing `<main>` wrapper and Phase 1/2's established primitives (`glass-panel`, `border-glow-cyan`, `.btn-primary:hover`) verbatim; write one new CSS-only primitive for the gradient-fallback hover state; add `contactHeading`/`contactSubtitle` to `site.ts`; and treat the featured-project grid gap as expected sparse-grid behavior rather than something to engineer around.

## Architectural Responsibility Map

Still a purely static site (`output: 'static'`, no adapter-backed SSR, no database) — every capability in this phase resolves at build time.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hero/Dossier/Tech Stack/Contact rendering | Build pipeline (Astro component render) | CDN / Static (final HTML) | Reads `site.ts` at build time, emits static HTML — no runtime data fetch. |
| Projects grid (`getCollection` + sort) | Build pipeline (Content Layer) | CDN / Static | `getCollection('projects')` runs once during `astro build`; the sorted/rendered list becomes static HTML — zero runtime query. |
| Cover image optimization (`astro:assets`) | Build pipeline (Sharp transform) | CDN / Static (emitted `.webp` files) | `<Image>` triggers Sharp-based resize/format-convert at build time; output files ship as static assets alongside the HTML. |
| Mobile reflow / responsive grid | Browser / Client (CSS media queries apply at render time) | CDN / Static (the compiled CSS itself is a build artifact) | The grid/typography *rules* are static CSS shipped once; which rule applies is resolved by the browser's viewport at render time — the only capability in this phase with a genuine client-side resolution step, and it's pure CSS, no JS. |

## Standard Stack

No new packages are required for this phase. Every API used below ships inside `astro@^7.2.10` (already installed, Phase 1) and Tailwind v4 (already installed, Phase 1):

| API | Source | Purpose | Already Installed Since |
|-----|--------|---------|--------------------------|
| `getCollection()` | `astro:content` | Query the `projects` Content Collection | Phase 1 (`astro` core) |
| `<Image>` | `astro:assets` | Optimized cover-image rendering (PROJ-04) | Phase 1 (`astro` core, `sharp` bundled transitively) |
| `<Icon>` | `astro-icon/components` | Gradient-fallback icon, Contact section icons | Phase 1 (`astro-icon@^1.2.0` + `@iconify-json/material-symbols@^1.2.90`) |
| Tailwind v4 grid/gradient/filter utilities | `@tailwindcss/vite` | Grid layout, gradient fallback, grayscale hover filter | Phase 1 (`tailwindcss@^4.3.3`) |

**Version verification performed:** `npm list astro tailwindcss astro-icon` confirms the exact versions already locked in `package.json` (see `package.json` read during this research: `astro@^7.2.10`, `tailwindcss@^4.3.3`, `@tailwindcss/vite@^4.3.3`, `astro-icon@^1.2.0`, `@iconify-json/material-symbols@^1.2.90`) — no drift, no re-verification against the registry needed since nothing new is installed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<Image>` component (real `<img>`) for project covers | `getImage()` + CSS `background-image` (matches prototype's exact markup shape) | `getImage()` still gets full `astro:assets` optimization, but requires manually building the `background-image: url(...)` string and loses the automatic `alt`-attribute accessibility contract entirely (a background-image has no `alt`). `<Image>` is simpler, standard, and A11Y-03-friendly later — recommended. |
| `grid-auto-flow: row` (default, sparse) for the Projects grid | `grid-auto-flow: dense` | `dense` would visually reorder cards to eliminate the gap left by a leading `col-span-2` featured card — but this directly contradicts D-07's explicit "featured first" *visual* ordering requirement, not just a DOM-order requirement. Not used. |
| CSS-only pulse (`animate-pulse` Tailwind utility) for the availability badge | Hand-written `@keyframes` | Tailwind v4 ships `animate-pulse` as a built-in utility (`opacity` keyframe animation) — matches D-04's "CSS-only pulse" requirement with zero custom CSS needed; no reason to hand-roll. |

**Installation:** None — this phase adds zero new dependencies.

## Package Legitimacy Audit

**Not applicable.** This phase installs no new external packages; every API consumed (`astro:content`, `astro:assets`, `astro-icon`, Tailwind utilities) was already vetted in `01-RESEARCH.md`'s Package Legitimacy Audit (Phase 1). No `slopcheck`/registry re-verification is needed.

## Architecture Patterns

### System Architecture Diagram

```
                     BUILD TIME (astro build / astro dev)
┌───────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  src/data/site.ts (singleton)         src/content/projects/*.md        │
│   heroHeading, title, heroSubtitle,    (Zod-validated via              │
│   availabilityStatus, bio[],           src/content.config.ts)          │
│   systemSpecs[], techStack{},              │                           │
│   socials[], contactHeading/Subtitle       ▼                          │
│         │                          getCollection('projects')           │
│         │                                  │                           │
│         │                          sort: featured-first,               │
│         │                          then `order` (?? Infinity fallback) │
│         │                                  │                           │
│         │                          for each project:                  │
│         │                            coverImage present?               │
│         │                              yes → <Image> (Sharp transform, │
│         │                                    emits optimized .webp)    │
│         │                              no  → static gradient <div>     │
│         │                                    + <Icon> fallback         │
│         ▼                                  ▼                           │
│  src/pages/index.astro renders: Hero → Dossier → Tech Stack →          │
│  Projects grid → Contact, inside Base.astro's <main id="main-content"> │
│                                                                         │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 dist/ (static HTML + optimized image assets,
                 zero external origins — SEC-01 gate still applies)
                              │
                              ▼
                    Browser: CSS media queries resolve mobile vs.
                    desktop grid/typography (only runtime-resolved
                    step in this phase — pure CSS, no JS)
```

### Recommended Project Structure

```
src/
├── data/
│   └── site.ts                # MODIFIED: add contactHeading/contactSubtitle (D-12)
├── content/
│   └── projects/
│       └── placeholder-project.md   # unchanged — still no coverImage/featured/order
├── pages/
│   └── index.astro            # MODIFIED: replace Phase 1 pipeline-proof content with
│                               #   the 5 real sections (Hero/Dossier/Stack/Projects/Contact)
├── styles/
│   └── global.css             # MODIFIED: add one new primitive for the gradient-
│                               #   fallback hover state (D-09)
```

No new component files are strictly required — all 5 sections can live directly in `index.astro` (this is the only page in the site; there is no cross-page reuse need for Hero/Dossier/etc.). If the plan prefers per-section `.astro` components for readability (e.g. `src/components/sections/Hero.astro`), that is a valid structural choice but not a research-mandated one — CONTEXT.md's canonical_refs describe `index.astro`'s Phase 1 scaffolding as "replaced" by this phase, implying direct placement is the expected default.

### Pattern 1: Hero section (HERO-01, HERO-02, D-01–D-04)

```astro
---
// Source: Arquivos de design/code.html lines 248-263, adapted per D-01–D-04.
import { site } from "../data/site.ts";
---
<section class="min-h-[716px] flex flex-col justify-center items-start">
  <div class="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-outline-variant/50 bg-surface-container/50 rounded font-mono-code text-mono-code text-primary-container">
    <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
    &gt;_ {site.availabilityStatus}
  </div>
  <h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg font-bold tracking-tight text-white mb-4 uppercase">
    {site.heroHeading}
  </h1>
  <p class="font-mono-label text-mono-label text-primary-container uppercase tracking-widest mb-6">
    {site.title}
  </p>
  <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-12">
    {site.heroSubtitle}
  </p>
  <a class="btn-primary bg-primary-container text-on-primary-container font-mono-label text-mono-label uppercase tracking-widest px-8 py-4 rounded transition-all duration-300 cursor-pointer active:scale-95 inline-flex items-center gap-2" href="#projects">
    VIEW PROJECTS
    <Icon name="material-symbols:arrow-forward" class="text-xl" />
  </a>
</section>
```
Note: `rounded-DEFAULT` (prototype's radius suffix) is not a real Tailwind class — use bare `rounded`, per the discrepancy already flagged and corrected in `01-PATTERNS.md`/Nav.astro (Phase 1/2 precedent, restated here since Hero is the first place this phase touches a rounded corner).

### Pattern 2: Dossier section (DOSS-01, DOSS-02)

```astro
---
// Source: code.html lines 265-292. 8/4 column split, uncontested per CONTEXT.md discretion notes.
---
<section class="scroll-mt-32" id="dossier">
  <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
    <div class="md:col-span-8 space-y-8 glass-panel p-8 rounded-lg">
      <h2 class="font-headline-md text-headline-md text-white border-b border-outline-variant/30 pb-4 inline-block">DOSSIER</h2>
      <div class="font-body-md text-body-md text-on-surface-variant space-y-6">
        {site.bio.map((paragraph) => <p>{paragraph}</p>)}
      </div>
    </div>
    <div class="md:col-span-4 glass-panel p-6 rounded-lg border-glow-cyan h-full">
      <h3 class="font-mono-label text-mono-label text-primary-container uppercase tracking-widest mb-6 pb-2 border-b border-primary-container/30">SYSTEM SPECS</h3>
      <ul class="space-y-4 font-mono-code text-mono-code text-on-surface-variant">
        {site.systemSpecs.map((spec) => (
          <li class="flex justify-between items-center">
            <span class="text-white">{spec.label}</span>
            <span>{spec.value}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
</section>
```

### Pattern 3: Tech Stack section (TECH-01, TECH-02)

```astro
---
// Source: code.html lines 294-325. Fixed 3 categories, not a generic loop over
// arbitrary category names — matches TECH-01's "3 categorias fixas" requirement
// and site.ts's fixed-key techStack shape (Phase 1 D-02).
const categories = [
  { label: "LANGUAGES", items: site.techStack.languages },
  { label: "FRAMEWORKS", items: site.techStack.frameworks },
  { label: "INFRASTRUCTURE", items: site.techStack.infrastructure },
];
---
<section class="scroll-mt-32" id="stack">
  <h2 class="font-headline-md text-headline-md text-white border-b border-outline-variant/30 pb-4 mb-12 inline-block">TECH STACK</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {categories.map((category) => (
      <div class="glass-panel p-6 rounded-lg">
        <h3 class="font-mono-label text-mono-label text-secondary uppercase tracking-widest mb-6">{category.label}</h3>
        <div class="flex flex-wrap gap-3">
          {category.items.map((tech) => (
            <span class="px-3 py-1 bg-surface-container border border-outline-variant/50 text-white font-mono-code text-mono-code rounded">[ {tech.toUpperCase()} ]</span>
          ))}
        </div>
      </div>
    ))}
  </div>
</section>
```

### Pattern 4: Projects grid — collection query, sort, and mixed-span layout (PROJ-01, PROJ-02, PROJ-03, D-05–D-07)

```astro
---
// Source: docs.astro.build/en/guides/content-collections/ (fetched 2026-09-03) +
// D-05/D-06/D-07. Two-array split-then-concat is preferred over a single custom
// comparator: it makes the "featured group, then rest group, each independently
// order-sorted" contract explicit in code rather than encoded in comparator logic
// that's easy to get subtly wrong (e.g. an unstable single comparator can let a
// non-featured item's `order` value interleave with featured items').
import { getCollection } from "astro:content";
import { Image } from "astro:assets";
import { Icon } from "astro-icon/components";

const allProjects = await getCollection("projects");

const byOrder = (a: (typeof allProjects)[number], b: (typeof allProjects)[number]) =>
  (a.data.order ?? Infinity) - (b.data.order ?? Infinity);

const featured = allProjects.filter((p) => p.data.featured).sort(byOrder);
const rest = allProjects.filter((p) => !p.data.featured).sort(byOrder);
const projects = [...featured, ...rest];
---
<section class="scroll-mt-32" id="projects">
  <h2 class="font-headline-md text-headline-md text-white border-b border-outline-variant/30 pb-4 mb-12 inline-block">PROJECTS</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    {projects.map((project) => (
      <article
        class:list={[
          "glass-panel rounded-lg overflow-hidden group transition-colors duration-300",
          project.data.featured ? "md:col-span-2 border-glow-cyan" : "hover:border-primary-container/50",
        ]}
      >
        {project.data.coverImage ? (
          <Image
            src={project.data.coverImage}
            alt={`Capa do projeto ${project.data.title}`}
            class="w-full h-48 object-cover border-b border-outline-variant/30 grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div class="cover-fallback w-full h-48 border-b border-outline-variant/30 flex items-center justify-center bg-linear-to-br from-primary-container/15 via-surface-container to-surface-container-high transition-all duration-500">
            <Icon name="material-symbols:code" class="cover-fallback-icon w-12 h-12 text-primary-container/60 transition-all duration-500" />
          </div>
        )}
        <div class="p-6 space-y-4">
          <h3 class="font-headline-md text-headline-md text-white text-xl">{project.data.title}</h3>
          <p class="font-body-md text-body-md text-on-surface-variant text-sm">{project.data.description}</p>
          <div class="flex flex-wrap gap-2 pt-4">
            {project.data.tags.map((tag) => (
              <span class="text-xs font-mono-code text-primary-container bg-primary-container/10 px-2 py-1 rounded">{tag.toUpperCase()}</span>
            ))}
          </div>
          <div class="flex gap-4 pt-4 border-t border-outline-variant/20 mt-4">
            {project.data.liveUrl && (
              <a href={project.data.liveUrl} rel="noopener noreferrer" class="text-on-surface-variant hover:text-white transition-colors flex items-center gap-1 text-sm font-mono-label uppercase">
                <Icon name="material-symbols:open-in-new" class="text-[16px]" /> Live
              </a>
            )}
            {project.data.repoUrl && (
              <a href={project.data.repoUrl} rel="noopener noreferrer" class="text-on-surface-variant hover:text-white transition-colors flex items-center gap-1 text-sm font-mono-label uppercase">
                <Icon name="material-symbols:code" class="text-[16px]" /> Repo
              </a>
            )}
          </div>
        </div>
      </article>
    ))}
  </div>
</section>
```

**Why the sparse grid gap is correct, not a bug (the phase description's item #4):** With `grid-cols-3` (default `grid-auto-flow: row`, sparse), a featured card at position 1 spanning 2 columns occupies row 1, columns 1-2; the browser's placement cursor moves forward and never backtracks, so column 3 of row 1 stays empty until an item that *doesn't* fit is placed in the next row `[CITED: developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-flow, fetched 2026-09-03]`. Adding `grid-auto-flow: dense` would fill that gap with a later, smaller item — but `dense` explicitly "may cause items to appear out-of-order" relative to source order, which would silently violate D-07's "featured first" *visual* contract the first time a non-featured card got dense-packed ahead of a later featured one, or simply reordered cards from their intended sequence. **Do not add `grid-auto-flow: dense`.** This is consistent with D-05's already-accepted "sparse grid is fine" stance for the 1-entry placeholder case — the same acceptance extends naturally to the featured-card gap case.

### Pattern 5: `astro:assets` `<Image>` — optional field, conditional render (PROJ-04)

Covered inline in Pattern 4 above. Key points, verified against current official docs:

- `getCollection()` entries with an `image()`-typed schema field return the field as an already-resolved `ImageMetadata` object (`{ src, width, height, format }`) — no manual `import()` or `getImage()` call needed before passing it to `<Image src={...}>` `[CITED: docs.astro.build/en/guides/images/, fetched 2026-09-03]`.
- `width`/`height` are NOT required as explicit props when `src` is an `ImageMetadata` object (local/collection-imported image) — they're inferred automatically `[CITED: docs.astro.build/en/reference/modules/astro-assets/, fetched 2026-09-03]`.
- `alt` IS a required prop with no fallback — passing `undefined` or omitting it is a build/type error. Since the `projects` schema has no dedicated alt-text field, derive `alt` from `project.data.title` (e.g. `` `Capa do projeto ${project.data.title}` ``) rather than adding a new schema field (not authorized by CONTEXT.md's discretion list — adding fields is a schema change, out of this phase's scope).
- **Never render `<Image src={undefined}>`.** The correct pattern is the ternary shown in Pattern 4 — render `<Image>` only inside the truthy branch of `project.data.coverImage ? ... : ...`, never pass a possibly-undefined value into `src` directly.

### Pattern 6: Contact section (CONT-01, D-10–D-13)

```astro
---
// Source: code.html lines 379-396. D-10: reuses site.socials verbatim (same
// array Footer consumes). D-11: circular icon-button, distinct from Footer's
// text-link row. D-12: new contactHeading/contactSubtitle fields.
---
<section id="contact" class="scroll-mt-32 glass-panel p-12 rounded-xl text-center border-glow-cyan max-w-3xl mx-auto">
  <h2 class="font-headline-md text-headline-md text-white mb-4">{site.contactHeading}</h2>
  <p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-lg mx-auto">{site.contactSubtitle}</p>
  <div class="flex justify-center gap-6">
    {site.socials.map((s) => (
      <a
        href={s.href}
        rel="noopener noreferrer"
        aria-label={s.label}
        class="w-12 h-12 rounded-full border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:border-primary-container hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all duration-300"
      >
        <Icon name={s.icon} />
      </a>
    ))}
  </div>
</section>
```
The prototype's per-icon `hover:shadow-[0_0_10px_rgba(0,240,255,0.3)]` arbitrary value is used directly (not extracted into a new `global.css` primitive) — it's a one-off, single-usage-site value distinct enough from `.border-glow-cyan`'s `0 0 8px` blur that promoting it to a shared primitive would be premature abstraction for a single call site.

`site.ts` addition needed (D-12, Claude's Discretion for exact naming — following the `heroHeading`/`heroSubtitle` convention):
```typescript
// Contact section invitational copy (CONT-01, D-12).
contactHeading: "PLACEHOLDER — título do convite a definir",
contactSubtitle: "PLACEHOLDER — subtítulo do convite a definir",
```

### Pattern 7: Mobile reflow — already covered by existing tokens/CSS (LAY-01)

No new CSS is required for LAY-01's three sub-requirements:
- **20px margins:** `px-margin-mobile` (existing `--spacing-margin-mobile` token, Phase 1) — apply to each section exactly as `Base.astro`/`Nav.astro`/`Footer.astro` already do, OR wrap all 5 sections in a single container that already carries this (see Pitfall 5 below — the prototype wraps its entire `<main>` in one `px-margin-mobile md:px-gutter max-w-container-max mx-auto` container, and this project's `Base.astro` does not yet have that wrapper on `<main>`).
- **Adaptive grid:** every grid in this phase already uses the `grid-cols-1 md:grid-cols-N` responsive pattern (Dossier's 12-col, Stack's 3-col, Projects' 3-col) — standard Tailwind responsive utilities, no new tokens.
- **Reduced background grid:** already implemented in `global.css`'s existing `@media (max-width: 768px) { .bg-grid-pattern { background-size: 32px 32px; } }` rule (Phase 1) — nothing to add, just confirm `Base.astro`'s `<body>` still carries `bg-grid-pattern` (it does).

### Anti-Patterns to Avoid

- **`bg-gradient-to-br` (or any `bg-gradient-to-*`) in new Tailwind v4 code:** renamed to `bg-linear-to-*` in Tailwind v4 `[CITED: tailwindcss.com/docs/background-image, fetched 2026-09-03]`. Training data and copy-pasted v3-era snippets will reach for the old name — it will not compile the intended gradient (Tailwind v4 either ignores the unrecognized class or, if a custom `bg-gradient-to-br` utility doesn't exist in the build, produces no gradient at all, a silent visual miss rather than a build error).
- **CSS `background-image` for project covers:** structurally incompatible with `<Image>`/`<Picture>` (which emit `<img>` elements) — would require a manual `getImage()` + inline-style detour that loses the automatic `alt` accessibility contract for no benefit. Use `<Image>` styled with `object-cover` instead (Pattern 5).
- **`grid-auto-flow: dense` on the Projects grid:** see Pattern 4's explanation — reorders cards and violates D-07.
- **`rounded-DEFAULT`:** not a real Tailwind class name in this project (already flagged in `01-PATTERNS.md`); use bare `rounded`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Cover image resize/format conversion | Manual `sharp` calls, or shipping raw uploaded images from `public/` | `<Image>` from `astro:assets` | This is precisely PROJ-04's requirement — `<Image>` already wraps Sharp, infers dimensions, and handles format conversion (default `.webp`) at build time. |
| Featured/order sorting | A generic "sort by multiple keys" utility library | Two `.filter()` + `.sort()` calls (Pattern 4) | The sort logic here is 4 lines and fully explicit — a general-purpose multi-key sort utility (e.g. lodash `orderBy`) would be a new dependency for something with no reuse need elsewhere in this static, 1-page site. |
| Pulsing status dot animation | JS `setInterval`/`requestAnimationFrame` opacity loop | Tailwind's built-in `animate-pulse` utility | D-04 explicitly requires CSS-only; `animate-pulse` is a zero-config built-in Tailwind v4 utility, no custom `@keyframes` needed. |
| `rel="noopener noreferrer"` enforcement | A custom "safe external link" Astro component/wrapper | Apply the attribute directly on each `<a>` (Pattern 4/6) | Only ~6 external-link call sites exist in this entire phase (2 per project card × N projects, 4 socials in Contact) — a wrapper component adds indirection with no meaningful DRY benefit at this scale; Footer.astro (Phase 2) already established the direct-attribute pattern. |

**Key insight:** This phase's "don't hand-roll" risk is low — everything genuinely complex (image optimization, content querying) is already covered by Astro's built-in APIs. The actual risk in this phase is porting stale/incorrect syntax from the prototype or from training data (the Tailwind v4 gradient rename being the sharpest example), not reinventing tooling.

## Common Pitfalls

### Pitfall 1: Tailwind v4 gradient utility rename (`bg-gradient-to-*` → `bg-linear-to-*`)
**What goes wrong:** Writing `bg-gradient-to-br from-primary-container/20 to-surface-container` for the D-08 fallback panel — this was the correct v3 syntax and is extremely common in training data/tutorials.
**Why it happens:** Tailwind v4 renamed the linear-gradient direction utilities; `bg-gradient-to-*` is not an alias in v4, it simply does not match any utility and is silently dropped from the compiled CSS (no build error, no visible gradient).
**How to avoid:** Use `bg-linear-to-br` (and `bg-linear-to-{t,tr,r,br,b,bl,l,tl}` for other directions) `[CITED: tailwindcss.com/docs/background-image, fetched 2026-09-03]`. `from-*`/`via-*`/`to-*` color-stop utilities are unchanged.
**Warning signs:** The fallback panel renders as a flat, un-gradiented background color instead of the intended cyan gradient — easy to miss in a quick visual check since *some* background color still shows (whichever utility class happens to resolve, or none, leaving the element's default transparent/inherited background).

### Pitfall 2: Passing `coverImage` (possibly `undefined`) directly as `<Image src>`
**What goes wrong:** `<Image src={project.data.coverImage} alt="..." />` without a truthy check — since `coverImage` is `z.optional()` in the schema, this is `undefined` for every project in today's placeholder collection.
**Why it happens:** It's easy to assume `<Image>` gracefully no-ops on an undefined `src`, matching how a plain `<img src={undefined}>` degrades (broken-image icon, no error). `<Image>` is a build-time component, not a runtime HTML element — it validates its props at build time.
**How to avoid:** Ternary/conditional render — only reach the `<Image>` branch when `project.data.coverImage` is truthy (Pattern 4/5). Never call `<Image>` speculatively "just in case."
**Warning signs:** `astro build` fails with a type error or runtime error referencing the `Image` component and an invalid/missing `src`.

### Pitfall 3: Missing `alt` text for cover images (no schema field for it)
**What goes wrong:** Either the build fails (TypeScript/Zod requires `alt` as non-optional on `<Image>`), or a generic non-descriptive `alt="cover"` gets hardcoded to unblock the build.
**Why it happens:** The `projects` schema (Phase 1) has `coverImage: image().optional()` but no paired `altText`/`coverAlt` field — this was not flagged as a gap in Phase 1 or in this phase's CONTEXT.md.
**How to avoid:** Derive `alt` from existing schema data — `` alt={`Capa do projeto ${project.data.title}`} `` (Pattern 5) — rather than adding a new schema field (a schema change is out of this phase's authorized scope; CONTEXT.md's discretion list doesn't include it). This satisfies `<Image>`'s build-time requirement now; A11Y-03 (Phase 4, "descriptive alt text, not filenames") can revisit whether a per-project custom alt field is worth adding later.
**Warning signs:** Generic/non-descriptive alt text failing an axe/Lighthouse a11y check in Phase 4.

### Pitfall 4: `grid-auto-flow: dense` "fixing" the featured-card gap
**What goes wrong:** Seeing an empty grid cell next to a `col-span-2` featured card and reflexively adding `grid-auto-flow: dense` to eliminate it.
**Why it happens:** `dense` is the well-known CSS Grid fix for exactly this visual symptom (masonry-style gap-filling) — but this project's requirement is ordering-sensitive (D-07), and generic CSS Grid advice doesn't account for that.
**How to avoid:** Leave `grid-auto-flow` at its default (`row`, sparse) — see Pattern 4's full explanation. The gap is expected/acceptable per D-05's existing precedent.
**Warning signs:** After adding `dense`, cards no longer appear in the featured-first order the sort logic produced — a card that should visually lead the grid ends up mid-grid because a later, single-column card filled the gap ahead of it.

### Pitfall 5: `Base.astro`'s `<main>` has no margin/max-width wrapper yet
**What goes wrong:** Assuming `px-margin-mobile`/`max-w-container-max` are already applied globally to all page content (since Nav and Footer both apply them internally), and omitting them from the new sections — content bleeds edge-to-edge on mobile, violating LAY-01.
**Why it happens:** `Base.astro`'s current `<main id="main-content" class="relative z-10 pt-32">` (Phase 2) has no horizontal padding or max-width — Nav and Footer each independently wrap their own inner `<div>` with `px-margin-mobile md:px-gutter max-w-container-max mx-auto`, but `<main>` itself does not.
**How to avoid:** Either (a) add `px-margin-mobile md:px-gutter max-w-container-max mx-auto` (plus `space-y-section-gap`, matching the prototype's `<main>` wrapper classes at `code.html` line 220) to `Base.astro`'s `<main>` element directly, or (b) wrap the 5 sections in `index.astro` in a single container `<div>` carrying those classes. Option (a) is closer to the prototype's actual structure (`code.html` line 220: `<main class="relative z-10 pt-32 pb-section-gap px-margin-mobile md:px-gutter max-w-container-max mx-auto space-y-section-gap">`) and avoids double-wrapping if a later phase (404 page, Phase 4) also needs this container — recommended, but this is a `Base.astro` edit, which is technically outside this phase's stated "does NOT touch the nav/footer shell" boundary (CONTEXT.md `<domain>`). Flag this precisely for the planner as an open question (see below) rather than silently deciding it here.
**Warning signs:** Sections render full-bleed to the viewport edge on mobile; DevTools shows no horizontal padding on `<main>`.

### Pitfall 6: `getCollection()` array order is not guaranteed alphabetical/deterministic
**What goes wrong:** Relying on "file order" (D-07's stated fallback for entries with no explicit `order`) to mean "alphabetical by filename" or "any particular deterministic order" across environments/OSes.
**Why it happens:** `glob()`-loaded collections read the filesystem; while most local dev environments return directory entries in a consistent (often alphabetical) order in practice, this is not a hard guarantee of Node's `fs.readdir`/Vite's glob resolution across all platforms.
**How to avoid:** For today's single-placeholder-entry collection this is moot (nothing to reorder). As soon as a second real project entry is added (v2, REAL-02), explicitly set `order` on both if a specific sequence matters — don't rely on filename/save-order alone for anything visually load-bearing.
**Warning signs:** Card order shifts unexpectedly after a `rm -rf node_modules && npm install` or between local dev and Vercel's build environment, for entries that share the same (absent) `order` value.

### Pitfall 7: Tailwind v4 arbitrary-value class caching/purge with dynamic `tag.toUpperCase()`-style content
**What goes wrong:** None expected here specifically — flagged only because Tech Stack badges and Project tags both render *data-driven* text content (`{tech.toUpperCase()}`, `{tag.toUpperCase()}`) inside otherwise-static utility classes. This is safe: Tailwind's build-time scanner only needs to see literal *class name* strings in the source to generate the corresponding CSS rule — it never needs to see the rendered *text content* of an element. No class names here are being dynamically constructed from data (e.g. no `` class={`text-${tag}`} `` pattern), so there is no purge risk.
**Why flagged:** Worth confirming explicitly since this phase is the first to render collection/array data as visible badge/tag text, and dynamic-class-purge is a very common real Tailwind pitfall in other contexts — ruling it out here prevents a planner/executor from over-engineering a safelist that isn't needed.
**How to avoid:** N/A — no action needed, current patterns are already safe.
**Warning signs:** N/A.

### Pitfall 8: Prototype's `background-image` cover pattern is structurally incompatible with `<Image>`
**What goes wrong:** Porting `code.html`'s exact markup (`<div class="bg-cover bg-center w-full h-48" style="background-image: url('...')">`) verbatim, then trying to retrofit `astro:assets` optimization onto it afterward.
**Why it happens:** It's the path of least resistance when porting prototype markup line-by-line — the `<div>`+`background-image` shape looks visually identical to an `<img>`+`object-cover` shape, so the incompatibility with `<Image>` (which renders an `<img>`, not a `style` attribute) isn't obvious until PROJ-04 is checked against the rendered output.
**How to avoid:** Use `<Image>` as a real `<img>` element from the start (Pattern 4/5), styled with `w-full h-48 object-cover` instead of `bg-cover bg-center` + inline `background-image`. The grayscale-hover filter (`grayscale group-hover:grayscale-0`) applies identically to an `<img>` element — no loss of the prototype's hover effect.
**Warning signs:** PROJ-04 verification (checking that cover images are served via `astro:assets`, not raw from `public/`) fails because the image URL is embedded in an inline `style` string rather than an `<img src>` that went through the `<Image>` pipeline.

## Code Examples

See Architecture Patterns above (Patterns 1–7) — all are ready-to-use, verified code, not illustrative pseudocode. Each cites its source (`code.html` line range for prototype-ported markup, or an official-docs URL for API usage).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `bg-gradient-to-{dir}` (Tailwind v3) | `bg-linear-to-{dir}` (Tailwind v4) | Tailwind v4 release | Any AI-generated or copy-pasted v3-era gradient snippet silently fails to apply in this project — see Pitfall 1. |
| CSS `background-image` for decorative/content photos | `<Image>`/`<Picture>` from `astro:assets` (real `<img>`, build-time optimized) | Astro's Image integration stabilization (pre-dates this project; already the mandated pattern per CLAUDE.md/PROJ-04) | Directly relevant to porting the prototype's project cards — see Pitfall 8. |

**Deprecated/outdated:**
- Nothing new deprecated in this phase beyond what Phase 1's RESEARCH.md already flagged (`@astrojs/tailwind`, legacy `src/content/config.ts`) — neither is touched by this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `getCollection()` entries with an `image()`-typed field return an already-resolved `ImageMetadata` object usable directly as `<Image src>`, with no manual `import()`/`getImage()` step required. Derived from a WebFetch summary of `docs.astro.build/en/guides/images/`, not a direct verbatim doc quote. | Pattern 5 | Low — if wrong, the build fails immediately and loudly (type error on `src`) rather than silently misrendering; a few minutes of trial-and-error at most, no data-integrity risk. |
| A2 | `alt` is a strictly required, non-optional prop on `<Image>` with no documented fallback/default. Derived from a WebFetch summary of the `astro:assets` reference page, cross-referenced with general Astro `<Image>` knowledge (HIGH prior confidence), not a verbatim doc quote captured in this session. | Pattern 5, Pitfall 3 | Low — if `alt` turned out to be optional, the mitigation (deriving alt text from `project.data.title`) is still strictly better than omitting it, so no rework needed either way. |
| A3 | `Base.astro`'s `<main>` element currently has no `px-margin-mobile`/`max-w-container-max` wrapper (confirmed by direct file read in this session — this is a verified fact, not an assumption) and that adding one there (vs. wrapping sections individually in `index.astro`) is the better fix. The *fact* is verified; the *recommendation* of where to fix it is this researcher's judgment, flagged as an open question for the planner rather than asserted as a locked decision, since `Base.astro` edits sit at the edge of this phase's stated domain boundary. | Pitfall 5, Open Questions | Medium — if the planner chooses the wrong location (e.g. duplicates the wrapper in both `Base.astro` and `index.astro`), the visible symptom is doubled margins/incorrect max-width on mobile, not a silent failure — will be caught by any visual mobile-viewport check against `screen.png` before LAY-01/LAY-02 sign-off. |

**If this table is empty:** N/A — see above.

## Open Questions

1. **Where should the `px-margin-mobile`/`max-w-container-max`/`space-y-section-gap` wrapper (needed for LAY-01 mobile margins + the prototype's overall section rhythm) be added: `Base.astro`'s `<main>`, or a wrapper `<div>` inside `index.astro`?**
   - What we know: `Base.astro`'s current `<main>` (Phase 2) has no such wrapper; the prototype applies it at the `<main>` level (`code.html` line 220); CONTEXT.md's phase boundary says this phase "does NOT touch the nav/footer shell itself" but doesn't explicitly forbid a `<main>`-level layout edit (which is arguably layout plumbing, not nav/footer content).
   - What's unclear: Whether "does not touch the shell" was meant to include `<main>`'s own wrapper classes, or only Nav/Footer components specifically.
   - Recommendation: Add it to `Base.astro`'s `<main>` (matches the prototype's actual structure most closely, and avoids a future Phase 4 404-page needing to duplicate the wrapper). The planner should confirm this reading of the phase boundary before assigning the task, or explicitly route it to a wrapper `<div>` in `index.astro` if a stricter boundary interpretation is preferred — either resolves LAY-01 correctly, this is a "where" question, not a "whether" question.

2. **Should the Contact section's per-icon `aria-label` use `site.socials[].label` even though it's currently the literal placeholder string `"PLACEHOLDER"` for all 4 entries?**
   - What we know: Footer (Phase 2) doesn't need `aria-label` on its social links because the visible text *is* the label (`{s.label}`). Contact's circular icon-buttons have no visible text — only the icon — so an `aria-label` is the only accessible name available, and A11Y-03/A11Y-04-adjacent concerns (even though those are formally Phase 4 gates) make this worth getting right now rather than retrofitting later.
   - What's unclear: Nothing structurally — `aria-label={s.label}` is correct Astro/HTML regardless of the string's current placeholder content; when `site.socials[].label` becomes a real value in v2 (REAL-03), the `aria-label` updates automatically with zero code change.
   - Recommendation: Already included in Pattern 6's code example (`aria-label={s.label}`) — no further decision needed, listed here only for visibility since it's a detail easy to drop while porting the prototype (which has no `aria-label` on these icon buttons at all).

## Environment Availability

No new external dependencies (tools, services, runtimes) are introduced by this phase — every API consumed is part of the already-installed `astro`/`astro-icon`/`tailwindcss` packages verified present in Phase 1. `npm run dev`/`npm run build` (already working, per Phase 1/2 completion) are sufficient to develop and verify this phase; no additional probe was necessary.

## Security Domain

`security_enforcement` is absent from `.planning/config.json`'s `workflow` block → treated as enabled (same posture as Phase 1/2).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|-----------------|---------|---------------------|
| V2 Authentication | No | No auth anywhere in this project. |
| V3 Session Management | No | Fully static, no sessions. |
| V4 Access Control | No | Every page/section is public. |
| V5 Input Validation | Yes (inherited, not new) | The `projects` Zod schema (Phase 1) already validates every entry this phase renders — no new user input surface is introduced (no form, per CONT-01/CLAUDE.md). |
| V6 Cryptography | No | No cryptographic operations in this phase. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Reverse tabnabbing via external links opened without `rel="noopener noreferrer"` (a malicious/compromised `liveUrl`/`repoUrl` or social link target could use `window.opener` to redirect the original tab) | Tampering / Spoofing | `rel="noopener noreferrer"` applied directly on every external `<a>` in Projects and Contact (Pattern 4/6) — this is PROJ-03/D-13's explicit requirement, not a gap this research is introducing. |
| XSS via unsanitized rendering of collection-sourced strings (`project.data.title`/`description`/`tags`) | Tampering | Rendered via normal Astro expression interpolation (`{project.data.title}`), which HTML-escapes by default — never `set:html` anywhere in this phase's patterns. Consistent with Phase 1 RESEARCH.md's forward-looking note on this exact point. |
| Content-sourced `alt` text used as a raw string in a template literal (`` `Capa do projeto ${project.data.title}` ``) | Tampering (low severity — HTML attribute context) | Astro's expression interpolation escapes attribute values automatically; no manual escaping needed. Flagged only for completeness since this phase introduces the first template-literal-composed `alt` string in the codebase. |

## Sources

### Primary (HIGH confidence)
- Direct file reads: `src/data/site.ts`, `src/content.config.ts`, `src/content/projects/placeholder-project.md`, `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/pages/index.astro`, `src/styles/global.css`, `package.json`, `.planning/config.json`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/phases/03-content-sections/03-CONTEXT.md`, `.planning/phases/01-foundation-design-system/01-RESEARCH.md`, `.planning/phases/02-layout-navigation-shell/02-PATTERNS.md`, `.planning/phases/02-layout-navigation-shell/02-UI-SPEC.md`, `Arquivos de design/code.html` (lines 240-410), `Arquivos de design/DESIGN.md` — all read in full or targeted-range during this session, 2026-09-03.
- [MDN `grid-auto-flow`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-flow) — fetched 2026-09-03, confirms sparse-vs-dense placement behavior and dense's reordering side effect (Pattern 4's central finding).
- [Tailwind CSS `background-image` docs](https://tailwindcss.com/docs/background-image) — fetched 2026-09-03, confirms `bg-gradient-to-*` → `bg-linear-to-*` rename in v4 (Pitfall 1).

### Secondary (MEDIUM confidence)
- [Astro Images guide](https://docs.astro.build/en/guides/images/) — fetched via WebFetch summary, 2026-09-03. Confirms `<Image>` usage with Content Collection `image()` fields, conditional-render pattern for optional fields. Summary-of-fetch, not verbatim doc text captured — see A1/A2 in Assumptions Log.
- [Astro Content Collections guide](https://docs.astro.build/en/guides/content-collections/) — fetched via WebFetch summary, 2026-09-03. Confirms `getCollection()` usage and sort-with-fallback pattern.
- [Astro `astro:assets` reference](https://docs.astro.build/en/reference/modules/astro-assets/) — fetched via WebFetch summary, 2026-09-03. Confirms `<Image>` prop requirements (`src`, `alt` required; `width`/`height` inferred for local/collection images).

### Tertiary (LOW confidence)
- WebSearch: "Astro content collections image() optional field coverImage undefined conditional render pitfall" — returned mostly tangential GitHub issue/discussion links, no single authoritative pitfall confirmation found; the conditional-render recommendation in this document rests on the Primary/Secondary sources above, not this search.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages, all APIs already verified present in Phase 1's own live registry checks.
- Architecture (grid mixed-span behavior, `<Image>` conditional pattern, Tailwind v4 gradient rename): HIGH — the two most load-bearing findings (grid-auto-flow sparse/dense behavior, Tailwind v4 gradient utility rename) are each confirmed against a single authoritative source (MDN, Tailwind's own docs) fetched live this session, not reconstructed from training data alone.
- Pitfalls: HIGH for Pitfalls 1, 4, 8 (each independently verified against an official source or direct codebase inspection); MEDIUM for Pitfalls 2, 3, 6 (sound reasoning + WebFetch-summarized official docs, not verbatim-quoted); LOW-risk-if-wrong but still MEDIUM confidence for Pitfall 5 (verified fact about current `Base.astro` state, but the "where to fix it" judgment is this researcher's own, correctly flagged as an Open Question rather than asserted as decided).

**Research date:** 2026-09-03
**Valid until:** ~2026-10-03 (30 days) — re-verify the Tailwind v4 gradient utility naming and `<Image>` prop requirements if planning is delayed past that window; both are the findings most likely to have shifted with a Tailwind/Astro minor release.
</content>
