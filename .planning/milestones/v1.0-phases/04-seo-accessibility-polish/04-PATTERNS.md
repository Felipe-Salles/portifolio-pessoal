# Phase 4: SEO, Accessibility & Polish - Pattern Map

**Mapped:** 2026-09-03
**Files analyzed:** 14 (9 new, 5 modified)
**Analogs found:** 11 / 14 (3 generated static binary/text assets have no codebase analog — see "No Analog Found")

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/pages/404.astro` (new) | route/page | request-response | `src/pages/index.astro` | exact (page-importing-Base pattern) |
| `src/pages/og-template/index.astro` (new) | route/page (standalone, non-Base) | transform (render-only) | `src/layouts/Base.astro` (head/html shell) + `src/pages/index.astro` (Hero markup to copy verbatim) | role-match |
| `src/layouts/Base.astro` (modify) | layout | transform | itself (current version) + RESEARCH.md Pattern 1 | exact (extending existing file) |
| `src/pages/index.astro` (modify — aria-hidden + description prop only) | route/page | request-response | itself (current version) | exact |
| `src/data/site.ts` (modify — add `metaDescription` field) | model/config data | transform | itself (current version, placeholder convention) | exact |
| `astro.config.mjs` (modify — add `site` + sitemap integration) | config | batch (build-time) | itself (current version) | exact |
| `public/favicon.svg` / `.ico` / `apple-touch-icon.png` (new) | static asset | file-I/O (generated) | none — first files under `public/` | no analog |
| `public/robots.txt` (new) | config/static asset | file-I/O (static) | none — first files under `public/` | no analog (trivial, RESEARCH.md Pattern 2 fully specifies content) |
| `scripts/generate-favicons.mjs` (new) | utility/script (one-time generator) | file-I/O / batch | `scripts/verify-design-tokens.mjs`, `scripts/verify-no-external-origins.mjs` | role-match (script conventions), different data flow (generate vs verify) |
| `scripts/generate-og-image.mjs` (new) | utility/script (build-chained generator) | file-I/O / batch, spawns a subprocess | `scripts/verify-shell.mjs` (script header/exit-code conventions) | role-match, different data flow |
| `scripts/verify-a11y.mjs` (new) | utility/script (build gate) | batch | `scripts/verify-shell.mjs`, `scripts/verify-no-external-origins.mjs` | exact (same "gate script" role + summary-line/exit-code data flow) |
| `package.json` (modify — new deps + `verify:*` scripts) | config | batch | itself (current version) | exact |

## Pattern Assignments

### `src/pages/404.astro` (route/page, request-response)

**Analog:** `src/pages/index.astro`

**Imports pattern** (`src/pages/index.astro` lines 39-43):
```astro
import Base from "../layouts/Base.astro";
import { site } from "../data/site.ts";
import { Icon } from "astro-icon/components";
```
404 only needs the first two (no `Icon`/`getCollection`/`Image` — D-07 is typography-only).

**Core pattern — exact markup already locked by `04-UI-SPEC.md` "404 page" section** (copy verbatim, this is not illustrative like RESEARCH.md's sketch — it is the approved final contract):
```astro
---
import Base from "../layouts/Base.astro";
---
<Base
  title="Página não encontrada — [Nome/Marca Aqui]"
  description="A rota solicitada não existe neste sistema."
>
  <section class="min-h-[60vh] flex flex-col items-center justify-center text-center glass-panel border-glow-cyan rounded-xl p-12 max-w-2xl mx-auto">
    <p class="font-mono-label text-mono-label text-primary-container uppercase tracking-widest mb-4">
      &gt;_ ERRO 404 — ROTA NÃO ENCONTRADA
    </p>
    <h1 class="font-headline-md text-headline-md text-white mb-8">
      O sistema não localizou este caminho.
    </h1>
    <a
      href="/"
      class="btn-primary bg-primary-container text-on-primary-container font-mono-label text-mono-label uppercase tracking-widest px-8 py-4 rounded transition-all duration-300 cursor-pointer active:scale-95 inline-flex items-center gap-2"
    >
      VOLTAR AO INÍCIO
    </a>
  </section>
