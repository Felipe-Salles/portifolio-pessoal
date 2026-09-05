---
phase: 05-security-hardening-deploy
reviewed: 2026-09-05T01:18:31Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - .gitignore
  - astro.config.mjs
  - package.json
  - public/robots.txt
  - scripts/verify-csp-hash.mjs
  - scripts/verify-deploy-headers.mjs
  - scripts/verify-live-csp.mjs
  - scripts/verify-no-client-secrets.mjs
  - vercel.json
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-09-05T01:18:31Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the security-hardening/deploy phase's config, CSP/header gate scripts, and static config files. To go beyond static reading, I actually ran the build (`npm run build`), then executed `scripts/verify-csp-hash.mjs` and `scripts/verify-no-client-secrets.mjs` against the freshly built `dist/`, and ran `npm audit --audit-level=high`. All three passed cleanly (CSP hash matched the shipped Nav.astro script with zero drift, zero tracked/unsafe secrets, zero known-high vulnerabilities). I also traced the `assetsInlineLimit` function in `astro.config.mjs` into Vite's and Astro's actual source (`node_modules/vite/.../node.js`, `node_modules/astro/.../plugin-scripts.js`) to confirm the documented claim that font files and Astro's hoisted-script inlining share the same size-threshold code path — confirmed correct.

No Critical/BLOCKER findings survived this level of scrutiny; the CSP/header design (hash-pinned `script-src`, `frame-ancestors 'none'` + `X-Frame-Options: DENY` defense-in-depth, HSTS without `preload` per the project's own D-03 decision, `Permissions-Policy` denials) is internally consistent and empirically verified against the actual build output. The findings below are Warnings and Info items concerning gate coverage gaps, dependency-pinning rigidity, and small duplication/robustness issues — none of which are exploitable today but each of which narrows the safety margin these scripts are meant to provide.

## Warnings

### WR-01: `astro check` (type-checking) is not part of the aggregate `verify` gate

**File:** `package.json:28`
**Issue:** The `verify` script chains `build`, `verify:sec01`, `verify:tokens`, `verify:shell`, `verify:sections`, `verify:schema`, `verify:seo`, `verify:a11y`, `verify:csp-hash`, `verify:secrets` — but never `check` (which runs `astro check`, the project's own type-checking + Content Collection schema validator, per `@astrojs/check` in devDependencies). `Nav.astro`'s inline `<script>` block is written in strict TypeScript (`document.querySelector<HTMLElement>`, typed closures) specifically because this project is TS-first; a type regression there (or in any `.astro` frontmatter) can currently reach `npm run verify` green and ship, since nothing in the aggregate gate invokes the type checker.
**Fix:**
```json
"verify": "npm run build && npm run check && npm run verify:sec01 && npm run verify:tokens && npm run verify:shell && npm run verify:sections && npm run verify:schema && npm run verify:seo && npm run verify:a11y && npm run verify:csp-hash && npm run verify:secrets"
```

### WR-02: `path-to-regexp` security override is pinned to an exact version, not a range

**File:** `package.json:51-53`
**Issue:** `"overrides": { "path-to-regexp": "6.3.0" }` forces exactly `6.3.0` (the version that fixed the known ReDoS advisory pulled in transitively via `@astrojs/vercel`). An exact pin means npm will never resolve a *later* patch release of the 6.x line even when one exists — if a new CVE is discovered in `6.3.0` itself, this override silently keeps every future `npm install` on the vulnerable version until a human notices and bumps the literal string. `npm audit` currently reports 0 vulnerabilities, so there is no active exposure today, but the pinning style itself removes the safety net `overrides` is usually used to preserve.
**Fix:** Use a range that still forbids the vulnerable versions but allows future patches, e.g. `"path-to-regexp": "^6.3.0"` (or `">=6.3.0 <7.0.0"`), and keep `npm audit --audit-level=high` (already defined as `audit:ci`) running regularly so a future advisory is actually caught.

### WR-03: `tracked-env` check flags any `.env*`-named file, including safe template files

**File:** `scripts/verify-no-client-secrets.mjs:104-109`
**Issue:**
```js
for (const p of trackedPaths) {
  if (/^\.env/i.test(basename(p))) {
    trackedEnvCount++;
    addViolation("tracked-env", `${p} is tracked by git`);
  }
}
```
This regex matches the basename of *every* tracked file starting with `.env`, with no exception for conventionally-safe, secret-free template files such as `.env.example` or `.env.sample` — a widely recommended pattern for documenting required environment variables without leaking real values. If this project (or a future contributor) ever adds such a file, this gate fails even though nothing sensitive was committed, forcing an awkward rename or an ad-hoc exception just to satisfy the checker.
**Fix:** Exclude known-safe suffixes explicitly, e.g.:
```js
const SAFE_ENV_SUFFIXES = [".example", ".sample", ".template"];
if (/^\.env/i.test(basename(p)) && !SAFE_ENV_SUFFIXES.some((s) => basename(p).toLowerCase().endsWith(s))) {
  trackedEnvCount++;
  addViolation("tracked-env", `${p} is tracked by git`);
}
```

### WR-04: `.gitignore` contains duplicate/redundant entries

**File:** `.gitignore:11,14-15,20-21`
**Issue:** `.vercel/` (line 11) is functionally re-declared by the bare `.vercel` on line 20 (gitignore patterns without a trailing slash already match both files and directories, so line 20 is dead weight). Similarly, `.env` and `.env.production` (lines 14-15) are made entirely redundant by the broader `.env*` glob added on line 21. The file reads as two passes of edits stacked without cleanup, which makes it unclear to a future reader which line is "the real rule" and increases the chance of an inconsistent edit later (e.g. someone narrowing line 21 back down without realizing lines 14-15 no longer provide independent coverage for other `.env.*` variants).
**Fix:** Collapse to the broader patterns and drop the redundant lines:
```
node_modules/
dist/
.astro/
.vercel/
.env*
.DS_Store
```

## Info

### IN-01: `og-template` remains a real, publicly reachable route

**File:** `astro.config.mjs:34-36`
**Issue:** `sitemap({ filter: (page) => !page.includes("/og-template/") })` correctly excludes the OG-image screenshot template from the sitemap, and the page itself sets `<meta name="robots" content="noindex">`, but the route (`/og-template/`) is still physically served by the static build with no header-level or routing-level restriction — it is reachable by anyone who guesses or finds the URL (e.g. via the sitemap generator's own history, a leaked screenshot, or a wayback-machine crawl before noindex is honored). This is already an explicitly documented, accepted trade-off in the codebase's own comments, not a new discovery — flagged here only so it's visible in the phase's security review record, not because it needs to change.
**Fix:** No action required given the documented trade-off; if stricter isolation is ever wanted, a Vercel rewrite/redirect that 404s `/og-template/*` in production while still allowing local `astro dev`/screenshot tooling to reach it would close this gap entirely.

### IN-02: `public/robots.txt`'s Sitemap URL is a hand-maintained duplicate of `astro.config.mjs`'s `site`

**File:** `public/robots.txt:4`, `astro.config.mjs:20`
**Issue:** The production origin `https://portifolio-pessoal-seven-sigma.vercel.app` is hardcoded independently in two places: `astro.config.mjs`'s `site` (single source of truth for `@astrojs/sitemap`, canonical URLs, OG tags) and this static `public/robots.txt` file (a plain passthrough, not templated). If the site ever moves to a custom domain, both places must be remembered and updated by hand. `scripts/verify-seo.mjs` (outside this review's file list) does cross-check that the `robots.txt` Sitemap line starts with the configured origin, so drift would currently be caught by the existing verify pipeline — this is a duplication/maintainability note, not an unguarded risk.
**Fix:** No urgent action needed since a regression gate already exists; if desired, converting `public/robots.txt` to a `src/pages/robots.txt.ts` endpoint that reads `Astro.site` would remove the duplication at its source.

### IN-03: Inline-script/style detection in `verify-csp-hash.mjs` is regex-based HTML parsing

**File:** `scripts/verify-csp-hash.mjs:66`
**Issue:** `INLINE_SCRIPT_REGEX = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g` scans raw HTML text rather than using an HTML parser. For this project's current, small, tightly-controlled output (verified: exactly one inline script, matched hash, zero inline styles) it works correctly, but it is inherently fragile to any future markup containing an attribute value with a literal `>` character, or a non-executable inline `<script type="application/ld+json">` block (e.g. for structured-data SEO), which this regex would treat identically to an executable script and require a CSP hash entry for.
**Fix:** No change needed today; if structured-data JSON-LD or similar non-executable inline scripts are added later, either exclude `type="application/ld+json"` from the hash requirement explicitly, or move those blocks to build-time generated external files instead.

### IN-04: `audit:ci` is defined but not wired into any script reviewed here

**File:** `package.json:26`
**Issue:** `"audit:ci": "npm audit --audit-level=high"` exists as a standalone script but is not referenced by the `verify` aggregate script or any other script in this file list. Its execution therefore depends entirely on CI/deploy configuration outside this phase's reviewed files; if that wiring is ever removed or misconfigured, dependency vulnerability scanning silently stops happening with no signal from `npm run verify`.
**Fix:** No change to this file is strictly required, but consider documenting (in a comment or the project's deploy checklist) exactly where `audit:ci` is invoked, so its coverage isn't assumed without a visible trigger.

---

_Reviewed: 2026-09-05T01:18:31Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
