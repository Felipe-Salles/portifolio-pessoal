# Phase 5: Security Hardening & Deploy - Research

**Researched:** 2026-09-04
**Domain:** Static-site security headers (CSP/HSTS/etc.) on Vercel + Git-based continuous deployment
**Confidence:** MEDIUM-HIGH (stack/CLI mechanics HIGH; the Astro↔Vercel automatic CSP-header bridge is MEDIUM/LOW due to a documented history of bugs for `output:"static"` — mitigated below with a deterministic hand-authored fallback)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (Production Domain):** Ship v1 on the default Vercel-assigned subdomain (e.g. `portifolio-pessoal.vercel.app`) — no custom domain purchased/pointed yet. `astro.config.mjs`'s `site:` field (currently the RFC 2606 placeholder `.example` domain) gets updated to the real `*.vercel.app` URL once the Vercel project is created and the assigned subdomain is known. A custom domain can be added later without any code rework — this only touches the `site:` config value and DNS, nothing structural.
- **D-02 (Deploy Workflow):** Connect the repo to GitHub and use Vercel's Git integration for continuous deployment (push to `main` → automatic production deploy; PRs/branches → preview deployments) — not a one-off manual `vercel deploy --prod` from the CLI. `git remote -v` currently returns nothing — there is no GitHub remote configured yet. Creating/connecting that GitHub repo is a prerequisite step this phase's plan must include before the Vercel project can be linked to it.
- **D-03 (HSTS):** Standard HSTS — `max-age` + `includeSubDomains`, **without** the `preload` directive. Preload is a submission to browser vendors' hardcoded list that's slow/hard to reverse and assumes a stable, final domain — premature while still on a placeholder `*.vercel.app` subdomain (D-01) and pre-real-content. Revisit preload once a custom domain (if any) is finalized.
- **D-04 (CSP Rollout):** Ship the Content-Security-Policy as a real enforcing header (`Content-Security-Policy`) from the start — not `Content-Security-Policy-Report-Only` as an interim step. The site has been verified self-hosted-only since Phase 1 (SEC-01, enforced by `scripts/verify-no-external-origins.mjs`), and `Nav.astro`'s mobile-toggle inline script was already written with `script-src 'self'` compatibility in mind.

### Claude's Discretion