</Base>
```
Note: no `<Icon>` on this CTA (unlike the Hero's `VER PROJETOS` + `arrow-forward` in `index.astro` line 90-96) — D-07 scopes this page to typography-only primitives.

**Layout/landmark pattern:** `Base` already renders `<Nav />` and `<Footer />` — do not re-import or re-render either (see `src/layouts/Base.astro` lines 51 and 55). `src/pages/index.astro` never contains its own `<main>` tag (verified by `scripts/verify-shell.mjs`'s "nested landmarks" check group, lines 371-387) — `404.astro` must follow the same rule: content only, no `<main>`/`<nav>`/`<footer>` of its own.

**Error handling:** N/A — fully static page, no data fetching, no try/catch needed (unlike `index.astro`'s `getCollection("projects")` call, 404 has zero async data).

---

### `src/pages/og-template/index.astro` (route/page, standalone, transform)

**Analog 1 — head/html shell structure:** `src/layouts/Base.astro` (but this page must NOT extend `Base` — no Nav/Footer/skip-link per `04-UI-SPEC.md` line 145). Use `Base.astro`'s raw `<html lang="pt-BR">`/`<head>` opening structure as the shape to hand-write a minimal standalone version:
```astro
<!-- src/layouts/Base.astro lines 39-45 (structure to mirror, NOT to reuse via import) -->
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>{title}</title>
  </head>
  <body class="bg-background text-on-background bg-grid-pattern relative min-h-screen">
```
Add `<meta name="robots" content="noindex" />` to this page's own `<head>` (RESEARCH.md Pitfall 3, `04-UI-SPEC.md` line 147) — this is the one deliberate deviation from the mirrored shell.

**Analog 2 — visual composition to copy verbatim (D-02):** `src/pages/index.astro` Hero section, lines 76-97 (availability badge + heading + title line) plus `Base.astro`'s glow-cloud divs, lines 49-50:
```astro
<!-- src/pages/index.astro lines 77-86 — badge + heading + title-line classes -->
<div class="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-outline-variant/50 bg-surface-container/50 rounded font-mono-label text-mono-label text-primary-container">
  <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
  &gt;_ {site.availabilityStatus}
</div>
<h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg font-semibold tracking-tight text-white mb-4 uppercase">
  {site.heroHeading}
</h1>
<p class="font-mono-label text-mono-label text-primary-container uppercase tracking-widest mb-6">
  {site.title}
</p>
```
```astro
<!-- src/layouts/Base.astro lines 49-50 -->
<div class="glow-cloud-top-right" aria-hidden="true"></div>
<div class="glow-cloud-bottom-left" aria-hidden="true"></div>
```
Since this page is only ever rendered at a fixed 1200×630 viewport for a screenshot (never a real visitor viewport), only the `md:` desktop typography variant paints — `04-UI-SPEC.md` line 58 confirms this is expected, not a bug to "fix."

**Sitemap exclusion (build-config, not markup):** wire into `astro.config.mjs`'s sitemap `filter` — see that file's pattern section below. RESEARCH.md Pitfall 3 warning sign: check `sitemap-0.xml` after build does NOT contain `/og-template/`.

---

### `src/layouts/Base.astro` (layout, transform) — MODIFY

**Analog:** itself, current version (already the closest possible analog — this is an in-place extension, not a new file).

**Current Props (to extend)** (lines 32-36):
```astro
interface Props {
  title: string;
}

