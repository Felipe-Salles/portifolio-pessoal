# Phase 3: Content Sections - Pattern Map

**Mapped:** 2026-09-03
**Files analyzed:** 4 (1 modified page, 1 modified data file, 1 modified stylesheet, 1 possibly-modified layout)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `src/pages/index.astro` (Hero/Dossier/Stack sections) | component (page, static section) | request-response (build-time render of `site.ts`) | `src/components/Footer.astro` | role-match (static singleton-data component) |
| `src/pages/index.astro` (Projects section) | component (page, collection-driven) | CRUD (read-only list) / batch | `src/components.Nav.astro` — mobile overlay `.map()` over `site.socials` for the loop shape; `src/content.config.ts` for the schema being consumed | role-match (no existing `getCollection()` consumer yet in the codebase — first one) |
| `src/pages/index.astro` (Contact section) | component (page, static section) | request-response | `src/components/Footer.astro` | exact (same data source `site.socials`, same `rel="noopener noreferrer"` pattern, only visual treatment differs per D-11) |
| `src/data/site.ts` (add `contactHeading`/`contactSubtitle`) | model (typed const singleton) | CRUD (static data addition) | `src/data/site.ts` itself (existing `heroHeading`/`heroSubtitle` fields) | exact (same file, same convention, additive edit) |
| `src/styles/global.css` (add gradient-fallback hover primitive) | utility (CSS primitive) | transform | `src/styles/global.css` (`.border-glow-cyan`, `.btn-primary:hover`) | exact (same file, same primitive-authoring convention) |
| `src/layouts/Base.astro` (possible `<main>` wrapper edit, Pitfall 5) | component (layout) | request-response | `src/layouts/Base.astro` itself (Nav/Footer's own internal `px-margin-mobile md:px-gutter max-w-container-max mx-auto` wrapper pattern) | exact (same wrapper classes already used twice, just not yet on `<main>`) |

## Pattern Assignments

### `src/pages/index.astro` — Hero, Dossier, Tech Stack sections (component, request-response)

**Analog:** `src/components/Footer.astro` (static-data-driven component reading `site.ts`) + `src/layouts/Base.astro` (frontmatter comment convention, import style)

**Imports pattern** (`src/components/Footer.astro` lines 21-22, `src/pages/index.astro` lines 9-10):
```astro
---
// Source: Arquivos de design/code.html lines ... (prototype markup),
// adapted per 0X-PATTERNS.md "..." section.
import { site } from "../data/site.ts";
---
```
For `index.astro` specifically, the existing import block (lines 9-10) already has:
```astro
import Base from "../layouts/Base.astro";
import { Icon } from "astro-icon/components";
```
Add `import { site } from "../data/site.ts";` and, for Projects, `import { getCollection } from "astro:content";` and `import { Image } from "astro:assets";`.

**Data-binding pattern** (`src/components/Footer.astro` lines 26-27):
```astro
<div class="font-mono-label text-mono-label text-on-surface-variant">
  © {new Date().getFullYear()} {site.brand} — todos os direitos reservados
</div>
```
Direct `{site.fieldName}` interpolation, no intermediate transform — mirror this for `{site.heroHeading}`, `{site.title}`, `{site.heroSubtitle}`, `{site.availabilityStatus}`, `{site.bio}`/`{site.systemSpecs}`, `{site.techStack.*}`.

**Array-map pattern** (`src/components/Footer.astro` lines 30-38):
```astro
<div data-footer-socials class="flex gap-6 font-mono-label text-mono-label uppercase text-on-surface-variant">
  {site.socials.map((s) => (
    <a
      href={s.href}
      rel="noopener noreferrer"
      class="hover:text-primary-container transition-colors duration-300"
    >
      {s.label}
    </a>
  ))}
</div>
```
Reuse this exact `.map()`-in-JSX-expression shape for `site.bio.map(...)`, `site.systemSpecs.map(...)`, and the Tech Stack `categories.map(...)` (Pattern 3 in RESEARCH.md).

**Section `id` + `scroll-mt` pattern:** Neither Footer nor Nav currently demonstrates a `scroll-mt-*` anchor target (Nav's own links point at `#dossier`/`#stack`/`#projects`/`#contact` — see `src/components/Nav.astro` lines 44, 49, 52, 56 for the exact anchor strings that must match section `id`s verbatim). No existing analog for `scroll-mt-32`; RESEARCH.md's Pattern 2/3 code is the source of truth for this (`<section class="scroll-mt-32" id="dossier">`).

**Primitive reuse (no new CSS needed):** `glass-panel`, `border-glow-cyan` — both already defined in `src/styles/global.css` lines 226-238, already consumed once each (`Base.astro` skip-link uses both; no section-card usage yet — Phase 3 is the first consumer for card/panel treatments).

---

### `src/pages/index.astro` — Projects section (component, CRUD/batch — collection read)

**Analog:** No existing `getCollection()` consumer exists in the codebase yet — this is a genuinely new pattern for this phase (RESEARCH.md's Pattern 4 is the primary source, not a codebase analog). The closest structural analog for the **loop-and-map shape** is still `src/components/Footer.astro` lines 30-38 (array `.map()` → JSX) and `src/components/Nav.astro`'s mobile-overlay repeated-anchor block (lines 103-123, four near-identical `<a>` blocks) for the **card-repetition visual shape**.

**Schema being consumed** (`src/content.config.ts` lines 16-38):
```typescript
schema: ({ image }) =>
  z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    liveUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    coverImage: image().optional(),
    featured: z.boolean().optional(),
    order: z.number().optional(),
  }),
```
Every field Pattern 4 (RESEARCH.md) reads (`project.data.title`, `.description`, `.tags`, `.liveUrl`, `.repoUrl`, `.coverImage`, `.featured`, `.order`) is already typed here — no schema change needed.

**Current placeholder entry** (`src/content/projects/placeholder-project.md`, full file):
```markdown
---
title: "[Nome do Projeto]"
description: "PLACEHOLDER — descrição do projeto a definir"
tags: ["PLACEHOLDER"]
---

PLACEHOLDER — conteúdo do projeto a definir.
```
No `coverImage`, `featured`, or `order` set — confirms the gradient-fallback branch (D-08) is the only visual path this phase actually exercises against real data; the `<Image>` branch is correct-but-currently-dead code until a real `coverImage` asset is added (v2).

**External link `rel` pattern** (`src/components/Footer.astro` line 33, exact precedent T-02-17 referenced by D-13):
```astro
<a
  href={s.href}
  rel="noopener noreferrer"
  class="hover:text-primary-container transition-colors duration-300"
>
```
Apply identically to every `liveUrl`/`repoUrl` anchor in project cards.

**Core pattern to use verbatim:** RESEARCH.md Pattern 4 (`getCollection`, two-array featured/rest split-then-concat sort, `class:list` for conditional `md:col-span-2 border-glow-cyan`, ternary `<Image>` vs. gradient-fallback `<div>`). This is pre-verified against official docs and the MDN `grid-auto-flow` spec — copy it directly rather than re-deriving.

---

### `src/pages/index.astro` — Contact section (component, request-response)

**Analog:** `src/components/Footer.astro` (exact same data source, same external-link safety attribute; only the visual container differs per D-11)

**Imports pattern:** same `import { site } from "../data/site.ts";` already present at page level (shared with Hero/Dossier/Stack — no duplicate import needed since all sections live in one file per RESEARCH.md's "Recommended Project Structure").

**Icon-button pattern (new shape, no existing circular-icon-button analog):** `src/components/Nav.astro` lines 75-85 is the closest analog for "icon-only interactive element with `aria-label`" (the mobile toggle `<button>` uses `aria-label` + inline `<Icon>` with no visible text):
```astro
<button
  type="button"
  data-nav-toggle
  aria-label="Abrir menu de navegação"
  aria-expanded="false"
  aria-controls="nav-overlay"
  class="md:hidden inline-flex items-center justify-center w-11 h-11 mr-unit text-primary-container"
>
  <Icon name="material-symbols:menu" data-nav-icon="menu" />
  <Icon name="material-symbols:close" data-nav-icon="close" />
</button>
```
Contact's circular buttons are `<a>` not `<button>` (external links, not JS-driven toggles), but the `aria-label`-carries-the-accessible-name pattern transfers directly — use `aria-label={s.label}` exactly as this button uses a static `aria-label` string (RESEARCH.md Pattern 6, Open Question 2 already resolves this).

**`rel="noopener noreferrer"` + `site.socials` map:** identical to Footer's pattern above (Footer.astro lines 30-38) — same array, same attribute, different `class` (circular `w-12 h-12 rounded-full` per D-11 instead of Footer's plain text-link row).

---

### `src/data/site.ts` — add `contactHeading`/`contactSubtitle` (model, CRUD — static data addition)

**Analog:** `src/data/site.ts` itself — the existing `heroHeading`/`heroSubtitle` fields (lines 27-31) are the exact convention to replicate:
```typescript
// Hero heading (HERO-01).
heroHeading: "[Nome/Marca Aqui]",

// Hero subtitle (HERO-01).
heroSubtitle: "PLACEHOLDER — subtítulo a definir",
```
Append, following the same comment-then-field style, referencing the requirement ID (`CONT-01`) and `D-12`:
```typescript
// Contact section invitational heading (CONT-01, D-12).
contactHeading: "PLACEHOLDER — título do convite a definir",

// Contact section invitational subtitle (CONT-01, D-12).
contactSubtitle: "PLACEHOLDER — subtítulo do convite a definir",
```
Placement: add near the end of the `site` object (after `socials`), since Contact is visually the last section — matches the file's existing top-to-bottom-matches-page-order organization (brand/name → hero fields → bio/specs → techStack → socials).

**Convention note (D-03 precedent, still binding):** bracketed `[…]` for short identity-style fields, `PLACEHOLDER — … a definir` for descriptive/paragraph fields — `contactHeading`/`contactSubtitle` are descriptive, so both use the `PLACEHOLDER — … a definir` form, matching `heroSubtitle`'s pattern rather than `brand`'s bracket pattern.

---

### `src/styles/global.css` — gradient-fallback hover primitive (utility, transform)

**Analog:** `src/styles/global.css` lines 240-245, `.btn-primary:hover` — the file's existing convention for "a class with no base styling, only a `:hover`/state variant, because the base styling is fully expressed via Tailwind utility classes in the markup":
```css
/* Primary Button Hover — DESIGN.md "Components" (CTA hover glow +
   brightness increase). Background reuses the primary-fixed token. */
.btn-primary:hover {
  box-shadow: 0 0 16px rgba(0, 240, 255, 0.6);
  background-color: var(--color-primary-fixed);
}
```
Follow this exact shape for the new D-09 gradient-fallback hover primitive — name it something like `.cover-fallback:hover` / `.cover-fallback-icon` (already referenced by class name in RESEARCH.md Pattern 4's markup: `class="cover-fallback ..."` / `class="cover-fallback-icon ..."`), scoped to the `group-hover` interaction already used for the real-photo grayscale effect so both fallback and real-photo hover states share the same `.group:hover` trigger on the parent `<article>`. Example shape (subtle glow + icon opacity/scale bump per D-09's "subtle, not a full effect swap"):
```css
/* Project card gradient fallback hover (D-09) — subtle reaction only, the
   grayscale->color reveal (group-hover:grayscale-0) is reserved for real
   coverImage photos per CONTEXT.md D-09. */
.group:hover .cover-fallback {
  box-shadow: inset 0 0 24px rgba(0, 240, 255, 0.15);
}
.group:hover .cover-fallback-icon {
  opacity: 0.9;
  transform: scale(1.05);
}
```
Place this new rule block immediately after `.btn-primary:hover` (lines 240-245) or after `.border-glow-cyan` (lines 232-238) — both are thematically adjacent (hover-state primitives, cyan glow language).

**Media-query convention** (`src/styles/global.css` lines 209-213, already satisfies LAY-01's "reduced background grid" — no new media query needed for that sub-requirement):
```css
@media (max-width: 768px) {
  .bg-grid-pattern {
    background-size: 32px 32px;
  }
}
```

---

## Shared Patterns

### External link safety (`rel="noopener noreferrer"`)
**Source:** `src/components/Footer.astro` line 33 (Phase 2, T-02-17)
**Apply to:** every `liveUrl`/`repoUrl` anchor in Projects, every `site.socials[].href` anchor in Contact
```astro
<a href={s.href} rel="noopener noreferrer" ...>
```
No wrapper/helper component — apply the attribute directly at each of the ~6 call sites, consistent with RESEARCH.md's explicit "Don't Hand-Roll" guidance against building a safe-link component for this few call sites.

### Static-singleton data binding (`site.ts` → component)
**Source:** `src/components/Footer.astro` (whole file), `src/components/Nav.astro` line 39 (`{site.brand}`)
**Apply to:** Hero, Dossier, Tech Stack, Contact sections
```astro
import { site } from "../data/site.ts";
// then: {site.fieldName} or site.arrayField.map((x) => (...))
```

### Section anchor targets matching Nav's existing hrefs
**Source:** `src/components/Nav.astro` lines 44, 49, 52, 56 and 105, 109, 113, 117 (desktop + mobile overlay nav links)
```astro
<a ... href="#dossier">Dossier</a>
<a ... href="#stack">Stack</a>
<a ... href="#projects">Projects</a>
<a ... href="#contact">Contact</a>
```
**Apply to:** the `id` attribute of the Dossier/Stack/Projects/Contact `<section>` elements in `index.astro` — must be exactly `dossier`/`stack`/`projects`/`contact` (no prefix/suffix) or Nav's existing anchors silently break.

### `glass-panel` / `border-glow-cyan` primitive reuse
**Source:** `src/styles/global.css` lines 226-238; current usage precedent `src/layouts/Base.astro` line 46 (skip-link combines both classes)
```astro
class="glass-panel ... border-glow-cyan ..."
```
**Apply to:** Dossier's System Specs panel, Tech Stack category cards, featured Project cards, Contact's outer panel — per RESEARCH.md Patterns 2/3/4/6.

### Comment-header convention for ported prototype markup
**Source:** every existing `.astro` file in `src/` (`Nav.astro` lines 2-27, `Footer.astro` lines 2-20, `Base.astro` lines 2-9) — each frontmatter opens with a `// Source: Arquivos de design/code.html lines X-Y ...` comment plus a list of "Mandatory deviations from the prototype."
**Apply to:** every new section block added to `index.astro` — cite the specific `code.html` line range from CONTEXT.md's canonical_refs (Hero 248-263, Dossier 265-292, Stack 294-325, Projects 327-377, Contact 379-396) and list the Tailwind v4 corrections (Pitfall 1 `bg-linear-to-*`, `<Image>` vs `background-image` Pitfall 8, bare `rounded` not `rounded-DEFAULT`).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/pages/index.astro` — Projects section's `getCollection()` call itself | component (collection query) | CRUD (read) | No prior `getCollection()` consumer exists anywhere in the codebase yet — Phase 1 only defined the schema (`content.config.ts`), never queried it. RESEARCH.md Pattern 4 (official-docs-verified) is the primary source for this specific piece, not a codebase analog. Confidence remains HIGH since RESEARCH.md's pattern is independently doc-cited. |
| `src/styles/global.css` gradient-fallback hover primitive (D-09 exact composition) | utility (CSS primitive) | transform | No existing primitive combines a `group-hover` parent trigger with a gradient-panel child in this codebase yet (the grayscale-hover on real photos, Pitfall 8, is new to this phase too — plain Tailwind utility classes, not a custom primitive). The `.btn-primary:hover` shape (state-only class) is a structural analog for *how to write the CSS*, but not for *what the effect looks like* — exact color-stop/icon choice is Claude's Discretion per CONTEXT.md, no locked analog to copy value-for-value. |

## Metadata

**Analog search scope:** `src/components/`, `src/layouts/`, `src/pages/`, `src/data/`, `src/content/`, `src/styles/`, `src/content.config.ts` (entire `src/` tree — small enough for exhaustive read rather than sampled glob/grep search)
**Files scanned:** `src/data/site.ts`, `src/content.config.ts`, `src/layouts/Base.astro`, `src/pages/index.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/content/projects/placeholder-project.md`, `src/styles/global.css` (8 files, all read in full — none exceeded 2,000 lines, no offset/limit reads needed)
**Pattern extraction date:** 2026-09-03
