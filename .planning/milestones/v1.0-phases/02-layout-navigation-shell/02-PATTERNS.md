# Phase 2: Layout & Navigation Shell - Pattern Map

**Mapped:** 2026-09-02
**Files analyzed:** 4 (1 modified layout, 2 new components, 1 modified stylesheet)
**Analogs found:** 4 / 4 — all analogs are Phase 1 codebase files (`src/layouts/Base.astro`, `src/styles/global.css`, `src/data/site.ts`) cross-checked against the design prototype (`Arquivos de design/code.html`), which remains valid prior art per Phase 1's precedent. No component (`.astro` file under `src/components/`) exists yet in the codebase — `src/components/` is created fresh in this phase, so Nav/Footer have no direct component-role analog and instead inherit structure from `Base.astro` (Astro authoring conventions) + `code.html` (markup/classes to port).

**Important — mobile toggle vanilla JS has no codebase analog.** No `<script>` block of any kind exists yet in this repo (Phase 1 shipped zero client-side JS). The vanilla-JS overlay toggle (D-01) is listed under "No Analog Found" — its full behavioral spec lives in `02-UI-SPEC.md` "Mobile full-screen overlay" section, which is authoritative since there is nothing to copy from.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/layouts/Base.astro` | layout component (modified) | request-response (renders shell + slot) | itself (Phase 1 version) + `Arquivos de design/code.html` lines 220-244, 398-410 | exact (structure to extend), role-match (content being added) |
| `src/components/Nav.astro` (new) | component (nav + mobile toggle + overlay) | request-response (render) + event-driven (toggle/focus-trap script) | `Arquivos de design/code.html` lines 224-244 (nav markup); `src/layouts/Base.astro` (Astro authoring/import conventions) | role-match (markup), no-analog (vanilla JS behavior — greenfield) |
| `src/components/Footer.astro` (new) | component (data-driven list render) | CRUD (maps `site.socials` array to links) | `Arquivos de design/code.html` lines 398-410 (footer markup); `src/data/site.ts` lines 58-63 (`socials` array shape) | role-match (markup + data shape) |
| `src/styles/global.css` | config (CSS primitives, modified) | transform (design tokens/spec → CSS) | itself (Phase 1 version, lines 226-261 primitives block) | exact (pattern to extend — add one more primitive) |

## Pattern Assignments

### `src/layouts/Base.astro` (layout component, modified)

**Analog:** itself — `src/layouts/Base.astro` (current Phase 1 state, read in full above) — this phase edits it in place, it does not get replaced.

**Current structure to extend** (`src/layouts/Base.astro` lines 37-48):
```astro
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>{title}</title>
  </head>
  <body class="bg-background text-on-background bg-grid-pattern relative min-h-screen">
    <div class="glow-cloud-top-right"></div>
    <div class="glow-cloud-bottom-left"></div>
    <slot />
  </body>
</html>
```

**What this phase adds, in order** (per `02-UI-SPEC.md` "Semantic landmarks" + "Skip link" sections — do not reorder, tab order matters):
1. Skip link as the *very first* focusable element in `<body>`, before the atmospheric glow divs and before `<Nav />`:
   ```astro
   <a href="#main-content" class="skip-link">Pular para o conteúdo</a>
   ```
   (D-04, copy verbatim — string is locked)
2. `<Nav />` component import + mount (new import line alongside existing `import "../styles/global.css";` block)
3. Wrap the existing `<slot />` in `<main id="main-content">` — this is the skip-link's target and the A11Y-01 landmark:
   ```astro
   <main id="main-content">
     <slot />
   </main>
   ```
4. `<Footer />` component import + mount, after `</main>`, before `</body>`

**Import pattern to follow** (`src/layouts/Base.astro` lines 1-28 — matches Astro's frontmatter-import convention already established):
```astro
---
import "../styles/global.css";
import "@fontsource/inter/400.css";
// ...existing font imports unchanged...
import Nav from "../components/Nav.astro";
import Footer from "../components/Footer.astro";