const { title } = Astro.props;
```

**Target shape per RESEARCH.md Pattern 1 + `04-UI-SPEC.md` line 166** (description required, ogImage/ogType optional with defaults):
```astro
interface Props {
  title: string;
  description: string;
  ogImage?: string; // defaults to the shared /og-image.png
  ogType?: "website" | "article";
}
const {
  title,
  description,
  ogImage = "/og-image.png",
  ogType = "website",
} = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL(ogImage, Astro.site);
```

**Head block to add** (after existing `<title>{title}</title>` line 43) — see RESEARCH.md Pattern 1 for the full meta-tag block (description, canonical, OG, Twitter Card) plus favicon `<link>` tags per `04-UI-SPEC.md` line 162 (exact `rel` values are implementation detail, not a design decision).

**Decorative div pattern — aria-hidden addition (D-12)** (lines 49-50, current):
```astro
<div class="glow-cloud-top-right"></div>
<div class="glow-cloud-bottom-left"></div>
```
becomes:
```astro
<div class="glow-cloud-top-right" aria-hidden="true"></div>
<div class="glow-cloud-bottom-left" aria-hidden="true"></div>
```

**Import convention to follow for any new script/asset reference** (lines 10-30) — per-file/per-weight imports, never a bare package-root import; no new external origins (SEC-01 non-regression, enforced by `scripts/verify-no-external-origins.mjs`).

---

### `src/pages/index.astro` (route/page, request-response) — MODIFY (aria-hidden + description prop only)

**Analog:** itself, current version.

**`<Base>` call site to extend** (line 75, current):
```astro
<Base title="Portfólio Dev — Felipe Salles">
```
add the new required `description` prop, reading from `site.ts`'s new `metaDescription` field (per `04-UI-SPEC.md` line 101):
```astro
<Base title="Portfólio Dev — Felipe Salles" description={site.metaDescription}>
```

**Decorative icon #1 — Hero CTA arrow (D-11)** (line 95, current):
```astro
<Icon name="material-symbols:arrow-forward" class="text-xl" />
```
becomes:
```astro
<Icon name="material-symbols:arrow-forward" class="text-xl" aria-hidden="true" />
```
(the `<a>` at lines 90-96 already carries the visible "VER PROJETOS" text — confirmed via `astro-icon`'s prop-spreading behavior, RESEARCH.md Pattern 3, verified directly against `node_modules/astro-icon/components/Icon.astro`.)

**Decorative icon #2 — project cover fallback (D-11)** (line 157, current):
```astro
<Icon name="material-symbols:code" class="cover-fallback-icon w-12 h-12 text-primary-container/60 transition-all duration-500" />
```
becomes:
```astro
<Icon name="material-symbols:code" class="cover-fallback-icon w-12 h-12 text-primary-container/60 transition-all duration-500" aria-hidden="true" />
```

**Explicitly NOT touched (D-13, `04-UI-SPEC.md` line 175):** the `open-in-new`/`code` icons inside the "Live"/"Repo" links (lines 171, 176) are NOT purely decorative — do not add `aria-hidden` there. Tech-stack badges (line 131) and tag pills (line 165) stay untouched — real visible `<span>` text.

---

### `src/data/site.ts` (model/config data, transform) — MODIFY

**Analog:** itself, current version — extend using the exact same placeholder convention already established.

**Convention to follow** (lines 21-25, existing fields, showing the bracketed vs. `PLACEHOLDER — … a definir` styles):
```typescript
title: "PLACEHOLDER — título/persona a definir",
availabilityStatus: "PLACEHOLDER — disponibilidade a definir",
```

**New field to add** (per `04-UI-SPEC.md` line 101, exact literal locked):
```typescript
// Meta description for SEO-01 (150-160 chars target). Base.astro's
// default `description` prop value for "/"; 404.astro overrides with a
// page-specific literal instead of reading this field.
metaDescription: "PLACEHOLDER — meta description a definir (150–160 caracteres)",
```
Place it alongside the other identity/meta-adjacent fields (near `title`/`heroSubtitle`), not inside `techStack`/`socials`.

---

### `astro.config.mjs` (config, batch) — MODIFY

**Analog:** itself, current version.

**Current structure** (full file, 15 lines):
```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  output: "static",
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Target shape** (RESEARCH.md Code Examples, "astro.config.mjs additions"):
```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "static",
  // TODO(Phase 5): replace with the real production domain once DEPLOY-01
  // assigns it — every og:image/canonical/sitemap/robots.txt URL depends on
  // this. ".example" is an RFC 2606-reserved placeholder TLD, guaranteed
  // never to resolve to a real site.
  site: "https://portfolio-felipe-salles.example",
  integrations: [
    icon(),
    sitemap({
      filter: (page) => !page.includes("/og-template/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```
Preserves the existing file's comment-header convention (line 1-2 cites its RESEARCH.md source) — add an equivalent citation line for the sitemap addition.

---

