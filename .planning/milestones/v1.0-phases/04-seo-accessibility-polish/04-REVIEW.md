---
phase: 04-seo-accessibility-polish
reviewed: 2026-09-03T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - astro.config.mjs
  - package.json
  - public/apple-touch-icon.png
  - public/favicon.ico
  - public/favicon.svg
  - public/og-image.png
  - public/robots.txt
  - scripts/generate-favicons.mjs
  - scripts/generate-og-image.mjs
  - scripts/verify-a11y.mjs
  - scripts/verify-no-external-origins.mjs
  - scripts/verify-seo.mjs
  - src/data/site.ts
  - src/layouts/Base.astro
  - src/pages/404.astro
  - src/pages/index.astro
  - src/pages/og-template/index.astro
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-09-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the SEO/accessibility polish phase: astro.config.mjs, the verify-*.mjs gate scripts, the favicon/OG-image generator scripts, the generated binary assets, site.ts, Base/404/index/og-template pages, and package.json. The verify scripts are unusually thorough and internally consistent (violations-array + summary-line + guard-before-scan patterns repeat correctly across all three gates). The main problem found is a real contradiction between `scripts/generate-og-image.mjs`'s own documentation and its actual failure behavior: it claims the committed `public/og-image.png` "guarantees a valid preview even in a build environment without Chromium," but the code has no fallback path and will hard-fail `npm run build` (and therefore the Vercel production build) if Playwright/Chromium is unavailable. Three further correctness/consistency issues were found in content wiring (index.astro's hardcoded title, the og-template/Hero heading-field mismatch, and the a11y contrast script's alpha-blind color parsing), plus a handful of lower-severity maintainability notes.

## Critical Issues

### CR-01: `generate-og-image.mjs` contradicts its own "guaranteed fallback" claim and can hard-fail the production build

**File:** `scripts/generate-og-image.mjs:10-13, 48-86`
**Issue:** The file's header comment states the committed `public/og-image.png` "guarantees a valid preview even in a build environment without Chromium, e.g. a future Phase 5 / DEPLOY-01 Vercel build." But the script has no fallback logic at all: the entire body is a single `try { ... } finally { ... }` (no `catch`), and `chromium.launch()` (line 51) or any other step failing (browser download missing, sandbox restrictions on the CI host, `page.goto` timing out, etc.) propagates as an unhandled rejection, which crashes the Node process with a non-zero exit code. Since `package.json`'s `"build"` script is `astro build && node scripts/generate-og-image.mjs`, and this is the exact command Vercel will run for the real production deploy in Phase 5, any Chromium/Playwright failure in that environment fails the *entire* site build — even though `astro build` already copied a perfectly valid, previously-committed `public/og-image.png` into `dist/og-image.png` and the live pages already reference it correctly. The stated "guarantee" is not implemented; the actual behavior is the opposite (a single point of failure for the whole build).
**Fix:**
```js
// scripts/generate-og-image.mjs
import { existsSync, writeFileSync, copyFileSync } from "node:fs";
import { chromium } from "playwright";
import { preview } from "astro";

// ... existing guard for dist/og-template/index.html ...

let server;
let browser;

try {
  server = await preview({ server: { port: PORT } });
  browser = await chromium.launch();
  // ... screenshot + write public/og-image.png + dist/og-image.png ...
} catch (err) {
  console.error(`generate-og-image: regeneration failed (${err.message})`);
  if (existsSync("public/og-image.png")) {
    console.error(
      "generate-og-image: falling back to the previously-committed public/og-image.png",
    );
    copyFileSync("public/og-image.png", "dist/og-image.png");
  } else {
    // No committed fallback exists — this really is fatal.
    process.exit(1);
  }
} finally {
  if (browser) await browser.close();
  if (server) await server.stop();
}
```
This preserves the "never silently ship a stale/missing image on first run" contract (still exits 1 if there is truly no image anywhere) while making the documented fallback guarantee actually true for subsequent builds where a valid `public/og-image.png` already exists.

## Warnings

