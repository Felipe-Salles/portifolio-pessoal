# Phase 4: SEO, Accessibility & Polish - Research

**Researched:** 2026-09-03
**Domain:** Astro static-site SEO artifacts (meta tags, sitemap, robots.txt, OG image, favicon), WCAG 2 AA accessibility (alt text, ARIA, contrast, focus states), automated a11y gating
**Confidence:** HIGH (Astro/integration mechanics, contrast math, package legitimacy) / MEDIUM (OG image generation pattern — synthesized from cross-verified community practice, no single official Astro recipe covers this exact case)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### OG/Twitter Share Image (SEO-02)
- **D-01:** Content is the wordmark + tagline — reuses `site.brand`/`site.title` (or equivalent Hero fields) directly, not separate hardcoded OG copy. When real content replaces the placeholders, the OG image updates automatically with no separate edit.
- **D-02:** Visual composition reuses the Hero's existing treatment (grid background pattern + glow clouds + glass-panel framing) rather than a simplified thumbnail-optimized layout — visual consistency with what the visitor sees after clicking through.
- **D-03:** One shared OG image serves the whole site, including the 404 page — no dedicated "not found" preview image. A 404 is rarely shared directly; a second image is effort without real payoff.
- **D-04:** Image text keeps the same bracketed placeholder style already used in `site.ts` (e.g. `[Nome/Marca Aqui]`) — consistent with Phase 1's D-03 placeholder convention (never look like real, finished content).