interface Props {
  title: string;
}

const { title } = Astro.props;
---
```

**Do not touch:** `lang="pt-BR"`, the font-import block, the `bg-grid-pattern`/glow-cloud divs — all explicitly called out in `02-CONTEXT.md` canonical_refs as "already correct... do not regress."

---

### `src/components/Nav.astro` (new component, request-response + event-driven)

**Analog:** `Arquivos de design/code.html` lines 224-244 (nav markup, prototype) — structure/classes to port, NOT verbatim (two corrections required, see below). Astro component conventions (frontmatter imports, `Props` interface, no default export) borrowed from `src/layouts/Base.astro` lines 1-35.

**Markup to port** (`Arquivos de design/code.html` lines 225-244):
```html
<nav class="bg-background/60 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_15px_rgba(0,240,255,0.1)] fixed top-0 w-full z-50">
  <div class="flex justify-between items-center w-full px-margin-mobile md:px-gutter py-4 max-w-container-max mx-auto">
    <div class="font-headline-md text-headline-md font-bold text-primary-container tracking-tighter">
      SYSTEM.CORE
    </div>
    <div class="hidden md:flex items-center gap-8 font-mono-label text-mono-label uppercase tracking-widest">
      <a class="text-on-surface-variant hover:text-primary-container transition-colors duration-300" href="#dossier">Dossier</a>
      <a class="text-on-surface-variant hover:text-primary-container transition-colors duration-300" href="#stack">Stack</a>
      <a class="text-on-surface-variant hover:text-primary-container transition-colors duration-300" href="#projects">Projects</a>
      <a class="text-on-surface-variant hover:text-primary-container transition-colors duration-300" href="#contact">Contact</a>
    </div>
    <button class="hidden md:block hover:bg-primary-container/10 transition-all duration-200 cursor-pointer active:scale-95 transition-transform px-4 py-2 border border-primary-container text-primary-container font-mono-label text-mono-label uppercase tracking-widest rounded-DEFAULT">
      Connect
    </button>
    <!-- Mobile Menu Toggle -->
    <button class="md:hidden text-primary-container">
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">menu</span>
    </button>
  </div>