### WR-01: `index.astro` hardcodes the real production title, bypassing `site.ts` and the project's placeholder convention

**File:** `src/pages/index.astro:75`
**Issue:** `<Base title="Portfólio Dev — Felipe Salles" description={site.metaDescription}>` hardcodes the literal string "Portfólio Dev — Felipe Salles" directly in the page instead of sourcing it from `src/data/site.ts`. This contradicts the file's own header comment ("Every rendered string comes from src/data/site.ts, never a hardcoded persona literal") and `site.ts`'s documented D-03 contract ("Every content-bearing string value is a conspicuous placeholder... Not imported/rendered anywhere yet"). Every other identity field in `site.ts` is still a bracketed placeholder (`"[Nome/Marca Aqui]"`, `"[Seu Nome Aqui]"`), yet the `<title>`/browser-tab text and SEO `<title>` tag already leak the real name "Felipe Salles" into production HTML. It also breaks the CLAUDE.md constraint that content should be structured so a later content swap requires no architecture rework — updating the real title later means also touching `index.astro`, not just `site.ts`. Compare with `404.astro:13`, which correctly uses the bracket-placeholder convention (`"Página não encontrada — [Nome/Marca Aqui]"`).
**Fix:** Add a `pageTitle` (or reuse `brand`) field to `site.ts` and reference it:
```ts
// src/data/site.ts
pageTitle: "PLACEHOLDER — título da aba/SEO a definir",
```
```astro
<Base title={site.pageTitle} description={site.metaDescription}>
```

### WR-02: `og-template` renders a different data field than the Hero it is supposed to mirror

**File:** `src/pages/og-template/index.astro:41` vs `src/pages/index.astro:82`
**Issue:** `scripts/generate-og-image.mjs` documents its purpose as screenshotting `/og-template/` "so the preview image can never visually drift from the live Hero design." However, the OG template's `<h1>` renders `{site.brand}` (line 41), while the actual Hero section on `index.astro` renders `{site.heroHeading}` (line 82) for its `<h1>`. `site.ts` documents these as two semantically distinct fields — `brand` is "Brand/identity for the nav wordmark," `heroHeading` is the "Hero heading (HERO-01)." They happen to hold the same placeholder string today, so the drift is currently invisible, but as soon as real content is filled in with different values for `brand` vs `heroHeading` (a completely plausible scenario — a nav wordmark is often shorter than a full hero heading), the OG image will silently show the wrong heading, directly contradicting the stated no-drift guarantee.
**Fix:**
```astro
<!-- src/pages/og-template/index.astro -->
<h1 class="...">
  {site.heroHeading}
</h1>
```

### WR-03: `verify-a11y.mjs`'s contrast check ignores the alpha channel of computed colors