#### 404 Page (A11Y-02)
- **D-05:** Copy stays in the site's "system/terminal" tone (e.g. "ERRO 404 — ROTA NÃO ENCONTRADA"), matching the Hero's `>_` badge / mono-label voice, rather than a generic plain-language error message.
- **D-06:** Includes one primary CTA back to the Home page, styled like the existing `btn-primary` (same visual weight as the Hero's "VER PROJETOS" CTA).
- **D-07:** No dedicated illustration/icon — reuses existing primitives (`glass-panel`, `border-glow-cyan`) with typography only. No new visual asset needed for this page.
- **D-08:** Keeps the full nav (including `#dossier`/`#stack`/`#projects`/`#contact` anchors) — clicking one navigates back to the home page and scrolls to that section, standard cross-page anchor behavior, no special-casing needed.

#### Favicon (SEO-05)
- **D-09:** The mark is an abstract geometric glyph in the cyan palette, not a monogram/initial — specifically, reuses the `>_` glyph already used in the Hero's availability badge, rather than inventing a new brand element from scratch. This sidesteps the fact that `site.name`/`site.brand` are still placeholders (an initial-based mark would need to change later).
- **D-10:** Ship both a modern SVG favicon and PNG/ICO fallbacks for broad browser/bookmark compatibility, not SVG-only.

#### Decorative Icons & Alt Text (A11Y-03 / A11Y-04)
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| SEO-01 | Toda página tem `<title>` e `<meta name="description">` próprios via layout compartilhado | Architecture Patterns Pattern 1 (extended `Base.astro` `Props`); Code Examples `astro.config.mjs`/404 snippets |
| SEO-02 | Site tem tags Open Graph/Twitter Card com imagem de preview estática (1200×630, paleta Cyber-Sophisticate) | Architecture Patterns Pattern 1 + System Diagram (Playwright-screenshot OG pipeline); Alternatives Considered (why not Satori/`astro-og-canvas`); Pitfall 2 (absolute URL requirement) |
| SEO-03 | Site gera `sitemap.xml` via `@astrojs/sitemap` | Standard Stack Core row; Pitfall 1 (`site` config requirement); confirmed default `/404` auto-exclusion (Common Pitfalls note) |
| SEO-04 | Site tem `robots.txt` permitindo indexação | Architecture Patterns Pattern 2 (static `public/robots.txt`) |
| SEO-05 | Site tem favicon seguindo a paleta Cyber-Sophisticate | Standard Stack Supporting row (`sharp` + `png-to-ico`); Recommended Project Structure; State of the Art (3-file 2026 favicon baseline) |
| A11Y-02 | Site tem página 404 customizada reaproveitando layout e nav | Code Examples (404 page); confirmed `@astrojs/sitemap` auto-excludes `/404` from the sitemap by default |
| A11Y-03 | Imagens e ícones têm alt text descritivo (não nomes de arquivo) | Architecture Patterns Pattern 3 (`astro-icon` attribute passthrough, verified against component source); Don't Hand-Roll (a11y gate tooling) |
| A11Y-04 | Contraste de texto/painéis glassmorphism passa em verificação WCAG contra o fundo renderizado real | Common Pitfalls (axe-core jsdom limitation + real-browser layered-transparency limitation); Pitfall 5 (hand-computed token contrast, incl. `btn-primary`'s tight 4.58:1 margin); new Pattern 4 + Code Example (pixel-sampling supplementary check for `.glass-panel` text) |
</phase_requirements>

## Summary

This phase adds no new architectural layer — it's entirely build-time artifact generation (meta tags, static files, one generated image) plus a new automated verification gate, layered onto the existing `Base.astro` + `site.ts` + `scripts/verify-*.mjs` conventions already established in Phases 1–3. Every sub-requirement has a well-trodden Astro-native path: `@astrojs/sitemap` for SEO-03, a static `public/robots.txt` for SEO-04, extended `Props` on `Base.astro` for SEO-01/02, `src/pages/404.astro` for A11Y-02, and `astro-icon`'s existing attribute-forwarding (verified directly against `node_modules/astro-icon/components/Icon.astro`) for A11Y-03's `aria-hidden` decorative-icon pattern.

The one genuinely novel piece is SEO-02's OG image: the user's decisions (D-01/D-02) require it to reuse the Hero's *actual* glassmorphism/grid/glow-cloud CSS treatment and to read live from `site.ts`, not be a hand-designed static PNG. Satori-based tools (`@vercel/og`, hand-rolled `satori`+`resvg-js`) and canvas-based tools (`astro-og-canvas`) both require reimplementing that CSS in a separate, more limited rendering engine (a maintenance/drift risk, and — for `astro-og-canvas` specifically — a font-format mismatch: this project's `@fontsource/*` packages only ship `.woff`/`.woff2` files, while `astro-og-canvas`'s `canvaskit-wasm` font loader needs raw `.ttf`/`.otf`). Because this project only needs **one** shared image (D-03), the research recommends a lower-risk pattern instead: a small internal Astro page reusing the real `glass-panel`/`bg-grid-pattern`/`glow-cloud-*` classes, screenshotted at build time with Playwright into a static PNG. This guarantees pixel-fidelity to the Hero with zero duplicated styling and is a well-corroborated community pattern (6+ independent published implementations, see Sources).

The accessibility gate (D-14) has a hard technical constraint worth flagging early, with two layers: (1) axe-core's `color-contrast` rule is **documented as non-functional under jsdom** (no real paint engine) — ruling out jsdom-based test runners (`jest-axe`/`vitest-axe`) entirely; and (2) even inside a *real* browser, axe-core's own maintainers acknowledge a **known limitation computing composited color when multiple non-opaque background layers stack** (exactly this project's `.glass-panel` — `rgba(20,27,34,0.6)` over the page's own `bg-grid-pattern`/glow-cloud layers, further composited through `backdrop-filter: blur(16px)`). This means `@axe-core/playwright` is necessary but not sufficient for A11Y-04's "real rendered glassmorphism panels" requirement — the gate should also include a small deterministic supplementary check (Playwright screenshot + pixel sampling + the `wcag-contrast` library) specifically for `.glass-panel`/`.border-glow-cyan` text, matching this project's existing philosophy of never trusting a single tool's silent pass on a security/quality-critical claim (see every `scripts/verify-*.mjs` script from Phases 1–3).

**Primary recommendation:** Extend `Base.astro`'s `Props` with `description`/`ogImage`/`ogType` (no third-party SEO component needed — 2 pages total does not justify one), add `@astrojs/sitemap` + a static `public/robots.txt`, generate the favicon (`favicon.svg` + `favicon.ico` + `apple-touch-icon.png`) once via a small `sharp` + `png-to-ico` script committed to `public/`, generate the OG image every build via a Playwright-screenshot script wired into `npm run build`, and add one new `scripts/verify-a11y.mjs` (Playwright + `@axe-core/playwright`, triaging any `incomplete` `color-contrast` results on glass-panel elements against a `wcag-contrast`-based pixel-sampling check) that boots `astro preview` and scans both `/` and `/404.html` with the WCAG 2 AA ruleset, following the same summary-line/exit-code contract as the existing `verify-*.mjs` scripts.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `<title>`/meta description per page | Frontend Server (SSR/SSG, build-time) | CDN/Static | Rendered once into static HTML by Astro's build; served verbatim from Vercel's CDN — no runtime logic. |
| OG/Twitter Card meta tags + image | Frontend Server (build-time generation) | CDN/Static | Meta tags emitted at build; the PNG itself is a build-time-generated static asset served from CDN like any other image. |
| `sitemap.xml` / `robots.txt` | Frontend Server (build-time integration) | CDN/Static | `@astrojs/sitemap` runs as a build integration; both files are static output, no server logic ever touches them. |
| Favicon (svg/ico/png) | CDN/Static | — | Pure static asset, generated once, never rebuilt per-request. |
| 404 page | Frontend Server (prerendered route) | CDN/Static | Astro prerenders `404.html` at build time; Vercel's static hosting serves it for unmatched paths — no on-demand rendering involved (`output: 'static'` stays unchanged). |
| Alt text / `aria-hidden` on icons | Browser/Client (assistive-tech consumption) | Frontend Server (authored at build) | The attributes are authored in `.astro` templates at build time but their effect (screen-reader announcement/suppression) only matters in the client's accessibility tree. |
| Contrast / `:focus-visible` states | Browser/Client (CSS paint) | — | Real WCAG contrast is a function of actual browser compositing (backdrop-filter blur, alpha stacking) — this is why axe's `color-contrast` rule requires a real browser, and even then has known layered-transparency blind spots. |
| Automated a11y gate (axe-core + supplementary pixel check) | Build/CI tooling | — | Not a runtime tier at all — a verification step that boots a throwaway `astro preview` server + headless Chromium, then exits. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/sitemap` | `^3.7.4` | Generates `sitemap-index.xml` + `sitemap-0.xml` at build (SEO-03) | Official first-party Astro integration; already listed as the recommended tool in this project's own stack research (CLAUDE.md Supporting Libraries). Requires `site` to be set in `astro.config.mjs` (mandatory, must start with `http(s)://`) or the build throws. By default it auto-excludes `/404` and `/500` routes (confirmed via `withastro/astro` issue history — the exclusion targets exact `404`/`500` route matches, not any URL containing those digits), so `src/pages/404.astro` needs no manual `filter` entry. `[VERIFIED: npm registry, official docs docs.astro.build/en/guides/integrations-guide/sitemap/]` |
| `playwright` | `^1.62.1` | Headless-browser automation — powers both the OG-image screenshot step and the accessibility gate's real-browser rendering | `npm view playwright version` confirms `1.62.1` current, official Microsoft repo (`github.com/microsoft/playwright`). Chosen over Puppeteer because `@axe-core/playwright` (the a11y-gate dependency below) is Deque's own maintained binding and only targets Playwright/Selenium/WebdriverIO — not Puppeteer. `[VERIFIED: npm registry]` |
| `@axe-core/playwright` | `^4.13.0` | Runs axe-core's full WCAG ruleset (including `color-contrast`) inside a real Playwright-controlled browser (A11Y-03 + A11Y-04) | Official Deque Systems package (`github.com/dequelabs/axe-core-npm`), the de facto standard pairing for automated a11y gates. axe-core's `color-contrast` rule is documented as non-functional under jsdom (no `document.createRange()`/paint) — a real browser is required for A11Y-04. **Not fully sufficient alone** — see Common Pitfalls for the layered-transparency caveat that still applies even in a real browser. `[VERIFIED: npm registry + dequelabs/axe-core GitHub issues #595, #1730, #2924, #3464 — jsdom limitation and layered-transparency limitation independently corroborated]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `png-to-ico` | `^3.0.2` | Wraps a PNG buffer into a valid `.ico` container (SEO-05/D-10's ICO fallback) | Single-purpose, pure-JS (no native bindings — safe on this Windows dev machine), ~24KB unpacked — writing an ICO file's multi-resolution header by hand is exactly the kind of "don't hand-roll a binary format" case this stack should avoid. `[VERIFIED: npm registry, github.com/steambap/png-to-ico]` |
| `sharp` | already present transitively (Astro's default image service) | Rasterizes the `>_` glyph SVG into the 32×32 and 180×180 PNGs the favicon/apple-touch-icon need | Confirmed present at `node_modules/sharp` in this project already (via `astro`'s dependency tree, `npm ls sharp` shows it nested under `astro@7.2.10`). **Recommend adding it explicitly to `devDependencies`** for the favicon-generation script rather than relying on implicit hoisting — hoisting is an npm implementation detail, not a contract, and a future lockfile change could un-hoist it and silently break the script. `[VERIFIED: npm registry + local `npm ls sharp` confirms 0.35.4 present]` |
| `wcag-contrast` | `^3.0.0` | Small, focused WCAG relative-luminance contrast-ratio calculator (`hex()`/`rgb()`/`score()`) | Needed for the supplementary pixel-sampling contrast check (see Common Pitfalls / Pattern 4) — computing WCAG relative luminance/contrast from a sampled RGB pixel is a well-defined formula with a mature, tiny, single-purpose library already available; hand-rolling it duplicates a "don't hand-roll" case even though the formula itself is short. `[VERIFIED: npm registry, `python -m slopcheck scan --pkg npm wcag-contrast` → OK]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright screenshot for the OG image | `astro-og-canvas` (CanvasKit-based) or a hand-written `satori` + `resvg-js` script | Both render via a *separate* rendering engine with a documented CSS/font-loading subset (Satori: limited CSS, no arbitrary Tailwind class resolution; `astro-og-canvas`/CanvasKit: needs raw `.ttf`/`.otf` font files — this project's `@fontsource/*` packages only ship `.woff`/`.woff2`, confirmed via `node_modules/@fontsource/lexend/files` listing, so an extra font-file source would need to be added just for this one script). Reusing the Hero's real `.glass-panel`/`.bg-grid-pattern`/`.glow-cloud-*` classes (D-02's explicit requirement) would mean hand-porting them into a second styling system — a second, hand-maintained implementation that silently drifts from the real Hero styling over time. Only reconsider this if the site later needs *many* dynamically-templated OG images (e.g. one per blog post) — for a single shared image, the duplication cost isn't worth it. `[CITED: github.com/vercel/satori documented CSS support subset; astro-og-canvas README `fonts` option example uses `.ttf` paths]` |
| Extending `Base.astro`'s own `Props` for meta tags | `astro-seo` npm package | `astro-seo` is a reasonable choice for larger multi-page sites with many per-page SEO variations. This project has exactly 2 pages (`/` and `/404`) with near-identical meta needs (D-03: one shared OG image for both) — a 3rd-party dependency for ~6 conditional meta tags is disproportionate. Matches CLAUDE.md's "complexity only when necessary" stance. |
| `@axe-core/playwright` for the a11y gate | `jest-axe` / `vitest-axe` (jsdom-based) | jsdom-based axe wrappers explicitly disable/no-op the `color-contrast` rule because jsdom cannot paint. This would silently satisfy A11Y-03 (alt/aria rules, which *do* work in jsdom) while completely failing to check A11Y-04. Not viable given D-14's explicit "real rendered" requirement. |
| Static `favicon.ico`/`.svg`/`apple-touch-icon.png` (3 files) | Full legacy 30+-file favicon matrix (multiple PWA manifest icons, MS tile images, etc.) | 2026 favicon guidance has consolidated to 3 files covering effectively all current browsers/OSes — the older 30-file guidance is obsolete. No PWA manifest exists in this project's scope, so no manifest-referenced icon sizes are needed either. `[CITED: multiple 2026 favicon best-practice writeups, cross-verified]` |
| `@axe-core/playwright` alone | `@axe-core/playwright` + supplementary pixel-sampling script for `.glass-panel` text | axe alone can silently report `incomplete` (not pass/fail) on exactly the elements A11Y-04 cares about most (the "real rendered glassmorphism panels"), per corroborated axe-core layered-transparency issues. Treating `incomplete` as an automatic pass would defeat the purpose of D-14's gate; treating it as an automatic fail could block on a false positive. The supplementary deterministic check resolves the ambiguity the same way this project already resolves ambiguity elsewhere (custom `verify-*.mjs` scripts, never "trust the tool blindly"). |

**Installation:**
```bash
npm install @astrojs/sitemap
npm install -D playwright @axe-core/playwright png-to-ico wcag-contrast sharp
npx playwright install chromium
```

**Version verification:** confirmed live via `npm view <pkg> version` on 2026-09-03 (see Package Legitimacy Audit below for full detail). `sharp` is not functionally a new install (already present transitively) but is listed in the install command above so it becomes an explicit `devDependency` rather than an implicit hoisted one (see Supporting table rationale).

## Package Legitimacy Audit

`slopcheck` (0.6.1) was already installed in this environment (`pip show slopcheck` / `python -m slopcheck --version` confirm it; note the bare `slopcheck` command is **not** on `PATH` in this environment — invoke via `python -m slopcheck` instead, or add its Python Scripts directory to `PATH`). Re-run live on 2026-09-03 against all 6 packages this phase would add or pin as an explicit dependency, using `python -m slopcheck scan --pkg npm <name> --json`. All 6 returned `OK`.

| Package | Registry | Source Repo | slopcheck | Disposition |
|---------|----------|--------------|-----------|-------------|
| `@astrojs/sitemap` | npm | github.com/withastro/astro (official monorepo) | `OK` | Approved |
| `playwright` | npm | github.com/microsoft/playwright | `OK` | Approved |
| `@axe-core/playwright` | npm | github.com/dequelabs/axe-core-npm | `OK` | Approved |
| `png-to-ico` | npm | github.com/steambap/png-to-ico | `OK` | Approved |
| `wcag-contrast` | npm | github.com/gka/wcag-contrast (Deque/community-maintained utility) | `OK` | Approved |
| `sharp` | npm | github.com/lovell/sharp | `OK` | Approved — already a transitive dependency; recommended for explicit `devDependencies` promotion (see Supporting table) |

**Packages removed due to slopcheck `[SLOP]` verdict:** none
**Packages flagged as suspicious `[SUS]`:** none

All 6 packages have long-established, officially-maintained or clearly-attributed source repositories — no cross-ecosystem confusion risk. No postinstall-script red flags: `playwright`'s own install step is a well-known, expected browser-binary download (triggered explicitly via `npx playwright install chromium`, not a silent postinstall), not a hidden network call.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌───────────────────────────────────────────┐
                     │              npm run build                │
                     └────────────────────┬──────────────────────┘
                                           │
                     ┌────────────────────▼──────────────────────┐
                     │  1. astro build                            │
                     │     - prerenders "/" (index.astro)         │
                     │     - prerenders "/404" (404.astro)        │
                     │     - prerenders "/og-template/" (hidden,  │
                     │       noindex, 1200x630 Hero-styled page,  │
                     │       reads site.ts)                       │
                     │     - @astrojs/sitemap emits                │
                     │       sitemap-index.xml + sitemap-0.xml    │
                     │       (auto-excludes /404)                 │
                     │     - public/ copied verbatim → dist/      │
                     │       (favicon.svg/.ico, apple-touch-      │
                     │       icon.png, robots.txt)                │
                     └────────────────────┬──────────────────────┘
                                           │ dist/ complete except OG PNG
                     ┌────────────────────▼──────────────────────┐
                     │  2. scripts/generate-og-image.mjs          │
                     │     - spawns `astro preview` on dist/      │
                     │     - Playwright: viewport 1200x630,       │
                     │       goto /og-template/, screenshot       │
                     │     - writes dist/og-image.png             │
                     │     - kills preview server                 │
                     └────────────────────┬──────────────────────┘
                                           ▼
                               dist/ ready for deploy (Phase 5)

              ┌───────────────────────────────────────────────────┐
              │                npm run verify:a11y                │
              │  - spawns `astro preview` on dist/                 │
              │  - Playwright + @axe-core/playwright:              │
              │      scan "/"         (WCAG2A + WCAG2AA tags)      │
              │      scan "/404.html" (WCAG2A + WCAG2AA tags)      │
              │  - fails (exit 1) on ANY violation                 │
              │  - any `incomplete` color-contrast result on a     │
              │    .glass-panel/.border-glow-cyan element routes   │
              │    into the supplementary pixel-sampling check     │
              │    (wcag-contrast); non-glass-panel `incomplete`   │
              │    results still fail the gate outright            │
              │  - prints A11Y SUMMARY line, same contract as      │
              │    existing verify-*.mjs scripts                   │
              └───────────────────────────────────────────────────┘
```

A visitor's request never touches any of this — it is 100% build/CI-time. At request time, Vercel's CDN serves the already-generated static files (HTML with meta tags baked in, `og-image.png`, `favicon.*`, `sitemap.xml`, `robots.txt`) with zero server logic, consistent with `output: 'static'`.

### Recommended Project Structure

```
public/
├── favicon.svg              # >_ glyph, cyan, primary modern icon (D-09/D-10)
├── favicon.ico              # 16/32/48 multi-res raster, legacy fallback
├── apple-touch-icon.png     # 180x180 raster, iOS home-screen icon
└── robots.txt                # static, permits full indexing (SEO-04)

src/
├── layouts/
│   └── Base.astro            # Props extended: description, ogImage?, ogType?
├── pages/
│   ├── index.astro           # unchanged content, gains description prop value
│   ├── 404.astro              # NEW — A11Y-02, reuses Base + Nav + Footer
│   └── og-template/
│       └── index.astro       # NEW — internal-only 1200x630 render target for
│                              #   the OG screenshot script; noindex, excluded
│                              #   from sitemap via `filter`
scripts/
├── generate-favicons.mjs     # NEW — one-time dev script (sharp + png-to-ico),
│                              #   output committed to public/, not re-run per build
├── generate-og-image.mjs     # NEW — runs every `npm run build` (site.ts-driven)
└── verify-a11y.mjs           # NEW — Playwright + axe-core gate + glass-panel
                                #   pixel-sampling supplementary check
                                #   (A11Y-03 + A11Y-04)
```

### Pattern 1: Shared-layout meta tags via extended Props (SEO-01/02)

**What:** `Base.astro`'s existing `Props` interface (currently just `title`) gains optional `description`, `ogImage`, and `ogType`, with sane defaults so `index.astro`/`404.astro` only override what differs.
**When to use:** Any Astro site with a small, fixed page count where a full SEO component library is disproportionate.
**Example:**
```astro
---
// src/layouts/Base.astro
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
---
<head>
  ...
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalURL} />

  <meta property="og:type" content={ogType} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImageURL} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content={canonicalURL} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImageURL} />
</head>
```
*Note: `Astro.site` is required for absolute OG/canonical URLs and is the same config value `@astrojs/sitemap` requires — set once in `astro.config.mjs`, used by both. `[CITED: docs.astro.build sitemap guide + Open Graph protocol spec requiring absolute image URLs]`*

### Pattern 2: `robots.txt` as a static file, referencing the generated sitemap (SEO-04)

**What:** A plain `public/robots.txt` — no dynamic endpoint needed since indexing rules never vary per-request for this site.
**When to use:** Any static Astro site where robots rules are fixed at build time (the common case; a dynamic `src/pages/robots.txt.ts` endpoint is only needed for per-environment robots rules, e.g. blocking staging).
**Example:**
```
User-agent: *
Allow: /

Sitemap: https://<production-domain>/sitemap-index.xml
```
`[CITED: docs.astro.build/en/guides/integrations-guide/sitemap/ — robots.txt integration section]`

### Pattern 3: Decorative icon suppression via `astro-icon`'s attribute passthrough (A11Y-03/D-11/D-12)

**What:** `astro-icon`'s `<Icon />` component (`Props extends HTMLAttributes<"svg">`) spreads all extra props directly onto the rendered `<svg>` element — verified by reading `node_modules/astro-icon/components/Icon.astro` directly in this project (`const { name, title, desc, "is:inline": inline, ...props } = Astro.props;` then `<svg {...normalizedProps} ...>`). No wrapper `<span>` or manual `role`/`aria-hidden` plumbing needed.
**When to use:** Every purely decorative icon instance identified in CONTEXT.md D-11 (Hero CTA arrow, project-card fallback icon) plus the two `glow-cloud-*` divs (D-12, plain `<div>`s — same `aria-hidden="true"` attribute, no `Icon`-specific mechanism needed there).
**Example:**
```astro
<!-- Hero CTA (decorative arrow — the <a> itself already carries the visible
     "VER PROJETOS" text, so the icon needs no separate announcement) -->
<a href="#projects" class="btn-primary ...">
  VER PROJETOS
  <Icon name="material-symbols:arrow-forward" class="text-xl" aria-hidden="true" />
</a>

<!-- Project card fallback icon -->
<Icon name="material-symbols:code" class="cover-fallback-icon ..." aria-hidden="true" />

<!-- Base.astro atmosphere divs (D-12) -->
<div class="glow-cloud-top-right" aria-hidden="true"></div>
<div class="glow-cloud-bottom-left" aria-hidden="true"></div>
```
`[VERIFIED: node_modules/astro-icon/components/Icon.astro read directly, confirms svg prop spreading]`

**What NOT to touch (per D-13):** tech-stack badges (`[ ASTRO ]`) and project tag pills are plain `<span>` elements with real visible text — screen readers already announce them correctly; do not add `aria-label` rewrites that strip the bracket characters, that would be redundant work outside this phase's scope.

**Note on `astro-icon`'s sprite dedup:** repeated icon names (e.g. `material-symbols:code` appears both as the project-card fallback AND the "Repo" link icon) render as `<symbol>` once and `<use href="#...">` on later occurrences — `aria-hidden` still lands correctly on each `<use>`-wrapping `<svg>` regardless, since the attribute spread happens per-instance, not on the shared `<symbol>`. When writing/debugging `verify-a11y.mjs`, verify against the actual rendered `dist/index.html` output rather than assuming every icon is a full inline `<svg>` body.

### Pattern 4: Supplementary pixel-sampling contrast check for `.glass-panel` text (A11Y-04)

**What:** Because axe-core (even under `@axe-core/playwright`, i.e. a real browser) has a documented limitation computing composited background color across multiple stacked non-opaque layers plus `backdrop-filter`, `.glass-panel`/`.border-glow-cyan` text elements need a deterministic fallback check: screenshot the panel region with Playwright, sample the actual painted background pixel behind the text, read the text's own computed color, and compute the WCAG contrast ratio directly with `wcag-contrast`.
**When to use:** Whenever `@axe-core/playwright`'s `color-contrast` check returns `incomplete` (not `pass`/`violation`) for an element scoped inside `.glass-panel`/`.border-glow-cyan` — the exact set of elements A11Y-04 calls out ("real rendered glassmorphism panels").
**Example (sketch — planner sizes exact implementation):**
```js
// scripts/verify-a11y.mjs (excerpt)
import { chromium } from "playwright";
import sharp from "sharp";
import { hex as wcagHex } from "wcag-contrast";

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:4321/");

const panelText = await page.locator(".glass-panel h2, .glass-panel p").first();
const box = await panelText.boundingBox();
const screenshotBuffer = await page.screenshot({ clip: box });

// Sample a pixel just outside the glyph strokes (e.g. box top-left corner
// inset by a few px) to read the *background* the text sits on, not the
// text's own anti-aliased edge.
const { data } = await sharp(screenshotBuffer)
  .extract({ left: 2, top: 2, width: 1, height: 1 })
  .raw()
  .toBuffer({ resolveWithObject: true });
const bgHex = `#${[...data].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

const textColor = await panelText.evaluate((el) => getComputedStyle(el).color);
// Convert textColor (rgb(...)) to hex, then:
const ratio = wcagHex(bgHex, textColorHex);
if (ratio < 4.5) {
  // fail the gate — real, deterministic proof, not a token-value assumption
}
```
This mirrors the project's existing `scripts/verify-*.mjs` philosophy — a small, deterministic, dependency-light Node script proving a claim directly against real build output, rather than trusting a single third-party tool's silent pass.

### Anti-Patterns to Avoid

- **Client-side/runtime OG image generation (e.g. a Vercel serverless `@vercel/og` endpoint):** This project's `output: 'static'` decision (locked in CLAUDE.md, "keep `output: 'static'` — do not switch to `server`/`hybrid`") rules this out entirely — a serverless OG endpoint requires on-demand rendering, which this project has explicitly rejected. The image must be a build-time-generated static file.
- **Re-implementing the Hero's glassmorphism in Satori/CanvasKit JSX:** creates a second, hand-maintained copy of styling that WILL drift from the real `.glass-panel`/`.bg-grid-pattern` CSS over time, and hits an immediate font-format blocker for `astro-og-canvas` specifically (see Alternatives Considered).
- **Testing contrast with `jest-axe`/jsdom:** silently passes A11Y-04 without actually checking anything — the `color-contrast` rule is disabled under jsdom by design, not by accident.
- **Treating any `@axe-core/playwright` `incomplete` result on a glass-panel element as an automatic pass:** defeats the purpose of D-14's gate — route it into the Pattern 4 supplementary check instead of ignoring it.
- **Hiding decorative icons with `display: none` or `visibility: hidden` instead of `aria-hidden`:** would also remove them visually (breaking the actual design), and is the wrong tool anyway — `aria-hidden="true"` removes an element from the *accessibility tree* only, leaving it fully visible, which is what D-11/D-12 need.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Multi-resolution `.ico` binary container format | A manual ICO-header byte-writer | `png-to-ico` | The ICO format's directory/header structure is a well-defined but fiddly binary spec; a single-purpose, long-established, pure-JS library is the correct "don't hand-roll a binary format" call. |
| `sitemap.xml`/`sitemap-index.xml` generation, URL-set XML schema, entry-limit chunking, 404/500 auto-exclusion | A custom script walking `src/pages/` and hand-writing XML | `@astrojs/sitemap` | Handles the sitemap XML schema, 45,000-entry-per-file chunking, and status-page exclusion correctly out of the box; hand-rolling XML sitemap generation is exactly the kind of "deceptively simple until you hit the entry-limit/schema edge cases" problem this section exists to flag. |
| WCAG contrast-ratio math (relative luminance formula) | A hand-implemented luminance/gamma-correction function | `wcag-contrast` | The formula itself is short, but a mature, tiny, single-purpose, already-vetted library removes any risk of a sign error or gamma-curve typo silently invalidating A11Y-04's proof. |
| WCAG contrast-ratio verification against *real painted pixels* (alpha compositing, `backdrop-filter` blur sampling) | A custom script computing contrast purely from CSS token hex values | `@axe-core/playwright` (primary) + Pattern 4 pixel-sampling (supplementary, for the cases axe can't resolve) | Token-value math (as done ad-hoc during this research, see Pitfall 5) is a useful *sanity check* but is NOT equivalent to what A11Y-04 requires — it can't account for what's actually behind a blurred glass panel at any given scroll position or in combination with the grid/glow background. |
| Cross-page keyboard focus trap / ARIA dialog semantics for interactive overlays | — | N/A this phase — already solved in Phase 2's `Nav.astro` overlay controller (see codebase); Phase 4 does not add any new interactive JS. | Flagging only to note this phase's A11Y work is scoped to markup/CSS + a verification gate — no new interactive JS is needed for any of SEO-01–05/A11Y-02–04. |

**Key insight:** every hand-rolled temptation in this phase (ICO bytes, sitemap XML, contrast math) has a mature, narrowly-scoped library that already solved the edge cases — the phase's actual engineering effort should go into the *composition* (wiring the OG screenshot into the build, extending `Base.astro`'s Props, writing the new verify script and its glass-panel triage logic), not into reimplementing any of these formats.

## Common Pitfalls

### Pitfall 1: `@astrojs/sitemap` throws if `site` is unset in `astro.config.mjs`
**What goes wrong:** The build fails outright (`site` is a required config field for this integration) — this project's `astro.config.mjs` currently has no `site` key at all (confirmed by reading the file directly).
**Why it happens:** The production domain isn't decided yet — DEPLOY-01 (Vercel URL) is Phase 5's job, not Phase 4's.
**How to avoid:** Set a clearly-provisional `site` value now — an IANA-reserved-for-documentation placeholder domain (RFC 2606's `.example` TLD, e.g. `https://portfolio-felipe-salles.example`) is safer than guessing a real-looking `.com`/`.vercel.app` value that could collide with an actually-registered domain. Add an explicit code comment flagging it for a one-line update once Phase 5 assigns the real domain. This also directly determines the OG/canonical/sitemap **and** `robots.txt`'s `Sitemap:` line absolute URLs (Pattern 1/2 above) — all of them depend on the same `Astro.site` value, so the domain swap in Phase 5 touches `astro.config.mjs` AND `public/robots.txt`.
**Warning signs:** `astro build` failing with an `@astrojs/sitemap` config-validation error the moment the integration is added — verify this is caught at plan-time, not discovered mid-build.

### Pitfall 2: `og:image` needs an absolute URL, but this only matters at deploy time
**What goes wrong:** Open Graph consumers (Slack/Discord/Twitter/LinkedIn unfurlers) require an absolute `https://` URL in `og:image` — a relative `/og-image.png` will not render a preview at all when the URL is actually shared, even though it "looks fine" during local dev.
**Why it happens:** `astro dev`/`astro preview` happily resolve relative asset paths; the failure mode only appears once a real crawler fetches the raw HTML from production.
**How to avoid:** Always build `og:image`/`og:url`/`canonical` from `new URL(path, Astro.site)` (Pattern 1), never a bare string — this makes it deploy-domain-correct by construction, same fix as Pitfall 1.

### Pitfall 3: The OG-template page must be excluded from indexing and from the sitemap
**What goes wrong:** If `src/pages/og-template/index.astro` (the 1200×630 screenshot target) is a normal page, `@astrojs/sitemap` will include `/og-template/` as an indexable URL, and it may get indexed by search engines as junk content.
**Why it happens:** By default every `.astro` file in `src/pages/` becomes a real, crawlable route. (Unlike `/404`, which `@astrojs/sitemap` excludes automatically — this route needs an explicit `filter`, since it isn't a recognized status-code route.)
**How to avoid:** Add `<meta name="robots" content="noindex" />` to the OG-template page's own head (it doesn't need to extend the normal `Base` layout at all — it's a standalone visual composition, not a real page) AND exclude it via `@astrojs/sitemap`'s `filter` option.
**Warning signs:** `sitemap-0.xml` containing an `/og-template/` entry after build — check this explicitly during verification.

### Pitfall 4: Build-time-only assets (sitemap, OG image) don't exist under plain `astro dev`
**What goes wrong:** `sitemap.xml` and the generated `og-image.png` will 404 during `astro dev`/local development, since both are produced by build-time steps (the sitemap integration only runs on `astro build`; `og-image.png` is only produced by the screenshot script chained after `astro build`).
**Why it happens:** This is standard, documented Astro integration behavior (not a bug) — sitemap generation has always been build-only.
**How to avoid:** Don't treat a 404 on these two URLs during `npm run dev` as a regression; only `npm run build` (or `npm run verify`, which chains through a full build) is the correct way to check these artifacts exist.
**Warning signs:** A developer filing a false-positive bug report after checking `localhost:4321/sitemap.xml` in dev mode.

### Pitfall 5: `btn-primary`'s text contrast passes AA with very little margin
**What goes wrong:** Computed via the actual DESIGN.md token values (`on-primary-container` `#006970` text on `primary-container` `#00f0ff` background — the "VER PROJETOS" CTA and any future button reusing `.btn-primary`, including the 404's Home CTA per D-06) the contrast ratio is **4.58:1** against a 4.5:1 AA minimum for normal-size text — a margin of only 0.08. `[VERIFIED: computed via the standard WCAG relative-luminance formula against the exact hex values in src/styles/global.css]`
**Why it happens:** The design's cyan-on-cyan-ish token pairing is deliberately high-brightness-on-high-brightness for the glow aesthetic, which naturally produces tighter contrast margins than white-on-dark pairings elsewhere in the palette.
**Note:** This is NOT a violation — 4.58 > 4.5 passes — and the `:hover` state (background swaps to `primary-fixed` `#7df4ff`) is safer (higher luminance gap). This is flagged as a pitfall only because axe-core will correctly report this specific pairing if the color values ever drift even slightly (e.g. a future design tweak lightening `on-primary-container`), and because it is the *tightest* margin anywhere in the current palette — treat it as the canary pairing to re-check first if A11Y-04's gate ever starts failing after an unrelated CSS change. For reference, the other major text/background pairings in this design have far larger margins: `text-on-surface-variant` (`#b9cacb`) on the composited `.glass-panel` background computes to **~10.5:1**, and `text-primary-container` (`#00f0ff`) on the same glass-panel background computes to **~12.6:1** — both comfortably clear of AA (and even AAA's 7:1) for normal text.
**How to avoid:** No action needed today; just don't treat this pairing as having "plenty of headroom" in future design tweaks, and use it as the first thing to re-check if the a11y gate ever regresses.

### Pitfall 6: axe-core's `color-contrast` check has two distinct failure modes, not one
**What goes wrong:** (a) Under jsdom-based test runners (`jest-axe`/`vitest-axe`), the `color-contrast` rule is silently disabled entirely — a false "all clear." (b) Even inside a real browser via `@axe-core/playwright`, axe-core's own maintainers acknowledge it can mis-compute or report `incomplete` (not `pass`/`violation`) when **multiple stacked non-opaque background layers** are involved — exactly this project's `.glass-panel` (`rgba(20,27,34,0.6)` over the grid-pattern/glow-cloud background, further composited by `backdrop-filter: blur(16px)`).
**Why it happens:** (a) is a documented, deliberate jsdom limitation (no paint/`Range` API). (b) is a longstanding, corroborated axe-core limitation in its ancestor-background-compositing algorithm (`dequelabs/axe-core` issues #1730, #2924, #3464) — not specific to this project, but this project's specific design (glassmorphism + atmospheric gradients) sits squarely in the pattern that triggers it.
**How to avoid:** Use `@axe-core/playwright` (rules out failure mode (a)). For failure mode (b), don't treat an `incomplete` verdict on a `.glass-panel`/`.border-glow-cyan`-scoped element as either an automatic pass or an automatic fail — route it through the Pattern 4 pixel-sampling supplementary check, which samples the actually-painted pixel rather than relying on axe's ancestor-background-walking algorithm.
**Warning signs:** `verify-a11y.mjs` reporting 0 violations but a nonzero `incomplete` count that the script doesn't explicitly handle — a silent gap in the gate's coverage, exactly the kind of thing D-14 was written to prevent.

### Pitfall 7: `astro-icon`'s automatic sprite reuse means the same icon renders as `<symbol>` once, `<use>` thereafter
**What goes wrong:** None functionally — flagging only so the new `verify-a11y.mjs` script (or a human reviewer) isn't confused seeing `<use href="#...">` instead of a full inline `<svg>` on the second-or-later occurrence of a repeated icon (e.g. `material-symbols:code` appears in both the project-card fallback AND as the "Repo" link icon).
**Why it happens:** Documented `astro-icon` behavior (confirmed reading its component source) — sprite deduplication is a deliberate HTML-size optimization.
**How to avoid:** When writing/debugging `verify-a11y.mjs` or any dist/-scanning script, don't assume `aria-hidden` must appear directly on an inline `<svg>` for every usage — the attribute is still correctly forwarded per-instance; verify against rendered `dist/index.html` output directly rather than assuming a fixed SVG shape.

## Code Examples

### Custom 404 page reusing full Nav/Base (A11Y-02, D-05–D-08)
```astro
---
// src/pages/404.astro
import Base from "../layouts/Base.astro";
---
<Base
  title="Página não encontrada — [Nome/Marca Aqui]"
  description="A rota solicitada não existe neste sistema."
>
  <section class="min-h-[60vh] flex flex-col items-center justify-center text-center glass-panel border-glow-cyan rounded-lg p-12 max-w-2xl mx-auto">
    <p class="font-mono-label text-mono-label text-primary-container uppercase tracking-widest mb-4">
      &gt;_ ERRO 404 — ROTA NÃO ENCONTRADA
    </p>
    <h1 class="font-headline-md text-headline-md text-white mb-6">
      O sistema não localizou este caminho.
    </h1>
    <a href="/" class="btn-primary bg-primary-container text-on-primary-container font-mono-label text-mono-label uppercase tracking-widest px-8 py-4 rounded transition-all duration-300 cursor-pointer active:scale-95 inline-flex items-center gap-2">
      VOLTAR AO INÍCIO
    </a>
  </section>
</Base>
```
`Base` already renders the full `<Nav />` (D-08's cross-page anchors work automatically — `#dossier` etc. on `/404` naturally navigate to `/#dossier`) and `<Footer />` with zero special-casing, exactly as CONTEXT.md's D-08 specifies. *(Exact copy per D-05's "system/terminal" tone is Claude's discretion at implementation time — this is illustrative, not final copy.)*

### `astro.config.mjs` additions (sitemap + placeholder `site`)
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
`[CITED: docs.astro.build sitemap guide config example, adapted to this project's existing config.mjs structure]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| 16–30-file favicon matrices (multiple `.ico` sizes, MS tile XML, many PWA icon sizes) | 3-file set: `favicon.ico` (16/32/48 multi-res legacy fallback), `favicon.svg` (modern, scalable, primary), `apple-touch-icon.png` (180×180) | Browser/OS favicon-handling consolidated years ago; 2026 guidance confirms this is now the stable baseline, not a temporary shortcut | Directly matches D-10's "SVG + PNG/ICO fallbacks, not SVG-only" — no need to research or generate a larger matrix. |
| jsdom-based a11y unit tests (`jest-axe`) treated as sufficient for "accessibility testing" | Real-browser a11y testing (Playwright + axe-core) required specifically for contrast rules, **plus** an awareness that even real-browser axe-core has layered-transparency blind spots on glassmorphism-style UIs | Long-standing, documented axe-core limitations (not a recent change) — flagged here because it's easy to reach for the jsdom-based tool by habit, or to trust a real-browser axe pass as fully conclusive, and silently under-deliver on A11Y-04 | Directly determines this phase's tooling choice (Playwright + axe, plus the Pattern 4 supplementary check). |

**Deprecated/outdated:** none directly relevant beyond the favicon-matrix point above — this phase's domain (static-site SEO/a11y basics) is stable, slow-moving territory.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Playwright-screenshotting an internal Astro page is the best-fit mechanism for generating the D-01/D-02-compliant OG image (vs. Satori/`astro-og-canvas`) | Architecture Patterns / Alternatives Considered | If wrong, the planner should reconsider `astro-og-canvas` with a custom render (would additionally require sourcing `.ttf` font files, since the project's `@fontsource/*` packages only ship woff/woff2) — still viable, just requires re-authoring the visual treatment in a second styling system, at higher drift risk. Low risk of total blockage either way — both approaches produce a valid 1200×630 PNG. |
| A2 | A placeholder `site` domain (`https://portfolio-felipe-salles.example`) is an acceptable stand-in until Phase 5 assigns the real Vercel URL | Common Pitfalls #1, Code Examples | If the planner/user prefers a different placeholder convention (e.g. matching `site.ts`'s bracketed-placeholder style instead of an `.example` domain), this is a one-line config change — no structural risk. Flagging because CONTEXT.md's `<decisions>` section does not explicitly address what `site` should be set to in Phase 4. |
| A3 | Gating `verify-a11y.mjs` on ANY axe violation (not just critical/serious impact) matches this project's existing all-or-nothing verify-script philosophy | Architecture Patterns Pattern-adjacent note, Common Pitfalls | If axe's ruleset surfaces false-positive-prone rules against this specific dark-glassmorphism design, an all-or-nothing gate could block merges on non-issues. Low risk given D-14 doesn't request severity filtering, but flagged as a discretion point for the planner to size explicitly (e.g. a documented `disableRules([...])` escape hatch for any confirmed false positive found during implementation). |
| A4 | The favicon PNG/ICO generation script (`generate-favicons.mjs`) should be a one-time dev script (output committed to `public/`), not re-run on every `npm run build`, unlike the OG-image script | Recommended Project Structure | If wrong (e.g. the `>_` glyph design changes frequently during iteration), a developer would need to remember to manually re-run the script after any favicon SVG edit — a minor DX friction, not a correctness risk, since stale output would be visually obvious immediately. |
| A5 | The Pattern 4 pixel-sampling supplementary check is necessary (not optional) to fully satisfy D-14/A11Y-04, rather than accepting `@axe-core/playwright`'s `incomplete` verdicts as-is | Common Pitfalls #6, Don't Hand-Roll, Pattern 4 | If the planner judges this to be over-engineering for an MVP-mode phase, the fallback is to accept axe's `incomplete` results with a documented manual sign-off (referencing the hand-computed token-math contrast ratios in Pitfall 5, which do clear AA) instead of building the automated pixel-sampling script — a scope-reduction decision, not a correctness risk, since the hand computation already shows the actual token pairings pass comfortably. |

## Open Questions (RESOLVED)

> Both questions below were resolved during phase planning. Each recommendation was adopted as written and is implemented by a specific plan task (cited inline). No open research item blocks Phase 4 execution.

1. **What `site` URL should `astro.config.mjs` use in Phase 4, before the real Vercel domain exists (Phase 5)?**
   - What we know: `@astrojs/sitemap` requires `site` to be set and it directly drives `og:image`/canonical/`robots.txt` URL correctness (Pitfalls 1–2).
   - What's unclear: Whether the user wants a throwaway placeholder domain (as illustrated above) or to defer this literally until Phase 5, accepting that Phase 4's sitemap/OG URLs will need a one-line domain swap later.
   - RESOLVED — recommendation adopted; implemented by `04-01-PLAN.md` Task 1 ("Provision the phase toolchain, set the site URL, and publish robots.txt"), which sets `site: "https://portfolio-felipe-salles.example"` in `astro.config.mjs` behind a `TODO(Phase 5)` comment and mirrors the same host in `public/robots.txt`; `04-03-PLAN.md` gates host parity between the two files.
   - Recommendation: Set a clearly-fake, RFC 2606-reserved placeholder (`.example` TLD) now, with a `TODO(Phase 5)` comment — avoids blocking Phase 4's build while making the follow-up obvious and collision-safe.

2. **Exact severity threshold for the axe-core gate, and how strictly to enforce the Pattern 4 supplementary check?**
   - What we know: D-14 requires the gate to exist and cover both A11Y-03 and A11Y-04 "in one pass"; it does not specify a severity cutoff or explicitly anticipate axe's `incomplete`-on-glassmorphism limitation.
   - What's unclear: Whether the user/planner wants the full automated Pattern 4 pixel-sampling script (higher implementation cost, fully closes the gap) or a documented manual sign-off referencing this research's hand-computed contrast ratios (lower cost, matches MVP mode, slightly less "automated" than D-14's stated intent).
   - RESOLVED — recommendation adopted; implemented by `04-04-PLAN.md` Task 2 ("Resolve glass-panel contrast by sampling real painted pixels, then wire the gate in"), which builds the full Pattern 4 pixel-sampling check rather than accepting axe `incomplete` verdicts. Task 1 of the same plan routes every `incomplete` entry into that check or fails the gate, so the A11Y-04 gate cannot be vacuous.
   - Recommendation: Given this project's `mode: mvp` and its consistent pattern of small, deterministic verify scripts, build the Pattern 4 check — it's a small, self-contained script (~40-60 lines) reusing dependencies (`playwright`, `sharp`) already required for the OG-image step, so the marginal cost is low relative to the confidence it buys for A11Y-04.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build, all `verify-*.mjs` scripts | ✓ | v24.14.0 | — |
| npm | package installs, `npm run` scripts | ✓ | 11.13.0 | — |
| Python + pip | `slopcheck` package-legitimacy tooling (dev-time only, not shipped) | ✓ | Python 3.14.3 / pip 25.3 | — |
| `slopcheck` (Python package) | Package Legitimacy Gate protocol | ✓ (already installed, 0.6.1) | 0.6.1 | Invoke via `python -m slopcheck ...` — the bare `slopcheck` command is not on `PATH` in this environment; document this in the plan's task notes so execution doesn't stall rediscovering it. |
| `sharp` (npm package) | OG-image pipeline is NOT dependent on it, but favicon-generation script is | ✓ (present transitively via `astro@7.2.10`) | 0.35.4 | None needed — recommend promoting to an explicit `devDependency` (see Standard Stack) rather than relying on continued hoisting. |
| `playwright` + Chromium browser binary | OG-image screenshot script, a11y gate, Pattern 4 pixel-sampling check | ✗ (not yet installed — expected, this phase adds it) | — | None needed; this is a planned new install. Flag for the plan: first-time `npx playwright install chromium` downloads a ~300MB Chromium binary and requires outbound network access — size this into the first task/checkpoint of whichever plan wave adds it, and note it if this project's CI/build environment has any network restrictions (not evidenced in this repo, but worth a one-line check). |

**Missing dependencies with no fallback:**
- None — `playwright`/Chromium is a planned install for this phase, not a blocking gap.

**Missing dependencies with fallback:**
- `slopcheck` on `PATH` — fallback is `python -m slopcheck`, already confirmed working.

## Security Domain

> `security_enforcement` is absent from `.planning/config.json` → treated as enabled per protocol.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth in this project (explicitly out of scope per REQUIREMENTS.md) |
| V3 Session Management | No | No sessions/cookies anywhere in this static site |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | No | This phase processes zero user input — all content (`site.ts`, project frontmatter) is author-controlled, build-time-only data, not runtime user input |
| V6 Cryptography | No | Not applicable to this phase's scope |

**Note:** This phase's only new "processing" surface is the OG-image screenshot script and the a11y-gate script (including its Pattern 4 pixel-sampling check), both of which run at build/CI time against author-controlled content (never end-user input) and never ship any of their own code to the browser — they are Node build tooling, not a runtime attack surface. Confirmed by reading `astro.config.mjs` directly: it has no `security.csp`/header configuration yet (that's Phase 5's SEC-02/03 scope) — this phase introduces no new external origins (favicon/OG image are self-hosted static files, `sitemap.xml`/`robots.txt` are plain static files with no script/style content at all), so it creates no new work for Phase 5's eventual CSP configuration.

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| A future contributor adding a 3rd-party OG-image/favicon *generation service* (SaaS API) instead of the build-time-local approach recommended here | Information Disclosure | Keep OG-image/favicon generation fully local/build-time (as recommended) — no site content or visitor data should ever be sent to an external image-generation API. |
| `robots.txt`/`sitemap.xml` accidentally exposing the internal `/og-template/` build artifact route to crawlers | Information Disclosure (minor — no sensitive data, just junk-page indexing) | `sitemap`'s `filter` option + `noindex` meta tag on that one page (Pitfall 3). |

## Sources

### Primary (HIGH confidence)
- `docs.astro.build/en/guides/integrations-guide/sitemap/` — `@astrojs/sitemap` installation, required `site` config, options table, output filenames, robots.txt integration guidance (fetched directly)
- `docs.astro.build/en/basics/astro-pages/` — custom `404.astro` convention, build-output behavior, static-vs-on-demand caveat (fetched directly)
- Local codebase reads: `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/pages/index.astro`, `src/components/Footer.astro`, `src/data/site.ts`, `src/content.config.ts`, `src/styles/global.css`, `astro.config.mjs`, `package.json`, `scripts/verify-no-external-origins.mjs`, `scripts/verify-shell.mjs`, `Arquivos de design/DESIGN.md`, `node_modules/astro-icon/components/Icon.astro`, `node_modules/@fontsource/lexend/files` (listing) — establish current state and existing conventions this phase must extend
- `npm view <pkg> version` (live registry queries, 2026-09-03) for `@astrojs/sitemap`, `playwright`, `@axe-core/playwright`, `png-to-ico`, `wcag-contrast`, `sharp`, plus peer-dependency checks for `@astrojs/sitemap`/`astro-og-canvas`/`@axe-core/playwright`
- `python -m slopcheck scan --pkg npm <name> --json` run live (2026-09-03) against all 6 candidate/pinned packages — 6/6 `OK`
- WCAG relative-luminance contrast ratios computed directly from the exact hex values in `src/styles/global.css`'s `@theme` block for: `on-primary-container`/`primary-container` (btn-primary, 4.58:1), `on-surface-variant`/composited-glass-panel (~10.5:1), `text-primary-container`/composited-glass-panel (~12.6:1) — not estimated, computed via the standard sRGB gamma-correction + relative-luminance formula
- `withastro/astro` GitHub issue history (#10778 and related sitemap-integration issues) — confirms `@astrojs/sitemap`'s default auto-exclusion of exact `/404` and `/500` routes

### Secondary (MEDIUM confidence)
- `dequelabs/axe-core` GitHub issues #595 ("color-contrast doesn't work in JSDOM"), #1730, #2924, #3464 — axe-core's jsdom limitation AND its real-browser layered-transparency/backdrop-filter compositing limitation, cross-verified across multiple independent issues on the same official repo
- `dbushell.com/2024/11/15/generate-open-graph-images-with-playwright/` plus 5+ independently-published implementations (`jilles.me`, `techsquidtv.com`, `jonesrussell.github.io`, `sanderg.nl`, `antonyholmes.dev`) — Playwright-screenshot-for-OG-images as a well-established, cross-verified community pattern (not an Astro-official recipe)
- `github.com/vercel/satori` README (CSS support subset) and `astro-og-canvas` README example (`.ttf` font path in the `fonts` option) — used to justify avoiding Satori/CanvasKit-based tools for this specific glassmorphism-reuse + existing-font-format requirement
- Multiple 2026 favicon best-practice articles — cross-verified 3-file consolidation (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`)
- `npmjs.com/package/@axe-core/cli` — confirms CLI/Puppeteer/Playwright wrapper landscape maintained by Deque

### Tertiary (LOW confidence)
- None retained as authoritative — all findings above were either fetched from official docs/source directly, confirmed via live registry/tool queries against this project's actual environment, or cross-verified across multiple independent secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack (sitemap/robots/404/icon-forwarding): HIGH — every claim fetched directly from official Astro docs, confirmed via live `npm view`/`npm ls`, or verified directly against `node_modules` source in this project
- OG image generation architecture: MEDIUM — no single official Astro recipe covers "one shared, content-driven, CSS-fidelity-required OG image for a 2-page static site"; the Playwright-screenshot recommendation is a well-reasoned synthesis of documented Astro build-integration mechanics + a cross-verified (6+ independent sources) community pattern, not a copy of an official guide
- Contrast findings (Pitfall 5, glass-panel ratios): HIGH — computed directly from the project's own committed CSS token values using the standard WCAG relative-luminance formula, not estimated or assumed
- Accessibility tooling (Playwright + axe-core, jsdom + layered-transparency limitations): HIGH for the limitations themselves (official package issue tracker, multiply-corroborated) / MEDIUM for the Pattern 4 supplementary-check design (a reasoned synthesis to close a documented gap, not a copy of an existing published recipe)
- Package legitimacy: HIGH — live `slopcheck` run against every recommended package in this exact environment, all `OK`

**Research date:** 2026-09-03
**Valid until:** ~30 days (stable domain — Astro's sitemap/pages/icon APIs and WCAG 2 AA criteria are not fast-moving; re-verify `@astrojs/sitemap`/`playwright`/`@axe-core/playwright`/`wcag-contrast` version numbers if planning is delayed more than a few weeks)
