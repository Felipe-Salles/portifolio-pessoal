# Phase 5: Security Hardening & Deploy - Pattern Map

**Mapped:** 2026-09-03
**Files analyzed:** 6 (2 modified, 4 new)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `astro.config.mjs` (modified) | config | transform (build config) | `astro.config.mjs` (current file itself — additive edit) | exact |
| `package.json` (modified) | config | transform (script wiring) | `package.json` (current file itself — additive edit) | exact |
| `vercel.json` (new) | config | request-response (platform header injection) | *(none in-repo — first JSON platform-config file)* | no-analog (see below, `tsconfig.json` used as JSON-style fallback) |
| `scripts/verify-csp-hash.mjs` (new) | utility / test-gate | file-I/O + transform (hash recompute + compare) | `scripts/verify-no-external-origins.mjs` | exact |
| `scripts/verify-deploy-headers.mjs` (new) | utility / test-gate | request-response (live HTTP fetch against prod URL) | `scripts/verify-seo.mjs` (for the "read config, no hardcoded literal" + summary-line contract) + `scripts/verify-no-external-origins.mjs` (for the exit-code/violations contract) | role-match |
| `src/components/Nav.astro` (unchanged, read-only reference) | component | event-driven (inline script) | n/a — this is the CSP hash *source*, not a file being written | reference only |

## Pattern Assignments

### `scripts/verify-csp-hash.mjs` (utility, file-I/O + transform)

**Analog:** `scripts/verify-no-external-origins.mjs` (full file read — 217 lines, SEC-01 gate)

This is the strongest analog in the repo: both scripts (a) guard on `dist/` existing before doing anything, (b) are plain Node ESM with zero dependencies (`node:fs`/`node:path`/`node:crypto` only), (c) accumulate violations into an array rather than exiting on first failure, (d) print one fixed-format summary line to stdout before exiting, (e) exit 0 only when the violation count is zero.

**Guard clause pattern** (lines 49-56):
```javascript
function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}
```
Copy this exact guard shape for `verify-csp-hash.mjs` — same fixed message style ("X not found — run npm run build first"), same `fail()` helper, same early-exit-1 (not throw).

**Summary-line + exit code pattern** (lines 206-217):
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
`verify-csp-hash.mjs` should follow the exact same shape: one `console.log` summary line with a `<PREFIX> SUMMARY key=value key=value` format (RESEARCH.md's skeleton proposes `CSPHASH SUMMARY computed=<hash> present_in_vercel_json=<bool>` — keep that literal format), `process.exit(ok ? 0 : 1)`.

**Imports pattern** (lines 28-29):
```javascript
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
```
For `verify-csp-hash.mjs`, the equivalent import block (per RESEARCH.md's skeleton, already aligned with this convention) is:
```javascript
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
```
No third-party deps — matches every `verify-*.mjs` in this repo.

**File header comment convention** (lines 1-26): every `verify-*.mjs` opens with a `#!/usr/bin/env node` shebang, a one-line role description tied to a requirement ID (e.g. "SEC-01 gate"), and a `// Contract (see <plan-file>.md Task N):` comment block enumerating exact guarantees (exit codes, summary line format, what counts as a violation). Copy this header shape for `verify-csp-hash.mjs`, tying it to SEC-02 and this phase's plan file once it exists.

---

### `scripts/verify-deploy-headers.mjs` (utility, request-response)

**Primary analog for the "no hardcoded literal, read from config" discipline:** `scripts/verify-seo.mjs` lines 40-51:
```javascript
if (!existsSync(CONFIG_PATH)) {
  fail(`${CONFIG_PATH} not found — cannot determine the site origin`);
}

const configSrc = readFileSync(CONFIG_PATH, "utf8");
const siteMatch = /\bsite:\s*["']([^"']+)["']/.exec(configSrc);
if (!siteMatch) {
  fail(`${CONFIG_PATH}: could not find a \`site:\` config value to read the origin from`);
}
// The single source of truth for every absolute URL this gate checks —
// never duplicate this literal anywhere else in this file.
const ORIGIN = siteMatch[1].replace(/\/$/, "");
```
`verify-deploy-headers.mjs` differs slightly per RESEARCH.md (it takes the production URL as a CLI arg, `process.argv[2]`, rather than reading `astro.config.mjs`'s `site:` — because at DEPLOY-02 time the "real" URL is whatever Vercel actually assigned, which may briefly differ from the `site:` value if the config hasn't been updated yet). Still apply the *same discipline*: never hardcode a second copy of the domain string anywhere in the script body — take it from a single named `const url = process.argv[2]` (or, if the config is trusted to be current, from the same `ORIGIN`-from-`astro.config.mjs` extraction shown above) and reference that one binding everywhere.

**Secondary analog for violations/summary contract:** `scripts/verify-no-external-origins.mjs` lines 206-217 (same pattern as above) and `scripts/verify-seo.mjs` lines 488-506:
```javascript
for (const v of violations) {
  console.error(`verify-seo: ${v.check} — ${v.detail}`);
}