**File:** `scripts/verify-a11y.mjs:135-144`
**Issue:** `cssColorToHex()` extracts only the `r, g, b` capture groups from a `getComputedStyle` color string and discards any `a` (alpha) component present in `rgba(...)` values. The resulting hex is then fed straight into `wcagHex(bgHex, fgHex)` as if it were the fully-opaque, final rendered foreground color. If any text element this design uses ends up with a semi-transparent computed `color` (the design system leans heavily on `/50`, `/60`, `/70`-suffixed opacity utilities elsewhere in this codebase, e.g. `text-on-surface-variant`, `border-outline-variant/50`), the true rendered color is the alpha-blend of that color over its background — not the raw, unblended RGB triplet this function returns. That can produce a contrast ratio that is measurably wrong (too optimistic or too pessimistic) versus what a user actually sees, undermining the accuracy of the one gate whose entire job is to be the authoritative, non-assumption-based contrast measurement (per the file's own comment: "Never patches a design token to silence a real contrast failure — a genuine violation here is reported with its measured numbers only").
**Fix:** Parse and apply the alpha component before hexifying, blending onto the sampled background pixel:
```js
function cssColorToHex(cssColor, bgHex) {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s]+([\d.]+))?/i.exec(cssColor);
  if (!m) return null;
  const [, r, g, b, a] = m;
  const alpha = a === undefined ? 1 : Number(a);
  const bg = bgHex ? hexToRgb(bgHex) : { r: 0, g: 0, b: 0 };
  const blend = (fg, bgc) => Math.round(fg * alpha + bgc * (1 - alpha));
  const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(blend(Number(r), bg.r))}${toHex(blend(Number(g), bg.g))}${toHex(blend(Number(b), bg.b))}`;
}
```

## Info

### IN-01: `site:` origin is a non-resolving placeholder domain

**File:** `astro.config.mjs:17`, `public/robots.txt:4`
**Issue:** `site: "https://portfolio-felipe-salles.example"` is an RFC 2606-reserved placeholder, explicitly flagged as a `TODO(Phase 5)` in the surrounding comment. Every canonical/OG/Twitter/sitemap/robots URL currently built from this value will not resolve until the real domain is assigned. This is clearly intentional and tracked, not an oversight — noted here only so it's visible in this review's scope as a known pre-deploy blocker for the *next* phase, not this one.
**Fix:** No action needed in this phase; confirm DEPLOY-01 replaces both `astro.config.mjs`'s `site:` and `public/robots.txt`'s `Sitemap:` line together (the latter is hand-maintained and not generated from the former — see IN-02).

### IN-02: `public/robots.txt` duplicates the origin literal instead of being generated from `astro.config.mjs`

**File:** `public/robots.txt:4`
**Issue:** The `Sitemap:` URL is a hand-written copy of the same origin string that lives in `astro.config.mjs`'s `site:` field. `scripts/verify-seo.mjs` does guard against drift (it re-derives `ORIGIN` from `astro.config.mjs` and checks `robots.txt`'s `Sitemap:` line against it), so this won't silently break, but it is still two hand-maintained copies of the same fact with no single source of truth — a future domain change requires remembering to edit both files, relying entirely on the gate to catch a missed edit rather than making the duplication structurally impossible.
**Fix:** Consider generating `robots.txt` at build time (Astro supports a `.ts`/`.astro` endpoint for this) reading `Astro.site` directly, eliminating the second hand-maintained copy.

### IN-03: Inconsistent `aria-hidden` usage on decorative `<Icon>` components

**File:** `src/pages/index.astro:171, 176, 197` vs `95, 157`
**Issue:** The Hero CTA arrow icon (line 95) and the project-card fallback cover icon (line 157) both explicitly set `aria-hidden="true"` since they are purely decorative and sit next to (or replace) already-labeled content. The Live/Repo project-link icons (lines 171, 176) and the social-link icons (line 197) omit `aria-hidden="true"` entirely, despite being equally decorative (the Live/Repo links already have visible "Live"/"Repo" text; the social links already carry `aria-label={s.label}` on the parent `<a>`). This is a style/consistency gap rather than a functional a11y failure (unlabeled inline `<svg>` without an explicit `role` is typically not exposed to the accessibility tree by most browsers/screen readers), but it's worth aligning for consistency and to avoid relying on that implicit browser behavior.
**Fix:**
```astro
<Icon name="material-symbols:open-in-new" class="text-[16px]" aria-hidden="true" /> Live
...
<Icon name="material-symbols:code" class="text-[16px]" aria-hidden="true" /> Repo
...
<Icon name={s.icon} aria-hidden="true" />
```

### IN-04: Unverified TypeScript / `@astrojs/check` peer-compatibility

**File:** `package.json:37, 42`
**Issue:** `typescript` is pinned at `^6.0.3` alongside `@astrojs/check@^0.9.10`. The project's own stack research (per CLAUDE.md) flagged this exact pairing as "LOW-MEDIUM confidence... re-verify at implementation time since this moves independently of Astro." No evidence in this file set (e.g. a lockfile check or `astro check` CI run output) confirms this combination was actually exercised together.
**Fix:** Run `npm run check` in CI (or locally) against this exact lockfile and confirm it exits 0 before relying on it as a merge gate; pin more precisely if a mismatch surfaces.

---

_Reviewed: 2026-09-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