- Exact CSP directive list beyond `default-src 'self'` (e.g. `script-src`, `style-src`, `img-src`, `font-src`, `frame-ancestors`, `object-src`, `base-uri`) — technical detail for research/planning, informed by what Phase 1–4 actually ship (self-hosted fonts/icons/scripts, no external origins).
- Whether CSP is emitted via Astro's built-in CSP API (auto-hashing inline scripts) or manually authored in `vercel.json` — implementation mechanism, not a user-facing choice. Per CLAUDE.md, `@astrojs/vercel` + `staticHeaders: true` is required regardless (meta-tag-only CSP can't express `frame-ancestors`/X-Frame-Options/HSTS/Referrer-Policy/Permissions-Policy for a static site).
- Permissions-Policy specific feature list (camera/microphone/geolocation/etc.) — standard deny-all posture for a portfolio site with zero use of those APIs; no gray area to raise.
- `npm audit` remediation approach if vulnerabilities are found (update vs. override vs. accept-and-document) — handled per finding at execution time, not a decision to lock now.
- Exact GitHub repo name/visibility (public vs. private) when creating the remote for D-02 — no strong preference surfaced; default to whatever the user's existing GitHub convention is, confirm at execution time if ambiguous.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. Custom domain and HSTS `preload` were both explicitly considered and deferred to a future pass once the domain is finalized (see D-01, D-03) — not new-capability ideas, just sequencing calls within this same phase's concerns.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-02 | Site envia CSP restritiva (`default-src 'self'` ou equivalente) via header HTTP real, verificada na URL de produção | Concrete directive list below (Code Examples), verified hash-based `script-src` for `Nav.astro`'s one inline script, hand-authored `vercel.json` recommended as the deterministic delivery mechanism (Pitfall 1) |
| SEC-03 | Site envia HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy e Permissions-Policy via `vercel.json` | Full `vercel.json` `headers` array example below, verified against Vercel's current official schema |
| SEC-04 | Nenhum segredo/API key exposto no client; `npm audit` sem vulnerabilidades conhecidas antes do deploy | `npm audit --audit-level=high` CI-gate pattern + lightweight secret-scan approach (Don't Hand-Roll, Code Examples) |
| DEPLOY-01 | Site publicado na Vercel, acessível via HTTPS | GitHub repo creation + Vercel Git-integration linking commands (Code Examples), both CLIs confirmed installed and authenticated in this environment |
| DEPLOY-02 | Headers de segurança (SEC-02, SEC-03) verificados contra a URL de produção real (não apenas `astro dev`/`preview` local) | `curl -I` verification pattern + a `verify:deploy`-style Node script skeleton, following this project's existing `scripts/verify-*.mjs` contract |
</phase_requirements>

## Summary

This phase adds one new dependency (`@astrojs/vercel`), one new root config file (`vercel.json`), and zero new application code — it is entirely infrastructure/config plus one new build-time verification gate. Two things came out of this research that materially change the "obvious" plan implied by CLAUDE.md:

1. **`staticHeaders: true` has a real, documented history of not reliably delivering headers (including CSP) for `output:"static"` Astro sites on Vercel** — Astro's own docs currently list `staticHeaders` as "**Available for:** Serverless" only (not "Serverless, Static" like the adapter's other options), and a closed GitHub issue (withastro/astro#13996, fixed by PR #14039) shows the CSP-to-`vercel.json` bridge previously wrote a header that the live response never actually included, specifically for `output: "static"` builds, because of `{"handle":"filesystem"}` route-ordering in the Build Output API config. The fix landed pre-Astro 6; this project is on `@astrojs/vercel@11.0.10`/`astro@7.3.1`, well past the fix, so it likely works — but "likely" is not good enough for a security-critical header with a documented bug history and a doc label that still says "Serverless" only. **Recommendation: install the adapter (satisfies CLAUDE.md and is needed for the Vercel deploy target regardless), but do not depend on the meta→header auto-bridge for the actual enforcing CSP. Hand-author all 6 headers directly in a root `vercel.json`** — this is also literally what Vercel's own official headers documentation demonstrates as the standard pattern, is framework-agnostic, and sidesteps the adapter-internal ambiguity entirely.
2. **The project has exactly one genuinely inline (non-externalized) script** — `Nav.astro`'s mobile-menu-toggle controller. Verified empirically against the current `dist/` build: Astro bundles/minifies it but leaves it as a literal `<script type="module">…</script>` in both `index.html` and `404.html` (not extracted to an external `/_astro/*.js` file). This means `script-src 'self'` alone is **not** sufficient — the CSP needs either a SHA-256 hash of this exact script's content or Astro's auto-hashing CSP feature. The current build's hash was computed and verified in this research session: `'sha256-9rao6+7BIzvFHjbooNK6nWAJiJNi1ORIwyjtuaVZ5Yo='` (will change if `Nav.astro`'s script content changes — the plan must include a deterministic drift-detection gate, not a one-time hardcode).

**Primary recommendation:** Install `@astrojs/vercel@^11.0.10` with `staticHeaders: true` (CLAUDE.md compliance + required for the Vercel build target), but deliver all 6 security headers — including CSP — via a hand-authored root `vercel.json` `headers` array, with the CSP `script-src` hash computed and verified by a new build-time gate script (`scripts/verify-csp-hash.mjs`, following the existing `scripts/verify-*.mjs` contract) that recomputes the inline script's hash from `dist/` and fails the build if it drifts from the value hardcoded in `vercel.json`. Connect GitHub via `gh repo create ... --source=. --remote=origin --push` (already authenticated in this environment as `Felipe-Salles`) and link Vercel via `vercel link` + `vercel git connect` (already authenticated as `felipe-salles`). Verify the live deployment with a `curl -I`-based Node script against the real production URL, per DEPLOY-02.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CSP / HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy | CDN / Static (Vercel edge, via `vercel.json`) | — | These are HTTP response headers on a 100%-static site with zero server-rendered routes; they belong at the platform/CDN layer (`vercel.json`), not in application code or middleware (which only runs for on-demand routes, of which this site has none — per CLAUDE.md). |
| Inline-script CSP hash computation | Build tooling (Node script, build-time) | — | Must run after `astro build` (needs the final minified/bundled script text from `dist/`) and before deploy; a deterministic Node script matches this project's existing `verify-*.mjs` pattern exactly. |
| GitHub repo creation & Git remote | Developer/CI tooling (`gh` CLI) | — | One-time infra setup, not application code; `gh` is already authenticated in this environment. |
| Vercel project creation & Git integration linking | Deploy platform tooling (`vercel` CLI or dashboard) | — | Infra setup; `vercel` CLI is already authenticated in this environment. |
| Live-header verification (DEPLOY-02) | Build/CI tooling (Node script using native `fetch`) | — | Must run **after** deploy completes against the real production URL — cannot be part of the local `npm run build`/`npm run verify` chain in the same way as Phases 1-4's gates (those ran against local `dist/`); this one is a post-deploy gate. |
| `npm audit` / secret scanning | Build/CI tooling | — | Pre-deploy gate, zero runtime/client-tier footprint. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/vercel` | `^11.0.10` | Vercel deployment adapter | [VERIFIED: npm registry] Current published version confirmed live via `npm view @astrojs/vercel version` → `11.0.10`. Peer dependency `astro: ^7.0.0` confirmed via `npm view @astrojs/vercel peerDependencies` — compatible with this project's installed `astro@7.3.1`. First published by the `withastro` org in 2022, repo `git+https://github.com/withastro/astro.git`, no `postinstall` script. Required per CLAUDE.md for the Vercel Build Output API deploy target; also the only way to get `staticHeaders` at all (belt-and-suspenders alongside the hand-authored `vercel.json` recommended below). |

No other new runtime/build dependency is needed for this phase — no secret-scanning library, no HTTP-testing library. `npm audit` is an `npm` subcommand (zero install). Live-header verification uses Node 22+'s native `fetch` (confirmed available: `node --version` → `v24.14.0` in this environment, native `fetch` present).

### Supporting
None new.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-authored `vercel.json` CSP header | Astro's `security.csp: true` + `staticHeaders: true` auto-bridge | Astro's auto-hashing removes the manual-hash-maintenance burden entirely and is the officially "intended" mechanism per CLAUDE.md/Astro docs — but it carries the documented static-output reliability risk above (Pitfall 1). If the executor verifies (via `vercel build` + inspecting `.vercel/output/config.json`, or directly via a live `curl -I` after a real deploy) that the bridge correctly delivers the header with the correct hash, this is a reasonable **upgrade** to make later — just don't gate SEC-02's ship-readiness on it working on the first try. |
| Node-native `fetch` for live-header verification | `curl -I` invoked via `child_process`, or Playwright (already a devDependency, used by `verify-a11y.mjs`/`generate-og-image.mjs`) | `curl` is not guaranteed present/consistent cross-platform (this dev environment is Windows; `curl` ships with modern Windows 10/11 but a Node script is more portable and testable). Playwright is overkill for a plain header check — it exists in this repo for real-browser rendering (a11y, OG screenshot), not for HTTP introspection. Native `fetch` is the leanest, most consistent-with-project-conventions choice (zero new dependency, same "plain Node ESM, zero deps" contract every other `verify-*.mjs` in this repo follows). |
| `gh repo create ... --push` (CLI) | Vercel's "Import Git Repository" flow which can create a GitHub repo on your behalf during project import | The `gh` CLI approach keeps repo creation explicit and scriptable/repeatable, and this environment already has `gh` authenticated as `Felipe-Salles` with `repo` scope — no reason to route through Vercel's dashboard-only repo-creation flow when the CLI path is faster and already available. |

**Installation:**
```bash
npm install @astrojs/vercel
```

**Version verification:** confirmed live in this research session:
```
$ npm view @astrojs/vercel version
11.0.10
$ npm view @astrojs/vercel peerDependencies
{ astro: '^7.0.0' }
$ npm view astro version
7.3.1
```

## Package Legitimacy Audit

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| `@astrojs/vercel` | npm | ~4.4 yrs (first published 2022-04-04, per `npm view time.created`) | `github.com/withastro/astro` (official monorepo, `packages/integrations/vercel`) | `[OK]` (verified live: `python -m slopcheck install @astrojs/vercel` → `[OK] @astrojs/vercel (npm)`) | Approved |

**Packages removed due to slopcheck `[SLOP]` verdict:** none
**Packages flagged as suspicious `[SUS]`:** none

No `postinstall` script present (`npm view @astrojs/vercel scripts.postinstall` returned empty). This is the official first-party Astro-team adapter, not a third-party/community package — combined with the slopcheck `[OK]` verdict and direct confirmation via Astro's own official documentation (Context7-equivalent: `docs.astro.build`), this is tagged `[VERIFIED: npm registry]` in the Standard Stack table above (package name discovered via official Astro docs, not via web search or training-data guess alone).

## Architecture Patterns

### System Architecture Diagram

```
 Developer machine                    GitHub                        Vercel
┌──────────────────┐   git push    ┌──────────┐   Git integration  ┌───────────────────────┐
│ local repo        │ ───────────► │  origin   │ ───────────────►  │ Vercel project          │
│ (no remote yet —   │  (gh CLI     │  (main)   │  webhook triggers │  linked via `vercel     │
│  D-02 prereq)      │   creates)   └──────────┘  a build per push  │  git connect`)          │
└──────────────────┘                                                │                          │
                                                                     │ 1. npm ci                │
                                                                     │ 2. astro build            │
                                                                     │    (+@astrojs/vercel     │
                                                                     │     adapter, staticHeaders│
                                                                     │     :true)                │
                                                                     │ 3. writes                 │
                                                                     │    .vercel/output/        │
                                                                     │    config.json (Build     │
                                                                     │    Output API)            │
                                                                     │ 4. root vercel.json        │
                                                                     │    (hand-authored headers  │
                                                                     │    array) is layered on    │
                                                                     │    top / read alongside    │
                                                                     └──────────┬────────────────┘
                                                                                │ deploy
                                                                                ▼
                                                                     ┌───────────────────────┐
                                                                     │ Vercel Edge / CDN       │
                                                                     │ serves prerendered      │
                                                                     │ static HTML + applies   │
                                                                     │ vercel.json headers on  │
                                                                     │ every response          │
                                                                     └──────────┬────────────────┘
                                                                                │ HTTPS
                                                                                ▼
                                                                     https://<project>.vercel.app
                                                                                │
                                                                                │ curl -I / verify-
                                                                                │ deploy.mjs (DEPLOY-02,
                                                                                │ post-deploy gate,
                                                                                │ NOT astro preview)
                                                                                ▼
                                                                     Pass/fail: CSP, HSTS,
                                                                     X-Frame-Options,
                                                                     X-Content-Type-Options,
                                                                     Referrer-Policy,
                                                                     Permissions-Policy all
                                                                     present + correct
```