</nav>
```

**Required corrections when porting (per `02-UI-SPEC.md`, do not copy these parts verbatim):**
- Brand wordmark: use `font-headline-md text-headline-md` only — **drop `font-bold`** (weight-conflict correction, UI-SPEC Typography table). Replace hardcoded `SYSTEM.CORE` text with `{site.brand}` from `src/data/site.ts`.
- Wrap the whole `<nav>` in `<nav aria-label="Navegação principal">` (semantic landmark, UI-SPEC "Semantic landmarks").
- Connect button (`<button>...Connect...</button>`) becomes a real `<a href="#contact">Connect</a>` — D-02, not inert, not a `<button>`. Use `rounded` (not `rounded-DEFAULT`, which doesn't exist as a Tailwind utility name — `rounded` is the bare utility per `01-PATTERNS.md`'s radius discrepancy flag).
- Mobile toggle: replace `<span class="material-symbols-outlined">menu</span>` with `astro-icon`'s `<Icon name="material-symbols:menu" />` (self-hosted SVG, per Phase 1's established icon pattern — see `src/pages/index.astro` line 10 `import { Icon } from "astro-icon/components";` and line 21 `<Icon name="material-symbols:menu" />`). Add `aria-label="Abrir menu de navegação"` and `aria-expanded="false"`, and pad the button to a 44×44px hit target (UI-SPEC Spacing exceptions).

**Icon import pattern** (`src/pages/index.astro` lines 9-10, 21):
```astro
---
import { Icon } from "astro-icon/components";
---
<Icon name="material-symbols:menu" />
```

**Data source for brand** (`src/data/site.ts` line 16):
```typescript
brand: "[Nome/Marca Aqui]",
```
Consume via `import { site } from "../data/site.ts"` then `{site.brand}` — do not hardcode "SYSTEM.CORE" or any other literal brand string in the component (placeholder-content convention, D-03 Phase 1, restated in `02-CONTEXT.md` code_context).

**No analog — mobile overlay + vanilla JS toggle (D-01):** Nothing in `code.html` or the current codebase implements an overlay, a focus trap, or any client-side script. `02-UI-SPEC.md` "Mobile full-screen overlay" section (lines 132-143) is the sole specification — implement directly from it:
- Trigger button toggles `aria-expanded` + swaps `<Icon name="material-symbols:menu">` ↔ `<Icon name="material-symbols:close">`
- Overlay: `position: fixed; inset: 0; z-index: 60; bg-background/95 backdrop-blur-xl; flex flex-col items-center justify-center gap-8`
- Behavior: focus trap while open (Tab/Shift+Tab cycles overlay links + close control only), `Escape` closes, closing restores focus to the toggle button, `overflow: hidden` on `<body>` while open
- No framework island — a single `<script>` tag (module or plain) inside `Nav.astro`, following Astro's standard "co-located script" pattern (a bare `<script>` in a `.astro` file is automatically scoped/bundled per-component by Astro — no special import needed, this is Astro's default behavior, not a project-specific pattern to hunt for in the codebase)

**Connect button reused inside overlay (D-02 UI-SPEC line 149):** same markup/classes as the desktop nav's `<a href="#contact">Connect</a>`, duplicated inside the overlay's link stack (not extracted to a sub-component — two small copies in one file is simpler than a shared subcomponent for this scope).

---

### `src/components/Footer.astro` (new component, CRUD — data-driven list render)

**Analog:** `Arquivos de design/code.html` lines 398-410 (footer markup) for structure; `src/data/site.ts` lines 58-63 (`socials` array) for the data-driven render loop — this is the first place in the codebase that maps over a `site.ts` array, so the loop syntax itself is standard Astro (`{array.map(...)}` in the template), not copied from an existing example.

**Markup to port** (`Arquivos de design/code.html` lines 399-409):
```html
<footer class="bg-surface-container-lowest w-full mt-section-gap border-t border-outline-variant/20">
  <div class="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-gutter py-unit gap-4 max-w-container-max mx-auto h-24">
    <div class="font-mono-label text-mono-label text-on-surface-variant">
      © 2024 SYSTEM_ARCHITECT // ALL RIGHTS RESERVED
    </div>
    <div class="flex gap-6 font-mono-code text-mono-code uppercase text-on-surface-variant">
      <a class="hover:text-primary-container transition-colors duration-300" href="#">GitHub</a>
      <a class="hover:text-primary-container transition-colors duration-300" href="#">LinkedIn</a>
      <a class="hover:text-primary-container transition-colors duration-300" href="#">Documentation</a>
    </div>
  </div>
</footer>
```

**Required corrections when porting (per `02-UI-SPEC.md` Footer + Typography sections, do not copy these parts verbatim):**
- Both text blocks use `font-mono-label text-mono-label` (14px/500) — **not** `font-mono-code text-mono-code` for the link row (UI-SPEC's explicit "footer text weight" correction collapses both to one weight, dropping the 3rd font weight that would otherwise appear).
- Copyright line: replace the hardcoded `© 2024 SYSTEM_ARCHITECT // ALL RIGHTS RESERVED` with the dynamic contract:
  ```astro
  © {new Date().getFullYear()} {site.brand} — todos os direitos reservados
  ```
  (UI-SPEC Copywriting Contract — build-time `Date`, reuses `site.brand`, no new `site.ts` field)
- Link row: replace the 3 hardcoded `GitHub`/`LinkedIn`/`Documentation` anchors with a map over `site.socials` (D-03):
  ```astro
  {site.socials.map((s) => (
    <a href={s.href} class="hover:text-primary-container transition-colors duration-300">
      {s.label}
    </a>
  ))}
  ```
  Use `.label` and `.href` only — **not** `.icon` (footer is text-style links, per UI-SPEC line 155 "not `.icon`; footer is text-style links, distinct from... Contact section's icon-circle treatment"). If `site.socials` is empty, the row silently renders nothing (no placeholder message needed — UI-SPEC "Empty state" row, N/A for this structural case).