### `scripts/verify-a11y.mjs` (utility/script, batch — build gate) — NEW

**Analog:** `scripts/verify-shell.mjs` (closest — same "gate script" role, same violations-array + summary-line + exit-code contract) and `scripts/verify-no-external-origins.mjs` (simpler sibling of the same contract).

**Header/contract-comment convention to follow** (`scripts/verify-no-external-origins.mjs` lines 1-20):
```javascript
#!/usr/bin/env node
// SEC-01 gate — deterministic scan of dist/ for any external network origin
// (script/font/icon). Plain Node ESM, zero dependencies (node:fs/node:path only).
//
// Contract (see 01-01-PLAN.md Task 1):
// - Exit 1 immediately if dist/ does not exist, with a fixed message (RED state
//   before any build has run).
// ...
// - Always prints exactly one summary line before exiting:
//     SEC01 SUMMARY files=<n> woff2=<n> fontface=<n> inline_svg=<n> external_refs=<n>
// - Exits 0 only when external_refs=0.
```
`verify-a11y.mjs` should declare an equivalent fixed contract comment up front, e.g. `A11Y SUMMARY routes=<n> violations=<n> incomplete_resolved=<n> exit=<0|1>` — see RESEARCH.md Architecture Patterns "System Architecture Diagram" `npm run verify:a11y` block for the exact required behavior (scans `/` and `/404.html`, WCAG2A+WCAG2AA tags, routes `.glass-panel`/`.border-glow-cyan` `incomplete` results into the Pattern-4 pixel-sampling check).

**Violation-accumulation pattern to follow** (`scripts/verify-shell.mjs` lines 51-54):
```javascript
const violations = [];
function addViolation(check, detail) {
  violations.push({ check, detail });
}
```

**dist/ existence guard to follow** (`scripts/verify-no-external-origins.mjs` lines 43-50):
```javascript
function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}
```

**Summary line + exit code convention to follow** (`scripts/verify-no-external-origins.mjs` lines 198-208):
```javascript
if (violations.length > 0) {
  for (const v of violations) {
    console.error(`${v.filePath}:${v.line}: ${v.reason}`);
  }
}

console.log(
  `SEC01 SUMMARY files=${filesScanned} woff2=${woff2Count} fontface=${fontfaceCount} inline_svg=${inlineSvgCount} external_refs=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
```

**New technical content this script needs (no direct codebase analog, RESEARCH.md is the source):** spawning `astro preview` as a subprocess, driving it with Playwright + `@axe-core/playwright`, and the Pattern 4 pixel-sampling supplementary check — see RESEARCH.md "Pattern 4: Supplementary pixel-sampling contrast check" (lines 304-338 of 04-RESEARCH.md) for the concrete `sharp`/`wcag-contrast` sketch. This part has no existing project analog because it's the first script in this project to drive a real browser — treat the verify-*.mjs scripts above only as the *contract/conventions* analog (header comment, violations array, summary line, exit code), not as a source for the Playwright/axe mechanics themselves.

---

### `scripts/generate-favicons.mjs` and `scripts/generate-og-image.mjs` (utility/script, file-I/O) — NEW

**Analog:** `scripts/verify-design-tokens.mjs` and `scripts/verify-shell.mjs` for Node ESM script conventions only (shebang line, `node:fs`/`node:path` imports, structured comment header explaining contract/purpose) — data flow differs (these generate output rather than verify it), so copy *structure*, not logic.

**Convention to follow — shebang + contract header** (`scripts/verify-design-tokens.mjs` lines 1-20):
```javascript
#!/usr/bin/env node
// Token fidelity gate — re-derives expected values from
// `Arquivos de design/DESIGN.md` (source of truth) on every run and diffs
// them against `src/styles/global.css`'s @theme block and the built
// dist/ CSS. Plain Node ESM, zero dependencies ...
//
// Contract (see 01-02-PLAN.md Task 2):
// - ...
```
`generate-favicons.mjs`/`generate-og-image.mjs` should declare an equivalent up-front contract comment (inputs, outputs, when it runs — one-time dev script vs. every-build step per RESEARCH.md Assumption A4).

**No direct logic analog exists** for `sharp` SVG-to-PNG rasterization, `png-to-ico` multi-res packing, or the Playwright screenshot-a-live-preview-server flow — these are new patterns for this codebase. Follow RESEARCH.md's "System Architecture Diagram" (lines 141-191 of 04-RESEARCH.md) for the exact build-step sequencing and RESEARCH.md's Standard Stack table for library usage.

---

### `public/robots.txt` (static asset, file-I/O) — NEW

**No codebase analog** (first file under `public/`). Content is fully specified, non-discretionary per CONTEXT.md ("no gray area was raised; standard `@astrojs/sitemap` output permitting full indexing") — copy directly from RESEARCH.md Pattern 2:
```
User-agent: *
Allow: /