### Recommended Project Structure
```
/ (repo root)
├── vercel.json                      # NEW — hand-authored headers array (SEC-02/SEC-03)
├── astro.config.mjs                 # MODIFIED — adds @astrojs/vercel adapter + staticHeaders:true, site: real *.vercel.app URL
├── scripts/
│   ├── verify-csp-hash.mjs          # NEW — recomputes Nav.astro's inline-script SHA-256 from dist/, asserts it matches vercel.json's hardcoded hash
│   └── verify-deploy-headers.mjs    # NEW — DEPLOY-02 gate: curl-equivalent fetch(HEAD) against the LIVE production URL, asserts all 6 headers present+correct
└── package.json                     # MODIFIED — new scripts: verify:csp-hash (local, part of `npm run verify`), verify:deploy (post-deploy only, NOT part of build-time verify chain), audit gate
```

### Pattern 1: Hand-authored `vercel.json` headers (primary CSP/HSTS delivery mechanism)
**What:** A single `headers` array entry with `source: "/(.*)"` matching every route, listing all 6 security headers as key/value pairs.
**When to use:** Always, for this project — it is the deterministic, framework-adapter-independent mechanism; it is also literally the pattern shown in Vercel's own official `vercel.json` reference documentation for security headers.
**Example:**
```json
// Source: https://vercel.com/docs/project-configuration/vercel-json#headers (verified live, fetched 2026-09-04)
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'sha256-9rao6+7BIzvFHjbooNK6nWAJiJNi1ORIwyjtuaVZ5Yo='; style-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        }
      ]
    }
  ]
}
```
Notes on this directive list (Claude's Discretion per CONTEXT.md):
- `default-src 'self'` — matches SEC-02's literal wording, and is consistent with SEC-01's already-enforced self-hosted-only posture.
- `script-src 'self' 'sha256-...'` — the hash covers `Nav.astro`'s one genuinely inline `<script type="module">` (verified identical across `index.html` and `404.html` in the current build — see Summary). `'self'` alone covers the two external `/_astro/*.js` chunks Astro/Tailwind may also emit, if any exist at build time (current build has none, but this keeps the policy future-proof for any additional externalized script Astro adds).
- `style-src 'self'` — no `'unsafe-inline'` needed: the current build has zero `<style>` tags and zero `style="..."` attributes (verified against `dist/index.html`/`dist/404.html`); all CSS ships as two external `<link rel="stylesheet">` files (Tailwind's compiled output + Astro's per-page CSS bundle).
- `img-src 'self' data:` — `data:` is defensive/optional: the current build has zero `data:` URIs (verified), but Astro's `astro:assets`/`sharp` pipeline or `astro-icon` could plausibly emit a tiny inline data-URI in a future placeholder/blur scenario; drop the `data:` grant entirely if a stricter policy is preferred and no `data:` usage is ever introduced.
- `font-src 'self'` — all fonts are self-hosted via `@fontsource/*` (SEC-01-enforced), no external font origin.
- `frame-ancestors 'none'` — this is the directive Astro's meta-tag-only CSP **cannot** express (browsers ignore `frame-ancestors` inside `<meta http-equiv>`); a real header is required, confirming CLAUDE.md's framing that a header (not meta) is necessary regardless of which mechanism generates it.
- `object-src 'none'` / `base-uri 'self'` / `form-action 'self'` — standard hardening defaults for a site with no `<object>`/`<embed>` usage, no dynamic `<base>` tag, and (per PROJECT.md's explicit no-contact-form decision) no form to submit anywhere but `'self'` if one is ever reintroduced.

### Pattern 2: Build-time CSP-hash drift detection
**What:** A new `scripts/verify-csp-hash.mjs` gate (added to `npm run verify`, run against local `dist/` like every other Phase 1-4 gate) that recomputes the SHA-256 hash of `Nav.astro`'s inline script from the just-built `dist/index.html` and asserts it matches the hash hardcoded in `vercel.json`.
**When to use:** Every build, as part of the existing `npm run verify` chain — this is the mechanism that makes a hand-authored (rather than Astro-auto-generated) CSP hash safe to hardcode: if `Nav.astro`'s script content ever changes, this gate fails loudly at build time instead of silently shipping a CSP that blocks the (now-different) script in production.
**Example:**
```js
// Illustrative skeleton — follows the exact contract of scripts/verify-no-external-origins.mjs
// (dist/-existence guard, plain Node ESM, zero deps, fixed summary line, exit 0 only on match)
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const DIST_INDEX = "dist/index.html";
const VERCEL_JSON = "vercel.json";

if (!existsSync(DIST_INDEX)) {
  console.error("dist/index.html not found — run npm run build first");
  process.exit(1);
}

const html = readFileSync(DIST_INDEX, "utf8");
const match = /<script type="module">([\s\S]*?)<\/script>/.exec(html);
if (!match) {
  console.error("verify-csp-hash: no inline <script type=\"module\"> found in dist/index.html");
  process.exit(1);
}
const computedHash = `sha256-${createHash("sha256").update(match[1], "utf8").digest("base64")}`;

const vercelConfig = JSON.parse(readFileSync(VERCEL_JSON, "utf8"));
const cspHeader = vercelConfig.headers[0].headers.find((h) => h.key === "Content-Security-Policy").value;

const ok = cspHeader.includes(`'${computedHash}'`);
console.log(`CSPHASH SUMMARY computed=${computedHash} present_in_vercel_json=${ok}`);
process.exit(ok ? 0 : 1);
```
*(Verified against this project's real current build in this research session: computed hash was `sha256-9rao6+7BIzvFHjbooNK6nWAJiJNi1ORIwyjtuaVZ5Yo=`, identical across `dist/index.html` and `dist/404.html`.)*

### Pattern 3: Post-deploy live-header verification (DEPLOY-02)
**What:** A `verify-deploy.mjs`-style script, run manually (or via a documented follow-up command) **after** the Vercel deployment completes, that `fetch()`es the real production URL and asserts every required header is present with the expected value. This is intentionally **not** part of `npm run build`/`npm run verify` (those run against local `dist/`, before any deploy exists) — it's a separate, explicit post-deploy step, consistent with CLAUDE.md's explicit warning that `astro preview` does not simulate Vercel's header layer.
**Example:**
```js
// Illustrative skeleton. Takes the production URL as an argv (no hardcoded
// second copy of the domain — same "read from config, don't duplicate the
// literal" discipline as scripts/verify-seo.mjs's ORIGIN pattern).
const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/verify-deploy-headers.mjs <production-url>");
  process.exit(1);
}

const REQUIRED = [
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

const res = await fetch(url, { method: "HEAD" });
const missing = REQUIRED.filter((h) => !res.headers.has(h));

for (const h of REQUIRED) {
  console.log(`${h}: ${res.headers.get(h) ?? "(missing)"}`);
}
console.log(`DEPLOY SUMMARY status=${res.status} missing=${missing.length}`);
process.exit(missing.length === 0 && res.status === 200 ? 0 : 1);
```
This mirrors `curl -I <url>` (headers-only request) but stays inside the project's existing "plain Node ESM, zero deps" script convention. `securityheaders.com` (mentioned in ROADMAP.md/CONTEXT.md) can be used as a **manual, human-facing** secondary check — it is a third-party scanning service, not something to script a hard build gate against (no stable API contract to depend on, and it introduces an external network dependency into an otherwise self-contained verify chain).

### Anti-Patterns to Avoid
- **Relying solely on Astro's `security.csp` + `staticHeaders` auto-bridge for the enforcing CSP header, with no fallback:** given the documented history (Pitfall 1 below), this risks SEC-02 silently failing in production while local dev/`astro build` looks fine — exactly the "meta tag looked right, header never arrived" failure mode from withastro/astro#13996.
- **Verifying headers only via `astro preview` or local `vercel dev`:** CLAUDE.md is explicit that `astro preview` does not simulate Vercel's header layer at all. `vercel dev`/`vercel build && vercel deploy --prebuilt` get closer but DEPLOY-02's requirement is explicitly the **real deployed production URL**, not any local simulation — always run the final check with `curl -I`/`verify-deploy-headers.mjs` against the actual `https://*.vercel.app` URL.
- **Hardcoding the CSP script hash with no drift check:** a hash that silently goes stale the next time `Nav.astro`'s script changes is worse than no hash at all — it produces a confusing, hard-to-diagnose CSP violation in production for a change that looked correct locally. Always pair a hand-authored hash with a build-time recompute-and-compare gate (Pattern 2).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Setting HTTP response headers on Vercel | Custom Astro middleware / a `_headers`-file convention borrowed from Netlify | `vercel.json`'s native `headers` array | Astro middleware only runs for on-demand/SSR routes — this site has none (per CLAUDE.md). Netlify's `_headers` file syntax is not read by Vercel at all. `vercel.json` is the platform-native, documented mechanism and applies to prerendered/cached static responses too. |
| Live production HTTP header verification | A hand-rolled `curl` wrapper shelled out via `child_process`, or a full Playwright browser launch just to read response headers | Node 22+'s native `fetch()` (`await fetch(url, {method:'HEAD'})`) | Zero new dependency, cross-platform-consistent (no reliance on a system `curl` binary being present/identical across the dev machine and any future CI runner), and this project already treats "plain Node ESM, zero deps" as its house style for every `verify-*.mjs` gate. |
| Dependency vulnerability scanning | A custom package-lock diff/CVE-matching script | `npm audit --audit-level=high` (built into `npm`, zero install) | npm's own registry-backed advisory database is the canonical source; a hand-rolled scanner would need to reinvent CVE matching for zero benefit on a project this size. |
| Secret/API-key scanning in client-shipped code | A custom regex-secret-scanner script from scratch | A short, explicit allowlist check: (a) confirm no `.env*` file is tracked by git (`git ls-files | grep -i '\.env'` should be empty), (b) grep `dist/` for common high-entropy/prefix patterns your own codebase might introduce (e.g. `sk_live_`, `AKIA`, a bare 40-char hex string) as a lightweight defense-in-depth check, (c) confirm no `import.meta.env.*` reference in `src/` resolves to anything other than a `PUBLIC_`-prefixed variable (Astro's own convention: only `PUBLIC_`-prefixed env vars are ever inlined into client bundles — everything else is build/server-only and never reaches `dist/`). This project currently defines zero env vars at all, so this check should trivially pass; it exists as a gate against *future* regressions, not because a real secret is suspected today. Heavier tooling (gitleaks, trufflehog) is disproportionate for a static portfolio with no backend and is explicitly not recommended here — CLAUDE.md's own philosophy ("complexity only when necessary") argues against it. |

**Key insight:** every mechanism this phase needs (headers, header verification, audit, secret hygiene) has a built-in or already-installed answer — Vercel's platform config, Node's native `fetch`, npm's own audit subcommand, and a grep-based convention check. The only genuinely new piece of logic is the CSP-hash drift check (Pattern 2), and that's a ~15-line script matching an established in-repo pattern, not a new abstraction.

## Common Pitfalls

### Pitfall 1: `staticHeaders: true` may not deliver headers (including CSP) for `output:"static"` builds
**What goes wrong:** The adapter writes the CSP header into `.vercel/output/config.json`, but the live deployed response never actually includes it — everything *looks* configured correctly (build succeeds, no errors, config file has the right content) but `curl -I` against the deployed URL shows the header missing.
**Why it happens:** Astro's own current documentation lists `staticHeaders` as "**Available for:** Serverless" only — every other adapter option that explicitly supports static output (`webAnalytics`, `imageService`, etc.) is documented as "Serverless, Static"; `staticHeaders` is the one exception. A now-closed GitHub issue (withastro/astro#13996, "experimentalStaticHeaders not working on Vercel", reported against `output: "static"`) confirms this exact symptom; the fix (PR #14039, merged) was a route-ordering bug — the adapter was placing `{"handle":"filesystem"}` *before* the static header routes in the generated Build Output API config, which caused Vercel's filesystem handler to serve the response before the header-carrying route ever matched.
**How to avoid:** Do not depend on this bridge as the sole CSP delivery mechanism for a production security control. Hand-author the full header set (including CSP) directly in a root `vercel.json` `headers` array (Pattern 1) — this is unaffected by the adapter's internal route-ordering logic entirely, since it's the platform's own top-level project configuration, not something generated by the framework build.
**Warning signs:** `vercel build` succeeds and `.vercel/output/config.json` contains a `Content-Security-Policy` entry, but `curl -I https://<project>.vercel.app/` (or `verify-deploy-headers.mjs`) does not show it in the response.

### Pitfall 2: `astro preview` (and even `astro dev`) do not simulate Vercel's header layer at all
**What goes wrong:** Headers look correct/missing locally in a way that has zero bearing on what actually ships to production, wasting debugging time in the wrong place.
**Why it happens:** `astro preview` serves the static `dist/` output through Astro's own minimal Node server, which has no knowledge of `vercel.json` at all — Astro's built-in CSP feature (if enabled) only ever emits a `<meta>` tag locally; the header-delivery path is entirely a Vercel-platform-side concern that only exists once code is actually processed by `vercel build`/an actual Vercel deployment.
**How to avoid:** Per CLAUDE.md, use `vercel build && vercel deploy --prebuilt` (or `vercel dev`) for a closer local approximation, but treat DEPLOY-02's literal requirement — verifying against the real deployed production URL — as the only authoritative check. Don't sign off on SEC-02/SEC-03 based on any local tool.
**Warning signs:** Any verification step in the plan that calls `astro preview` or `npm run preview` and checks response headers there is testing the wrong layer.

### Pitfall 3: A `<meta http-equiv="content-security-policy">` tag cannot express every directive this phase needs
**What goes wrong:** Even if the Astro↔Vercel bridge worked perfectly, `frame-ancestors` is silently ignored by browsers when set via `<meta>` — it only takes effect as a real HTTP response header. Relying on meta-tag CSP alone would ship a CSP that looks complete in the HTML source but is missing clickjacking protection in the browser's actual enforced policy.
**Why it happens:** This is a CSP-spec-level restriction (not an Astro/Vercel bug) — `frame-ancestors`, along with `sandbox` and `report-uri`/`report-to`, are documented by the CSP spec itself as meta-tag-incompatible directives.
**How to avoid:** Ship CSP as a real header (Pattern 1) — resolved automatically by the recommended hand-authored `vercel.json` approach, since it never uses a `<meta>` tag at all.
**Warning signs:** N/A if using the recommended approach — flagging this so the planner understands *why* the meta-tag path was rejected, not just that it was.

### Pitfall 4: `npm audit`'s default scope includes devDependencies, which is usually the right call here but worth being explicit about
**What goes wrong:** A vulnerability in a build-time-only tool (e.g., a transitive dep of `playwright` or `sharp`) fails the audit gate even though nothing about it ships to the client — this can look like a false alarm if the team assumes "npm audit = production runtime risk" for a framework that has no runtime server at all.
**Why it happens:** For a fully static site, *everything* in `package.json` (including `devDependencies`) is build-time-only — there is no "production dependency that ships to a running server" distinction the way there would be for a Node backend. `npm audit` by default scans the full dependency tree from `package-lock.json`.
**How to avoid:** Treat the full-tree audit (not `--omit=dev`) as correct for this project — a compromised build-time tool (e.g., a malicious `postinstall` in a transitive dep) is exactly as dangerous as a compromised runtime dependency would be for a server app, arguably more so since it runs with full filesystem/network access during CI. Use `npm audit --audit-level=high` as the CI-failing gate (fails on high/critical only; low/moderate findings are visible in output but don't block, per CONTEXT.md's discretion note that remediation approach is handled per-finding, not locked now).
**Warning signs:** A plan that adds `--omit=dev` "to reduce noise" without discussing the tradeoff above.

### Pitfall 5: HSTS is effectively irreversible once a browser caches it, so scope matters
**What goes wrong:** Setting HSTS on the wrong host (or with `includeSubDomains` when a subdomain genuinely needs plain HTTP, e.g. a future preview/staging subdomain) locks out HTTP access for the `max-age` duration for every visitor whose browser already saw the header — cannot be undone by simply removing the header later.
**Why it happens:** HSTS is a browser-side cache, not a server-side setting — once a browser receives the header once over HTTPS, it will refuse to downgrade to HTTP for that exact host (and all subdomains, if `includeSubDomains` is set) until `max-age` expires, *regardless* of what the server sends afterward.
**How to avoid:** This project ships on Vercel, which serves 100% of traffic over HTTPS by default (including the `*.vercel.app` subdomain) — there is no legitimate plain-HTTP use case to protect against here, so `includeSubDomains` without `preload` (D-03) is safe. The only genuine risk is if a *different, unrelated* service is ever put on a subdomain of the eventual custom domain that can't support HTTPS — not a concern for the current `*.vercel.app` subdomain (D-01), which Vercel fully controls.
**Warning signs:** N/A for the current locked decisions — flagging for awareness if/when a custom domain is added later (D-01 already earmarks this domain-dependent revisit).

### Pitfall 6: `gh repo create` interactive prompts vs. non-interactive flags
**What goes wrong:** `gh repo create` run without explicit flags drops into an interactive wizard, which can hang/fail unexpectedly in a scripted or agent-driven execution context.
**Why it happens:** `gh repo create` is designed as an interactive-first CLI command by default.
**How to avoid:** Always pass explicit flags: `gh repo create <name> --private|--public --source=. --remote=origin --push` — this is fully non-interactive and does exactly what D-02 needs in one command (creates the remote repo, adds it as `origin`, and pushes the current local `main` branch in one step).
**Warning signs:** A plan step that just says "create a GitHub repo" without the exact flags.

## Code Examples

### `astro.config.mjs` additions (adapter + site update)
```js
// Source: docs.astro.build/en/guides/integrations-guide/vercel/ (verified live,
// fetched 2026-09-04) — staticHeaders + adapter import shape.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "static",
  // D-01: replaced once the real Vercel-assigned subdomain is known.
  site: "https://<real-project-name>.vercel.app",
  adapter: vercel({
    // Kept enabled for CLAUDE.md compliance / forward-compatibility even
    // though this project's own vercel.json (not this bridge) is the
    // verified delivery mechanism for the security headers — see
    // 05-RESEARCH.md Pitfall 1.
    staticHeaders: true,
  }),
  integrations: [
    icon(),
    sitemap({ filter: (page) => !page.includes("/og-template/") }),
  ],
  vite: { plugins: [tailwindcss()] },
});
```

### GitHub repo creation + push (D-02 prerequisite)
```bash
# Source: `gh repo create --help` (gh 2.96.0, verified installed + authenticated
# in this environment as Felipe-Salles, scopes: gist/read:org/repo).
# Run from the repo root; creates the remote repo AND pushes the local
# `main` branch to it as `origin` in a single non-interactive command.
gh repo create <repo-name> --public --source=. --remote=origin --push
# (or --private — see CONTEXT.md discretion note; this account's existing
# repos split roughly 6 private / 4 public, no hard convention either way —
# a public portfolio repo is arguably the more natural default for a site
# whose entire purpose is to be shown to recruiters, but confirm with the
# user at execution time per CONTEXT.md.)
```

### Vercel project linking + Git integration (D-02)
```bash
# Source: `vercel link --help` / `vercel git --help` (Vercel CLI 58.5.1,
# verified installed + authenticated in this environment as felipe-salles).
vercel link --yes           # creates/links a Vercel project to this directory
vercel git connect          # connects the linked Vercel project to the
                             # GitHub remote just created — enables the
                             # push-to-main-deploys-to-prod / PR-preview
                             # workflow D-02 requires, with zero further
                             # manual `vercel deploy` calls needed going forward.
```

### `package.json` script additions
```json
{
  "scripts": {
    "verify:csp-hash": "node scripts/verify-csp-hash.mjs",
    "verify": "npm run build && npm run verify:sec01 && npm run verify:tokens && npm run verify:shell && npm run verify:sections && npm run verify:schema && npm run verify:seo && npm run verify:a11y && npm run verify:csp-hash",
    "audit:ci": "npm audit --audit-level=high",
    "verify:deploy": "node scripts/verify-deploy-headers.mjs"
  }
}
```
`verify:deploy` is intentionally **not** chained into `npm run verify` — it requires a live URL argument and can only run after a real deployment exists, unlike every other gate in this chain which runs against local `dist/`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Meta-tag-only CSP (`<meta http-equiv="content-security-policy">`, no adapter) | Real `Content-Security-Policy` HTTP response header via platform config (`vercel.json`) or an adapter's header-bridge feature | Astro 6.0 (CSP API stabilized), `@astrojs/vercel@10.0.0` (`staticHeaders` introduced) | Enables `frame-ancestors` and every other header this phase needs that a `<meta>` tag structurally cannot express. |
| `@astrojs/vercel`'s legacy split `static`/`serverless` adapter packages (pre-Astro 5) | A single unified `@astrojs/vercel` adapter where `astro.config.mjs`'s `output` setting (not a different adapter import) controls static vs. on-demand behavior | Astro 5 adapter unification | Simpler install surface (one package), but `staticHeaders`'s own documentation still internally labels itself "Available for: Serverless" — a residual naming artifact from the pre-unification split that is a genuine source of confusion (Pitfall 1), not a sign the option is broken by design. |
| Manual `vercel deploy --prod` CLI invocations per release | Git-integration-driven CI/CD (push to `main` → auto-deploy; PR → preview deploy) | Standard Vercel practice for years, reaffirmed by D-02 | Matches this phase's locked decision; no manual deploy step needed once `vercel git connect` is run once. |

**Deprecated/outdated:**
- The old two-package `@astrojs/vercel/static` + `@astrojs/vercel/serverless` import split — current `@astrojs/vercel@11.x` is a single package; do not follow any tutorial/StackOverflow answer referencing those old sub-path imports.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `staticHeaders: true` + Astro's `security.csp` correctly bridges CSP into a real, correctly-delivered header for this project's `output:"static"` build on the current `@astrojs/vercel@11.0.10` — i.e., that the withastro/astro#13996 bug is fully fixed for this version combination. | Summary, Pitfall 1 | LOW risk to the plan itself — the research explicitly does NOT recommend depending on this bridge; it recommends the hand-authored `vercel.json` as the verified-working mechanism regardless. If A1 turns out true, the auto-bridge is simply redundant/unused, not harmful. |
| A2 | A public GitHub repo is the more natural default for this specific project (portfolio meant to be shown to recruiters) despite the user's existing repos being ~60% private. | Code Examples (GitHub repo creation) | LOW — CONTEXT.md already flags this as "confirm at execution time if ambiguous," so this is presented as a suggestion, not a locked choice. Wrong guess only costs a `gh repo edit --visibility` follow-up command. |
| A3 | The current build's inline-script SHA-256 hash (`sha256-9rao6+7BIzvFHjbooNK6nWAJiJNi1ORIwyjtuaVZ5Yo=`) will still be correct by the time this phase is executed. | Code Examples (vercel.json CSP header) | MEDIUM if treated as a permanent hardcoded value with no drift check — this is exactly why Pattern 2 (build-time drift detection) is presented as a required companion, not optional. If `Nav.astro` changes between now and execution, the plan's Task list must regenerate this hash as part of implementation, not copy this research doc's value blindly. |
| A4 | `img-src 'self' data:` is a reasonable inclusion despite zero current `data:` URI usage in the build. | Code Examples (CSP directive list) | LOW — purely additive permissiveness for a hypothetical future need; dropping `data:` entirely (stricter) is explicitly noted as an equally valid, stricter alternative in Pattern 1's notes. |

**If this table is empty:** N/A — see entries above. All other claims in this research (npm registry versions, Vercel `vercel.json` schema, `gh`/`vercel` CLI command syntax, the withastro/astro#13996 issue/fix, the current build's actual script/style/data-URI inventory) were verified live against official documentation, live CLI probes against this exact environment, or direct inspection of this project's real `dist/` build output during this research session.

## Open Questions

1. **Does `staticHeaders: true` + `security.csp` actually deliver a correct CSP header on THIS project's real deployment, given `@astrojs/vercel@11.0.10`?**
   - What we know: the specific bug that caused this to fail for `output:"static"` (withastro/astro#13996) was fixed by a merged PR; the current adapter version postdates the fix.
   - What's unclear: Astro's own current documentation still labels `staticHeaders` "Available for: Serverless" (not "Serverless, Static") with no caveat explaining why — meaning either the docs are stale/imprecise, or there's a real remaining limitation not fully captured by the closed issue.
   - Recommendation: don't gate the plan on this working — use the hand-authored `vercel.json` as the verified primary mechanism (already reflected in this research's recommendation). Optionally have the executor enable `security.csp: true` too and inspect `.vercel/output/config.json` after `vercel build` out of curiosity/future-proofing, but this is not required for SEC-02 to pass.

2. **Exact `npm audit` findings are unknown until run against this project's actual current lockfile** (research did not run a full install/audit in this session to avoid mutating repo state beyond what's needed).
   - What we know: `npm audit --audit-level=high` is the correct CI-gate invocation (verified via WebSearch, cross-referenced against npm's own documented exit-code behavior).
   - What's unclear: whether any current dependency (e.g., in `playwright`, `sharp`, or a transitive dep) currently has a high/critical advisory.
   - Recommendation: the plan should include running `npm audit --audit-level=high` as an early Task, with remediation (update/override/accept-and-document, per CONTEXT.md's discretion note) handled based on whatever it actually reports at execution time — not pre-decided here.

3. **Final GitHub repo name and visibility.**
   - What we know: no strong user preference surfaced (CONTEXT.md discretion note); `git remote -v` is currently empty.
   - What's unclear: the exact repo name to use (this project's local folder is `portifolio-pessoal`/`portifolio pessoal` — with a space, which is not a valid GitHub repo name and would need sanitizing, e.g. `portifolio-pessoal` or `felipe-salles-portfolio`).
   - Recommendation: confirm the exact repo name with the user at plan-execution time (a `checkpoint:human-verify`-style confirmation before running `gh repo create`, since this is a one-time, mildly awkward-to-undo naming decision — renaming later is possible but breaks any already-shared links).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | D-02 (GitHub repo creation) | ✓ (authenticated as `Felipe-Salles`, scopes: gist/read:org/repo) | 2.96.0 | GitHub web UI repo-creation flow, manual `git remote add` |
| `vercel` CLI | D-02 (Vercel project + Git integration linking), local build/header inspection | ✓ (authenticated as `felipe-salles`) | 58.5.1 | Vercel dashboard's "Import Git Repository" flow |
| Node.js (native `fetch`) | Live-header verification script (DEPLOY-02) | ✓ | v24.14.0 (project requires `>=22.12.0`, both satisfy native `fetch`) | `curl -I` invoked via `child_process`, if a script-based approach is ever swapped out |
| `npm audit` | SEC-04 | ✓ (bundled with npm, no separate install) | — | — |
| `@astrojs/vercel` (to be installed) | Vercel deploy target, `staticHeaders` | Not yet installed — this phase installs it | `^11.0.10` (verified current on npm registry) | — |

**Missing dependencies with no fallback:** none — every tool this phase needs is already installed and authenticated in this environment, or is a zero-install `npm`/Node built-in.

**Missing dependencies with fallback:** none currently missing.

## Security Domain

> `security_enforcement` is not explicitly set in `.planning/config.json` (absent = enabled per default). This entire phase *is* the security domain, so this section is tailored rather than boilerplate: this is a zero-auth, zero-backend, zero-user-input static site, so most ASVS categories (authentication, session management, access control, input validation of user-submitted data) are structurally not applicable — there is no login, no server, and no form (per PROJECT.md's explicit no-contact-form decision). The relevant controls are entirely in the "secure configuration / transport / response headers" family.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | N/A — no login/auth surface exists or is planned for v1 |
| V3 Session Management | No | N/A — no sessions/cookies issued anywhere in this project |
| V4 Access Control | No | N/A — every route is public, prerendered, static content by design |
| V5 Input Validation | No | N/A — no user input is ever accepted (no contact form, per explicit PROJECT.md out-of-scope decision) |
| V9 Communications (Transport Security) | Yes | HSTS (`max-age=63072000; includeSubDomains`, no `preload` per D-03) + Vercel's default TLS termination (HTTPS enforced platform-wide, verified via DEPLOY-01) |
| V14 Configuration | Yes | This entire phase: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy delivered via `vercel.json`; `npm audit` as a dependency-hygiene gate; no secrets in client bundle |

### Known Threat Patterns for a static Astro/Vercel site

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Clickjacking (site framed by a malicious third-party page) | Spoofing/Tampering | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (belt-and-suspenders — the latter is the modern/spec-current control, the former covers older browsers that don't honor `frame-ancestors`) |
| Reflected/stored XSS via a compromised or misconfigured third-party script/style origin | Tampering/Elevation of Privilege | CSP `default-src 'self'` + explicit `script-src`/`style-src` allowlist with a content hash for the one inline script — structurally impossible for this project's threat model to load a third-party script anyway, given SEC-01's build-time enforcement, but CSP is the defense-in-depth layer against a future regression |
| MIME-type sniffing leading to a non-script resource being executed as script | Tampering | `X-Content-Type-Options: nosniff` |
| Referrer leakage of internal/query-string details to third-party link targets | Information Disclosure | `Referrer-Policy: strict-origin-when-cross-origin` (sends full URL only to same-origin destinations; sends only the origin, not the path/query, cross-origin) |
| Unwanted browser feature access (camera/mic/geolocation) via an embedded/compromised script | Elevation of Privilege | `Permissions-Policy` deny-all posture for every sensitive feature this site never uses |
| Downgrade/MITM interception over plain HTTP after the first visit | Tampering/Information Disclosure | HSTS (D-03) — Vercel serves 100% HTTPS by default regardless, HSTS closes the narrow first-request/direct-HTTP-link window |
| Supply-chain compromise via a malicious/compromised npm dependency (including build-time-only tooling) | Tampering | `npm audit --audit-level=high` pre-deploy gate (Pitfall 4) + this research's own Package Legitimacy Audit for the one new dependency this phase adds |

## Sources

### Primary (HIGH confidence)
- `docs.astro.build/en/guides/integrations-guide/vercel/` (fetched live 2026-09-04, including the `staticHeaders`-specific fragment) — adapter config reference, `staticHeaders` type/default/"Available for" field, CSP-integration description
- `raw.githubusercontent.com/withastro/docs/main/.../vercel.mdx` (fetched live 2026-09-04) — verbatim confirmation of `staticHeaders`'s "Available for: Serverless" label and comparison against every other option's availability field
- `docs.astro.build/en/reference/configuration-reference/` (fetched live 2026-09-04) — `security.csp` sub-options (`algorithm`, `directives`, `styleDirective`, `scriptDirective`), documented View-Transitions/Shiki/dev-mode limitations
- `vercel.com/docs/project-configuration/vercel-json` (fetched live 2026-09-04, `last_updated: 2026-08-14` per page frontmatter) — exact `headers` array schema, `source`/`headers`/`has`/`missing` object definitions, full JSON example
- `github.com/withastro/astro` issue #13996 and PR #14039 (fetched live 2026-09-04) — the specific static-output CSP-header-delivery bug and its fix (route-ordering / `{"handle":"filesystem"}` placement)
- `npm view @astrojs/vercel version / peerDependencies / scripts.postinstall / repository.url / time.created` and `npm view astro version` (run live in this session, 2026-09-04) — `11.0.10`, `{astro: '^7.0.0'}`, no postinstall script, `github.com/withastro/astro`, first published `2022-04-04`, `astro@7.3.1` respectively
- `slopcheck install @astrojs/vercel` (run live in this session via `python -m slopcheck`) — `[OK]` verdict
- Direct inspection of this project's real `dist/index.html` / `dist/404.html` / `dist/og-template/index.html` (this session) — confirmed exactly one inline `<script type="module">` (byte-identical across pages, SHA-256 = `9rao6+7BIzvFHjbooNK6nWAJiJNi1ORIwyjtuaVZ5Yo=`), zero `<style>` tags, zero `style="..."` attributes, zero `data:` URIs, two external stylesheet `<link>`s
- Live probes in this exact dev environment (this session): `gh auth status` (authenticated, `Felipe-Salles`, scopes gist/read:org/repo), `vercel whoami` (authenticated, `felipe-salles`), `node --version` (`v24.14.0`, confirms native `fetch`), `gh repo list Felipe-Salles` (visibility mix, informs A2)

### Secondary (MEDIUM confidence)
- WebSearch: "vercel.json headers array source example" — cross-verified against the primary `vercel.com/docs/project-configuration/vercel-json` fetch above, consistent
- WebSearch: "npm audit exit code CI gate audit-level high" — cross-verified against npm's own documented `--audit-level` failure-threshold semantics

### Tertiary (LOW confidence)
- None relied upon as load-bearing for a recommendation in this document — every claim above was either fetched from an official/primary source, verified via a live command in this environment, or verified by direct inspection of this project's actual build output.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — single new dependency, version/peer-deps/repo/postinstall all confirmed live via `npm view`, slopcheck `[OK]`
- Architecture (vercel.json headers mechanism): HIGH — verified against Vercel's own current official schema docs, with a working full example
- Architecture (Astro CSP auto-bridge / staticHeaders): MEDIUM-LOW — genuinely uncertain due to conflicting signals (doc label says "Serverless" only; the specific historical bug was fixed; no way to be fully certain without a live deploy at execution time) — this is why the research explicitly routes around depending on it
- Pitfalls: HIGH — each pitfall traces to either a fetched primary source (Astro docs, Vercel docs, a specific GitHub issue/PR) or a live probe/inspection run in this session against this exact project

**Research date:** 2026-09-04
**Valid until:** ~14 days (shorter than this project's other phases' typical 30-day validity, because the central open question — whether `staticHeaders`/CSP auto-bridging works correctly — depends on `@astrojs/vercel` internals that have changed at least once recently and could plausibly change again; the hand-authored `vercel.json` recommendation itself, however, is stable/evergreen Vercel platform behavior and not time-sensitive)