**Data source** (`src/data/site.ts` lines 58-63):
```typescript
socials: [
  { icon: "material-symbols:code", href: "#", label: "PLACEHOLDER" },
  { icon: "material-symbols:work", href: "#", label: "PLACEHOLDER" },
  { icon: "material-symbols:mail", href: "#", label: "PLACEHOLDER" },
  { icon: "material-symbols:chat", href: "#", label: "PLACEHOLDER" },
],
```
Import via `import { site } from "../data/site.ts"` (same relative-path convention as `Nav.astro` will use — both components live at `src/components/*.astro`, one level below `src/`, matching `src/layouts/Base.astro`'s own `../styles/global.css` import depth).

---

### `src/styles/global.css` (config, modified — add one new primitive)

**Analog:** itself (Phase 1 version) — the existing custom-primitives block (lines 156-261) is the pattern to extend, not replace.

**Existing primitive pattern to match** (`src/styles/global.css` lines 232-238, closest sibling — same "single global selector, alpha-composite box-shadow, references a `--color-*` token" shape as the new rule):
```css
/* Cyan Glow Stroke — DESIGN.md "The Glow Stroke" (active/primary element
   borders). Border color reuses the primary-container token; the glow
   itself is an alpha composite with no token equivalent. */
.border-glow-cyan {
  border: 1px solid var(--color-primary-container);
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
}
```

**New primitive to add** (verbatim from `02-UI-SPEC.md` "Focus-visible glow" section, lines 165-172 — UI-SPEC is authoritative here since no prototype focus-state exists to cross-check against):
```css
:focus-visible {
  outline: 2px solid var(--color-primary-container);
  outline-offset: 2px;
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
  border-radius: var(--radius);
}
```
Append after the existing `.btn-primary:hover` block (lines 240-245) and before the scrollbar rules (lines 247-261), keeping the file's existing top-to-bottom ordering: atmospheric glows → grid → glass-panel → glow-stroke → button-hover → **focus-visible (new)** → scrollbar. Follow the same comment-header convention every other primitive uses (a `/* ... */` block above the rule citing the UI-SPEC/DESIGN.md source, per the file's established documentation style — see every existing block in this file for the pattern).

**Also add: `.skip-link` primitive** (needed by Base.astro's new skip-link markup, not explicitly named in UI-SPEC as a class but described structurally at UI-SPEC lines 158-160). Follow the same block style. Default (visually hidden but focusable — never `display:none`) + `:focus` (visible glass panel):
```css
.skip-link {
  position: absolute;
  transform: translateY(-100%);
  /* ... off-screen technique, never display:none (removes from tab order) */
}
.skip-link:focus {
  position: fixed;
  top: 16px; /* --spacing-unit * 2, or use var(--spacing-unit) twice */
  left: 16px;
  z-index: 100;
  /* glass-panel border-glow-cyan classes can be applied directly in markup
     instead of duplicated here — see Base.astro markup guidance above:
     class="skip-link glass-panel border-glow-cyan ..." composes existing
     Phase 1 primitives rather than re-declaring glass/glow in CSS */
}
```
Exact off-screen values are Claude's discretion (UI-SPEC does not pin exact pixel values for the hidden state, only the focus state's `fixed top-4 left-4 z-[100]` Tailwind utilities) — prefer composing the skip-link's focus-visible appearance from existing Tailwind utility classes (`fixed top-4 left-4 z-[100]`) plus the existing `.glass-panel` and `.border-glow-cyan` classes directly in `Base.astro`'s markup, reserving the `.skip-link` CSS class in `global.css` for only the off-screen-hiding mechanics that have no Tailwind utility equivalent.

---

## Shared Patterns