Sitemap: https://<production-domain>/sitemap-index.xml
```
The `Sitemap:` line's domain must match `astro.config.mjs`'s `site` value exactly (same placeholder-then-Phase-5-swap concern as Pitfall 1/2).

---

### `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png` (static assets) — NEW

**No codebase analog** — first binary/vector static assets in this project outside `Arquivos de design/`. Fully specified by `04-UI-SPEC.md` "Favicon" subsection (lines 153-162): `>_` glyph as genuine vector chevron+underscore shape (not literal text), flat `#00f0ff` fill, transparent background except `apple-touch-icon.png` which gets solid `#0c0e12` fill. Generated by `scripts/generate-favicons.mjs`, committed to `public/` (one-time, not regenerated per build — RESEARCH.md Assumption A4).

---

## Shared Patterns

### Verify-script contract (build-gate philosophy)
**Source:** `scripts/verify-shell.mjs`, `scripts/verify-no-external-origins.mjs`, `scripts/verify-design-tokens.mjs`
**Apply to:** `scripts/verify-a11y.mjs` (new)
```javascript
// 1. Guard: fail fast with a fixed message if dist/ doesn't exist.
if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}
// 2. Accumulate violations into an array — never exit on the first failure.
const violations = [];
function addViolation(check, detail) { violations.push({ check, detail }); }
// 3. Print every violation to stderr, then exactly one summary line to stdout.
// 4. process.exit(violations.length === 0 ? 0 : 1);
```
Wire into `package.json`'s `verify` composite script exactly like the existing five gates (see `package.json` pattern below).

### Placeholder-content convention
**Source:** `src/data/site.ts` (all existing fields)
**Apply to:** new `metaDescription` field in `site.ts`, OG image tagline (already reads `site.brand`/`site.title`, no new copy)
```typescript
title: "PLACEHOLDER — título/persona a definir",
```
Bracketed `[…]` for short identity fields, `PLACEHOLDER — … a definir` for descriptive/sentence fields — `metaDescription` uses the sentence form.

### `rel="noopener noreferrer"` + `aria-label` on icon-only interactive elements
**Source:** `src/pages/index.astro` lines 169-178 (project Live/Repo links), lines 190-199 (social icons)
**Apply to:** N/A for new files this phase (no new interactive icon-only elements are added) — cited here only because D-11's decorative-vs-meaningful distinction is explicitly the *next increment* of this same established discipline, per CONTEXT.md "Established Patterns."

### `aria-hidden="true"` on decorative elements (this phase's new increment of the above pattern)
**Source:** `04-UI-SPEC.md` "Decorative-icon `aria-hidden` pass" section (lines 168-175) + RESEARCH.md Pattern 3
**Apply to:** `src/pages/index.astro` (2 icon instances), `src/layouts/Base.astro` (2 glow-cloud divs)
```astro
<Icon name="material-symbols:arrow-forward" class="text-xl" aria-hidden="true" />
<div class="glow-cloud-top-right" aria-hidden="true"></div>
```
Verified mechanism: `astro-icon`'s `<Icon />` spreads all extra props onto the rendered `<svg>` (confirmed directly against `node_modules/astro-icon/components/Icon.astro` per RESEARCH.md Pattern 3) — no wrapper element or manual `role` plumbing needed.