console.log(
  `SEO SUMMARY sitemap=${sitemapOk ? "ok" : "fail"} robots=${
    robotsOk ? "ok" : "fail"
  } meta=${metaOk ? "ok" : "fail"} ... violations=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
```
`verify-deploy-headers.mjs` should print each header's presence/value (per RESEARCH.md's skeleton — `console.log(`${h}: ${res.headers.get(h) ?? "(missing)"}`)`), then one `DEPLOY SUMMARY status=<n> missing=<n>` line, then `process.exit(...)`.

**Divergence from every existing `verify-*.mjs`:** this is the first gate in the repo whose data source is a live network fetch, not local `dist/` files. There is no in-repo analog for "guard on `dist/` existing" here — the guard instead should be "usage: no URL arg passed" (RESEARCH.md skeleton lines 261-265). Do not copy the `existsSync(DIST_DIR)` guard shape verbatim; copy the *fail-fast-with-a-clear-usage-message* discipline instead, applied to the missing-argv case. Also, per RESEARCH.md/CLAUDE.md, this script must **not** be wired into `npm run verify` the way every other gate is (`verify:sec01` through `verify:a11y` all chain into `npm run build && ...`) — it needs a live URL argument and can only run post-deploy, so it gets its own standalone `verify:deploy` script entry, invoked manually/documented as a separate step.

---

### `astro.config.mjs` (modified — additive)

**Analog:** the file's own current structure (self-consistent — this is an edit, not a new file).

**Current imports pattern** (lines 1-8):
```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
```
Add `import vercel from "@astrojs/vercel";` to this same block, same style (default import, package name, no aliasing) — matches how `@astrojs/sitemap` was added in Phase 4.

**Current `site:` placeholder + TODO comment convention** (lines 13-17):
```javascript
// TODO(Phase 5): replace with the real production domain once DEPLOY-01
// assigns it — every og:image/canonical/sitemap/robots.txt URL depends on
// this. ".example" is an RFC 2606-reserved placeholder TLD, guaranteed
// never to resolve to a real site.
site: "https://portfolio-felipe-salles.example",
```
This is the exact line the plan replaces per D-01 — swap the literal string for the real `*.vercel.app` URL once known, and delete the now-resolved `TODO(Phase 5)` comment (do not leave a stale TODO referencing a phase that has landed).

**`integrations:` array convention** (lines 18-23) — `adapter:` is a sibling top-level key to `integrations:`, not inside the array; per RESEARCH.md's Code Examples block, insert it as its own `adapter: vercel({ staticHeaders: true })` key alongside `output`, `site`, `integrations`, `vite`.

---

### `package.json` (modified — additive)

**Analog:** the file's own current `scripts` block structure (self-consistent).

**Existing gate-wiring pattern** (lines 16-23):
```json
"verify:sec01": "node scripts/verify-no-external-origins.mjs",
"verify:tokens": "node scripts/verify-design-tokens.mjs",
"verify:shell": "node scripts/verify-shell.mjs",
"verify:sections": "node scripts/verify-sections.mjs",
"verify:schema": "node scripts/verify-content-schema.mjs",
"verify:seo": "node scripts/verify-seo.mjs",
"verify:a11y": "node scripts/verify-a11y.mjs",
"verify": "npm run build && npm run verify:sec01 && npm run verify:tokens && npm run verify:shell && npm run verify:sections && npm run verify:schema && npm run verify:seo && npm run verify:a11y"
```
Every gate follows `"verify:<short-id>": "node scripts/verify-<kebab-name>.mjs"`, then gets appended to the end of the `verify` chain with `&&`. Add `"verify:csp-hash": "node scripts/verify-csp-hash.mjs"` following this exact naming convention, and append `&& npm run verify:csp-hash` to the end of the existing `verify` chain (do not reorder the existing gates — always append, matching how `verify:seo` and `verify:a11y` were appended in Phase 4 without reordering Phase 1-3 gates).