### Self-hosted-only / zero-external-origin discipline (SEC-01)
**Source:** `01-PATTERNS.md` "Zero-external-origin discipline" (Phase 1), restated in `02-CONTEXT.md` code_context
**Apply to:** `Nav.astro`, `Footer.astro` — both must use `astro-icon`'s `<Icon />` (never a `material-symbols-outlined` `<span>` or icon-font `<link>`), and must not introduce any `https://` href pointing at a third-party origin as a page dependency (data `href` values like social links are fine — they're navigation targets, not resource loads).
**Verification:** `scripts/verify-no-external-origins.mjs` runs against this phase's build (per `02-CONTEXT.md` Established Patterns).

### Placeholder-content marker convention (D-03, Phase 1)
**Source:** `src/data/site.ts` (already compliant), `01-PATTERNS.md` "Placeholder-content marker convention"
**Apply to:** Any new copy this phase introduces directly in markup (there should be very little — nav link labels "Dossier"/"Stack"/"Projects"/"Contact"/"Connect" are locked design-system vocabulary per UI-SPEC Copywriting Contract, NOT placeholder content, so they are exempt and should be hardcoded English strings, not routed through `site.ts`). Only `site.brand` (already a placeholder) flows through footer/nav.

### Astro co-located `<script>` pattern (vanilla JS, no framework island)
**Source:** No codebase analog exists (Phase 1 shipped zero client JS) — this is a fresh pattern introduced by this phase, sourced entirely from `02-UI-SPEC.md`'s "Mobile full-screen overlay" behavioral spec and Astro's own default `<script>`-in-`.astro`-file bundling behavior (framework-level convention, not project-specific).
**Apply to:** `Nav.astro` only.

### Tailwind utility class conventions already established (spacing/color/typography tokens)
**Source:** `src/styles/global.css` `@theme static` block (Phase 1) — `px-margin-mobile`, `md:px-gutter`, `max-w-container-max`, `text-headline-md`, `text-mono-label`, `bg-background`, `text-on-surface-variant`, `text-primary-container`, `border-outline-variant` etc. are all live utility classes already, no new tokens needed this phase.
**Apply to:** `Nav.astro`, `Footer.astro`, `Base.astro` skip-link markup — reuse verbatim, do not invent new spacing/color literals.

## No Analog Found

| File / Feature | Role | Data Flow | Reason | Use Instead |
|---|---|---|---|---|
| Mobile overlay open/close + focus-trap script (inside `Nav.astro`) | event-driven behavior | event-driven | Zero client-side `<script>` exists anywhere in the codebase (Phase 1 is fully static/zero-JS); `code.html` prototype has no mobile-open-state markup at all (confirmed in `02-CONTEXT.md` canonical_refs) | `02-UI-SPEC.md` "Mobile full-screen overlay" section (lines 132-143) — full behavioral spec, implement directly from it. Standard a11y focus-trap technique (query all focusable elements within the overlay container, cycle Tab/Shift+Tab, listen for `Escape` on `document`, restore `.focus()` to the trigger button on close) |
| `.skip-link` CSS class exact off-screen technique | utility CSS | transform | No skip-link of any kind exists in `code.html` or current `global.css` | Standard "clip/absolute + translateY(-100%)" off-screen pattern (never `display:none`) — combine with existing `.glass-panel`/`.border-glow-cyan` primitives for the `:focus` state, per UI-SPEC line 160 |

## Metadata

**Analog search scope:** `src/` (full — `Base.astro`, `site.ts`, `global.css`, `index.astro`, all read in full, no re-reads), `Arquivos de design/code.html` (targeted reads: lines 1-50, 218-248, 395-411 — non-overlapping ranges), `.planning/phases/01-foundation-design-system/01-PATTERNS.md` (read in full for established-convention cross-reference), `scripts/` (Glob only, not read — filenames confirm SEC-01 verification tooling exists, content not needed for pattern extraction).
**Files scanned:** 6 (`src/layouts/Base.astro`, `src/data/site.ts`, `src/styles/global.css`, `src/pages/index.astro`, `Arquivos de design/code.html`, `01-PATTERNS.md`)
**Pattern extraction date:** 2026-09-02