### `glass-panel` + `border-glow-cyan` container primitives
**Source:** `src/styles/global.css` lines 226-238; existing call site `src/pages/index.astro` line 186 (Contact panel)
```css
.glass-panel {
  background: rgba(20, 27, 34, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.border-glow-cyan {
  border: 1px solid var(--color-primary-container);
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
}
```
**Apply to:** `src/pages/404.astro`'s panel (`glass-panel border-glow-cyan rounded-xl p-12`) and `src/pages/og-template/index.astro`'s reused Hero framing — no new CSS needed, pure class reuse (D-02, D-07).

### `btn-primary` CTA primitive
**Source:** `src/styles/global.css` lines 242-245 (hover state) + `src/pages/index.astro` lines 90-96 (Hero CTA call site)
```astro
<a href="#projects" class="btn-primary bg-primary-container text-on-primary-container font-mono-label text-mono-label uppercase tracking-widest px-8 py-4 rounded transition-all duration-300 cursor-pointer active:scale-95 inline-flex items-center gap-2">
  VER PROJETOS
  <Icon name="material-symbols:arrow-forward" class="text-xl" />
</a>
```
**Apply to:** `src/pages/404.astro`'s "VOLTAR AO INÍCIO" CTA — identical classes, `href="/"` instead of `#projects`, no icon (D-06/D-07).

### `npm run verify` composite-script wiring
**Source:** `package.json` lines 9-19 (current)
```json
"verify:sec01": "node scripts/verify-no-external-origins.mjs",
"verify:tokens": "node scripts/verify-design-tokens.mjs",
"verify:shell": "node scripts/verify-shell.mjs",
"verify:sections": "node scripts/verify-sections.mjs",
"verify:schema": "node scripts/verify-content-schema.mjs",
"verify": "npm run build && npm run verify:sec01 && npm run verify:tokens && npm run verify:shell && npm run verify:sections && npm run verify:schema"
```
**Apply to:** add `"verify:a11y": "node scripts/verify-a11y.mjs"` and append it to the `verify` chain; also add a `"generate:og": "node scripts/generate-og-image.mjs"` step chained into `build` (per RESEARCH.md's System Architecture Diagram — the OG image must exist before `verify:a11y` scans `/`) or into `verify` directly, whichever the planner sizes; `generate:favicons` stays a manually-invoked, non-chained script (one-time, RESEARCH.md Assumption A4).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/favicon.svg` | static asset | file-I/O (generated) | First file under `public/` in this project — no prior static-asset precedent to copy from; content fully specified by `04-UI-SPEC.md` instead |
| `public/favicon.ico` | static asset | file-I/O (generated) | Same as above |
| `public/apple-touch-icon.png` | static asset | file-I/O (generated) | Same as above |
| `public/robots.txt` | config/static asset | file-I/O (static) | Same as above; content fully specified by RESEARCH.md Pattern 2, no ambiguity requiring a codebase precedent |
| Playwright/axe-core browser-driving logic (within `scripts/verify-a11y.mjs`) | N/A (technique, not a file) | event-driven (subprocess + real browser) | First script in this project to spawn a preview server and drive a real browser — `verify-shell.mjs`/`verify-no-external-origins.mjs` only ever read static `dist/` files. Use RESEARCH.md Pattern 4 + Architecture Diagram as the primary source instead of a codebase analog. |
| `sharp`/`png-to-ico` rasterization logic (within `scripts/generate-favicons.mjs`) | N/A (technique) | file-I/O (binary transform) | No prior script in this project touches `sharp` or produces binary output — `astro:assets`' `<Image>` component (used in `index.astro` line 150) is the only existing `sharp`-adjacent usage, and it's a build-internal Astro feature, not a comparable hand-written script to copy from |

## Metadata

**Analog search scope:** `src/`, `scripts/`, `public/` (absent), `astro.config.mjs`, `package.json`, `.planning/phases/04-seo-accessibility-polish/04-RESEARCH.md`, `.planning/phases/04-seo-accessibility-polish/04-UI-SPEC.md`
**Files scanned:** `src/layouts/Base.astro`, `src/pages/index.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/data/site.ts`, `src/styles/global.css`, `astro.config.mjs`, `package.json`, `scripts/verify-shell.mjs`, `scripts/verify-no-external-origins.mjs`, `scripts/verify-design-tokens.mjs`
**Pattern extraction date:** 2026-09-03