Add `"audit:ci": "npm audit --audit-level=high"` and `"verify:deploy": "node scripts/verify-deploy-headers.mjs"` as two **standalone** entries — per RESEARCH.md, neither is chained into `npm run verify` (audit is arguably a candidate to chain in, but RESEARCH.md's Code Example keeps it separate; `verify:deploy` structurally cannot be chained since it needs a live URL arg post-deploy).

**Existing `build` script chaining convention** (line 11):
```json
"build": "astro build && node scripts/generate-og-image.mjs",
```
Shows the established `astro build && node scripts/<something>.mjs` chaining style already used once (Phase 4, OG image generation) — same `&&`-chain discipline applies to any new build-time step, though this phase's new gates are wired via `verify`, not `build`.

**Dependencies block** (lines 25-35): add `"@astrojs/vercel": "^11.0.10"` to `dependencies` (not `devDependencies`) — matches where `@astrojs/sitemap`, `astro-icon`, `astro` itself live (runtime/build integrations go in `dependencies`; test/tooling like `playwright`, `@axe-core/playwright`, `wcag-contrast` go in `devDependencies`).

---

### `vercel.json` (new — first JSON platform-config file in this repo)

**No true in-repo analog** — this is the first Vercel-platform config file. The closest structural analog for "flat JSON config object, no comments, `extends`/array-of-objects shape" is `tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "Arquivos de design"]
}
```
This only confirms the *formatting* convention (2-space indent, double-quoted keys, no trailing commas, no comments — JSON has none) — it does not inform the `headers` array shape itself, since JSON config files don't share cross-tool schemas. **Use RESEARCH.md's Pattern 1 example verbatim as the structural source** (verified live against `vercel.com/docs/project-configuration/vercel-json`), not an in-repo file:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'sha256-<HASH>'; style-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" }
      ]
    }
  ]
}
```
The `'sha256-<HASH>'` placeholder must be the value computed and asserted by `scripts/verify-csp-hash.mjs` (Pattern above) — this is the one piece of `vercel.json` that is generated/verified, not fully static, so the plan must sequence "build once to compute the real hash → hand-write it into `vercel.json` → add the drift-detection gate" rather than writing this file blind.

---

## Shared Patterns

### `verify-*.mjs` script contract (applies to both new scripts)
**Source:** `scripts/verify-no-external-origins.mjs` (full file), `scripts/verify-seo.mjs` (full file)
**Apply to:** `scripts/verify-csp-hash.mjs`, `scripts/verify-deploy-headers.mjs`

Every verification gate in this repo, without exception, follows:
1. `#!/usr/bin/env node` shebang + header comment naming the requirement ID(s) it gates and a `// Contract (see <plan>.md Task N):` bullet list.
2. Plain Node ESM, zero third-party dependencies — only `node:fs`, `node:path`, `node:crypto` (as needed).
3. A `fail(message)` (or equivalent) early-exit-1 helper for hard preconditions (missing `dist/`, missing config, missing CLI arg).
4. Accumulate all findings into a `violations`/`missing` array — never exit on the first failure; report everything found in one run.
5. Print every violation to `console.error` with a consistent per-line prefix (`scriptname: check — detail` or `path:line: reason`).
6. Print exactly one fixed-format summary line to `console.log` (`<PREFIX> SUMMARY key=value key=value ...`) as the last line before exit — this is what CI/humans grep for a pass/fail signal.
7. `process.exit(0)` only when zero violations/missing; `process.exit(1)` otherwise.

### `package.json` verify-chain wiring
**Source:** `package.json` lines 16-23
**Apply to:** any new gate — append-only (`verify:<id>` entry + append to the end of the `verify` chain), never reorder or interleave with existing Phase 1-4 gates. Post-deploy-only gates (`verify:deploy`) and non-`dist/`-dependent gates (`audit:ci`) stay outside the `verify` chain entirely, as standalone `npm run <script>` entries.

### Config-file TODO/placeholder convention
**Source:** `astro.config.mjs` lines 13-17
**Apply to:** the `site:` edit in this phase — replace the `TODO(Phase 5)` placeholder block entirely (comment + `.example` literal) with the real value; do not leave a dangling TODO comment once its phase has landed, matching how this repo has treated every other now-resolved placeholder.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `vercel.json` | config | request-response (CDN header injection) | First platform-level JSON config file in this repo; no prior Vercel-specific config exists. Use RESEARCH.md's Pattern 1 (sourced from Vercel's own official schema docs) as the structural template instead of an in-repo analog — `tsconfig.json` only confirms generic JSON formatting conventions, not the `headers` array shape. |

## Metadata

**Analog search scope:** `scripts/` (all 8 files), repo root (`astro.config.mjs`, `package.json`, `tsconfig.json`), `src/components/Nav.astro` (CSP-hash source reference)
**Files scanned:** 11 (8 scripts + 3 root config files)
**Pattern extraction date:** 2026-09-03
