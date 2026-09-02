# Project Research Summary

**Project:** Portfólio Dev — Felipe Salles
**Domain:** Static-first personal developer portfolio (Astro + Content Collections, deployed to Vercel, security-conscious, PT-BR, no backend)
**Researched:** 2026-09-02
**Confidence:** HIGH

## Executive Summary

This is a single-page, fully static developer portfolio built with Astro and deployed to Vercel — a well-trodden pattern with strong official documentation and a clear "boring technology" path to follow. Experts build this exact product as zero-JS-by-default SSG: Astro's Content Collections for the repeatable Projects data, a centralized typed config module for placeholder/bio copy, Tailwind v4 via its official Vite plugin for styling, and platform-level (`vercel.json`) HTTP headers for security — no server runtime, no forms, no client-side data fetching, and no UI framework islands are needed anywhere in this build.

The recommended approach is to treat the existing HTML prototype (`Arquivos de design/code.html`) strictly as a visual/structural reference, not a code source: its Tailwind CDN `<script>`, Google Fonts `<link>` tags, Material Symbols icon font, and `lang="en"` attribute must all be replaced during the port, not carried forward, because each directly undermines the project's own explicit security requirement (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy). Doing so has a pleasant side effect: once Tailwind is compiled at build time, fonts are self-hosted via Astro's Fonts API, and icons are inline SVG, the site has zero legitimate external script/style/font origins — meaning CSP can be written as `default-src 'self'` from day one instead of growing into an allowlist. This "eliminate external origins first, write CSP second" sequencing is the single biggest lever identified across all four research files.

The primary risks are not stack-selection risks (the stack is settled and well-documented) but execution-order and verification risks: security headers configured only in `astro.config.mjs` experimental flags or tested only against `astro dev`/`astro preview` can silently fail to appear on the real deployed Vercel response; CSP hashes and font/icon choices depend on final component structure, so hardening must happen after (not before) components stabilize; and glassmorphism contrast must be checked against actual rendered (blurred/glowing) backgrounds, not flat design-token swatches. All of these are addressed by sequencing a dedicated security/verification pass near the end of the build, with `curl -I`/securityheaders.com checks against the live URL as the actual gate — not local dev confidence.

## Key Findings

### Recommended Stack

Astro `^7.2.10` is the framework (already decided by the user), paired with Tailwind CSS `^4.3.3` via the official `@tailwindcss/vite` plugin (never `@astrojs/tailwind`, which is deprecated) and the `@astrojs/vercel` adapter specifically to unlock `staticHeaders: true` — the mechanism that turns Astro's CSP config into real `vercel.json` HTTP headers instead of a `<meta>` tag (critical because `<meta>`-based CSP cannot carry `frame-ancestors`). Supporting libraries are deliberately minimal: `astro-icon` + `@iconify-json/material-symbols` for self-hosted inline SVG icons (replacing the prototype's Google-hosted Material Symbols icon font), and `@astrojs/sitemap` for SEO. Astro's built-in Fonts API (`fontProviders.google()`) self-hosts Lexend/Inter/JetBrains Mono at build time, eliminating the `fonts.googleapis.com`/`fonts.gstatic.com` origins the prototype currently depends on. Node.js `>=22.12.0` is a hard requirement for Astro 7.

**Core technologies:**
- Astro `^7.2.10` — SSG framework, ships zero JS by default, built-in Content Layer/Fonts/CSP APIs cover most explicit requirements without extra libraries
- Tailwind CSS `^4.3.3` via `@tailwindcss/vite` — utility styling matching the existing prototype's class names, configured via CSS `@theme` tokens (not a JS config file)
- `@astrojs/vercel` `^11.0.9` — Vercel adapter, required for `staticHeaders: true` to emit real CSP/security headers into `vercel.json`

### Expected Features

Feature scope is already well-defined in PROJECT.md and confirmed as correctly scoped by research — this is a "do the fundamentals excellently" domain, not a "find a differentiator" domain. Every P1 item below either matches an already-Active requirement or is a near-zero-cost SEO/a11y baseline that prevents an "unfinished" signal.

**Must have (table stakes):**
- Hero, Dossier (bio+stats), Tech Stack (categorized), Projects (cards with live/repo links), Contact (direct links only) — all already scoped
- Mobile-responsive layout, HTTPS, security headers — already scoped/constrained
- SEO meta tags + Open Graph/social preview image, favicon, `sitemap.xml`, `robots.txt`, custom 404, accessible semantic nav — cheap, expected baseline; missing any of these reads as "unfinished" to a technical recruiter audience

**Should have (competitive, add post-launch once real content lands):**
- Resume/CV download link, project case-study pages (single highest-leverage differentiator for a hiring audience), structured data (JSON-LD Person/ItemList), Astro View Transitions/micro-interactions, privacy-respecting analytics (Vercel Analytics)

**Defer (v2+, explicitly out of scope):**
- Blog/articles, functional contact form with backend, i18n (EN), light/dark mode toggle, live client-side GitHub stats widget — all correctly excluded per PROJECT.md and reinforced by research as anti-features that would reintroduce attack surface or maintenance burden this project deliberately avoids

### Architecture Approach

The system is a single build-time layer: `astro.config.mjs` wires Tailwind/Fonts/adapter; `src/styles/global.css` holds the `@theme` design tokens transcribed from DESIGN.md; `src/data/site.ts` centralizes all placeholder/config copy (name, bio, stats, stack, socials, nav) as a typed module so the eventual real-content swap touches one file, not N components; `src/content.config.ts` + `src/content/projects/*.md` define the Projects Content Collection with a zod schema (optional `liveUrl`/`repoUrl` from the start, since real links arrive later); and `src/pages/index.astro` composes `BaseLayout` + section components in prototype order. Only `Projects.astro` talks to `astro:content` — `ProjectCard.astro` stays pure-presentational, taking props only. The suggested build order front-loads "contract" artifacts (config, design tokens, data shape, content schema) before any visual component, and pushes composition/deploy/security-header work to the end.

**Major components:**
1. `BaseLayout.astro` — HTML shell, `<head>` (fonts, meta, SEO), background atmosphere layers, single seam for future pages (404, case studies)
2. `src/data/site.ts` — single source of truth for all non-project placeholder copy; components import slices, never hardcode strings
3. `Projects.astro` / `ProjectCard.astro` — data-fetching section vs. pure-presentational card, split specifically to keep the `astro:content` dependency contained to one file
4. `content.config.ts` — Projects Content Collection schema (glob loader, zod validation, `image()` helper), the only "N-many" data flow in the app

### Critical Pitfalls

1. **Tailwind CDN `<script>` carried over from the prototype** — forces `unsafe-eval`/`unsafe-inline` into CSP, directly contradicting the security requirement. Avoid by installing `@tailwindcss/vite` from the first commit; never let the CDN script exist in the Astro project even temporarily.
2. **Security headers assumed automatic on Vercel, or configured only via Astro's experimental static-output flags** — Vercel auto-adds HSTS only; CSP/X-Frame-Options/Referrer-Policy/Permissions-Policy need explicit `vercel.json` `headers` entries with a catch-all `source` glob, verified against the live deployed URL (`curl -I`/securityheaders.com), not local dev/preview.
3. **CSP silently breaking fonts, icons, or inline styles** — self-host fonts (Astro Fonts API) and icons (inline SVG via `astro-icon`) before writing CSP, so `default-src 'self'` works with no allowlist growth; test the production build specifically since dev-mode CSP behavior differs.
4. **Unoptimized images served from `public/`** — always route project screenshots/covers through `astro:assets` (`<Image>`), never plain `<img src="/public/...">`, to get WebP/AVIF + CLS prevention; establish this pattern before the first project card is built, not retrofitted later.
5. **Glassmorphism/dark-theme WCAG contrast failures** — translucent glass panels and low-opacity secondary text can drop below 4.5:1/3:1 thresholds depending on what's blurred behind them; test actual rendered contrast (Lighthouse/axe) against real backgrounds, not the DESIGN.md flat-swatch values, and apply visible `:focus-visible` states using the existing cyan-glow treatment.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Design System
**Rationale:** Every subsequent component depends on the `@theme` token names, font wiring, and Tailwind build pipeline existing correctly first — getting this wrong means rework across every component built afterward. This is also where the single most consequential security decision (no Tailwind CDN, no Google Fonts `<link>`) gets locked in structurally rather than left as a later cleanup.
**Delivers:** `astro.config.mjs` (Tailwind v4 Vite plugin, Fonts API config, `output: 'static'`), `src/styles/global.css` with full DESIGN.md token set transcribed into `@theme`, `src/data/site.ts` skeleton, `src/content.config.ts` schema, placeholder project entries, Node engine pinned.
**Addresses:** Foundational stack requirements (Astro, Tailwind, self-hosted fonts) from STACK.md
**Avoids:** Pitfall 1 (Tailwind CDN), Pitfall 3 groundwork (font/icon self-hosting decided structurally before CSP is written)

### Phase 2: Layout & Structural Components
**Rationale:** `BaseLayout`, `Nav`, and `Footer` wrap every page and depend only on Phase 1's tokens/data — build and verify these against the design contract before section-specific content work begins.
**Delivers:** `BaseLayout.astro` (head/meta/fonts/background layers), `Nav.astro` (with vanilla-JS mobile toggle, no framework island), `Footer.astro`.
**Uses:** `astro-icon` for inline SVG icons (Nav/social links), `site.ts` config data
**Implements:** Zero-JS-by-default pattern (Architecture Pattern 3) — no React/Vue for the mobile menu

### Phase 3: Content Sections (Hero, Dossier, Tech Stack, Projects, Contact)
**Rationale:** These sections are the actual product scope from PROJECT.md's Active requirements and depend only on Phase 1–2 artifacts (tokens, `site.ts`, Content Collection schema). `ProjectCard.astro` should be built before `Projects.astro` since it's pure-presentational with no data dependency.
**Delivers:** All six PROJECT.md-required sections, each independently verifiable against the prototype screenshot.
**Addresses:** All P1 table-stakes features from FEATURES.md (Hero, Dossier, Tech Stack, Projects w/ live+repo links, Contact w/ direct links, mobile responsiveness)
**Avoids:** Pitfall 8 (unoptimized `public/` images) — establish `astro:assets` `<Image>` usage on the first project card, not retrofitted later; Pitfall 6 groundwork (build a reusable `<SEO>`/`BaseHead` pattern here, not deferred)

### Phase 4: SEO, Accessibility & Polish
**Rationale:** SEO meta tags, sitemap, custom 404, and accessibility verification are cheap but easy to forget entirely if not made an explicit phase — research flags these as invisible during casual dev-mode browsing but immediately obvious to a recruiter sharing/scanning the site.
**Delivers:** `@astrojs/sitemap` integration, `robots.txt`, Open Graph/Twitter Card meta + branded placeholder OG image, favicon, custom 404 page, `lang="pt-BR"` fix, Lighthouse accessibility pass (contrast, focus states) on real rendered glass panels.
**Addresses:** Remaining P1 features from FEATURES.md (SEO/OG, favicon/sitemap/robots, accessible nav, 404)
**Avoids:** Pitfall 6 (missing/wrong SEO basics, `lang="en"` copied from prototype), Pitfall 7 (glassmorphism contrast failures)

### Phase 5: Security Hardening & Deploy
**Rationale:** CSP hash values and header configuration depend on the final, stable inline script/style content from all prior phases — this must come after components are structurally done, not before, or hardening work gets redone. This phase is also the only place a genuine "gotcha" (Vercel's automatic headers vs. what actually needs manual `vercel.json` configuration) needs deliberate attention.
**Delivers:** `vercel.json` with full header set (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) applied via catch-all `source` glob; `rel="noopener noreferrer"` audit on all `target="_blank"` links; `npm audit` clean gate; Vercel deploy; post-deploy verification via `curl -I`/securityheaders.com against the live URL (not local dev).
**Avoids:** Pitfall 2 (headers assumed automatic or incompletely scoped), Pitfall 3 (CSP breaking silently — verify zero console violations against the production build), Pitfall 4 (secret exposure), Pitfall 5 (stale dependency audit)

### Phase Ordering Rationale

- **Config/tokens/schema before components (Phases 1→2→3):** ARCHITECTURE.md's "Suggested Build Order" is explicit that everything acting as a "contract" (design tokens, data shape, content schema) must exist before visual components are built, to avoid rework if a token or schema field is missing later.
- **Security hardening last, not first or interleaved (Phase 5):** Both STACK.md and PITFALLS.md agree CSP/header work is dependent on final component structure (inline style/script content generates the hashes) — doing it early means redoing it after every subsequent component change. The header skeleton can exist early, but exact tuning is correctly a late-phase activity.
- **SEO/a11y as its own phase (Phase 4) rather than folded into content sections:** PITFALLS.md's "Looks Done But Isn't" checklist shows these are the class of issue most likely to be silently skipped if not given explicit phase-level attention — bundling them into Phase 3 risks them being treated as optional polish and dropped under time pressure.
- **No project-detail/case-study pages, no dark/light toggle, no i18n in any phase:** Per FEATURES.md's Anti-Features and PROJECT.md's Out of Scope, these are correctly excluded from v1 phase planning entirely; the schema/architecture already keeps the door open for case-study pages later without blocking v1.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Foundation & Design System):** Tailwind v4 `@theme` token transcription and Astro Fonts API weight-selection are new-ish (post-Astro-6) APIs; STACK.md flags the `vercel.json` header merge behavior between Astro's auto-generated CSP entry and manually authored entries as unverified ("MEDIUM confidence... verify at implementation time"). Worth a `--research-phase` pass or at minimum an early spike to confirm.
- **Phase 5 (Security Hardening & Deploy):** Astro's built-in CSP feature is explicitly still evolving (introduced ~5.9, stabilized in 6+ per STACK.md but PITFALLS.md notes real-world behavior differences between static/server output are still being worked out); the `staticHeaders: true` → `vercel.json` interaction is the single most-flagged "verify empirically" item across all four research files.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Layout & Structural Components):** Standard Astro layout/component patterns, well-documented, no novel integration risk.
- **Phase 3 (Content Sections):** Content Collections + `getCollection()` + typed props is a canonical, extensively-documented Astro pattern (HIGH confidence across STACK.md and ARCHITECTURE.md).
- **Phase 4 (SEO, Accessibility & Polish):** `@astrojs/sitemap`, OG meta tags, and Lighthouse-driven accessibility fixes are well-established, low-novelty work.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core Astro/Tailwind/Vercel-adapter claims verified against official docs via Context7 and live `npm view` registry queries on research date; a few Vercel-platform-default behaviors (e.g., automatic HSTS specifics) are MEDIUM, sourced from third-party guides rather than Vercel's own primary docs |
| Features | HIGH (table stakes) / MEDIUM (differentiators) | Table stakes cross-verified against PROJECT.md's own already-agreed scope plus multiple independent portfolio/SEO best-practice sources; differentiators are trend-based WebSearch findings (2026 portfolio roundups, single-author blogs), directionally solid but not authoritative |
| Architecture | HIGH (Astro/Tailwind mechanics) / MEDIUM (Vercel header config specifics) | Component/data-flow/build-order guidance verified via Context7 official Astro docs; the `vercel.json` header array syntax and merge-with-Astro-generated-config behavior is WebSearch-sourced, not verified against a single canonical Vercel doc |
| Pitfalls | MEDIUM-HIGH | Astro/Vercel mechanics and CSP hash behavior confirmed via official sources (Astro 5.9 CSP blog post, Vercel docs, Astro env-var docs); several best-practice claims (glassmorphism/WCAG interaction, general OWASP header guidance) are WebSearch-verified industry consensus rather than single authoritative citations |

**Overall confidence:** HIGH

### Gaps to Address

- **`vercel.json` header merge behavior:** Whether Astro's `staticHeaders: true`-generated CSP entry in `vercel.json` merges with or overwrites manually authored `headers` entries in the same file is unverified in docs retrieved during research. Resolve empirically during Phase 1/5 by running `vercel build` and inspecting `.vercel/output/config.json` before finalizing the header-writing approach.
- **TypeScript version to pin:** STACK.md flags LOW-MEDIUM confidence on the exact TypeScript major version to use alongside Astro 7's bundled tooling (training data is stale on TS release cadence relative to Astro). Re-verify at Phase 1 implementation time.
- **`sharp` bundling on Vercel's build environment:** Assumed auto-installed as Astro's default image service, but exact lockfile/hoisting behavior can vary by package manager — MEDIUM confidence, worth a smoke-test in Phase 1 or 3.
- **Astro CSP feature vs. `ClientRouter`/View Transitions incompatibility:** If Phase 4/post-launch polish considers Astro View Transitions (a FEATURES.md differentiator), STACK.md flags a real, documented incompatibility with the CSP feature — this is a genuine trade-off to resolve, not a hypothetical, if that differentiator is pursued.

## Sources

### Primary (HIGH confidence)
- Context7 `/withastro/docs` — Fonts API, CSP config/limitations, `@astrojs/vercel` adapter (`staticHeaders`), Content Collections `glob()` loader, `astro:assets` Image/Picture, Tailwind v4 integration guide, framework-components/islands guide
- `npm view` (live registry, 2026-09-02) — astro, @astrojs/vercel, @astrojs/tailwind, tailwindcss, @tailwindcss/vite, astro-icon, @iconify-json/material-symbols, @astrojs/sitemap, @astrojs/check, prettier-plugin-astro, typescript, eslint-plugin-astro
- Astro 5.9 CSP announcement, Astro 6.0 / 7.0 blog posts (astro.build/blog)
- Astro environment variables guide, Astro Images guide (docs.astro.build)
- `.planning/PROJECT.md` — primary source for confirmed scope/constraints
- `Arquivos de design/DESIGN.md` and `Arquivos de design/code.html` — primary source for design tokens, component boundaries, and existing prototype anti-patterns (Tailwind CDN, Google Fonts links, `lang="en"`)

### Secondary (MEDIUM confidence)
- Vercel Astro framework docs, Vercel response headers docs — WebSearch-verified against summaries, not fully primary-fetched
- 2026 developer portfolio trend/example roundups (DEV Community, Colorlib, Showproof, Shipixen, SEOAgent) — feature differentiator and SEO checklist research
- Axess Lab "Glassmorphism Meets Accessibility" — corroborated by well-established WCAG 2.1/2.2 numeric thresholds

### Tertiary (LOW confidence)
- Single-author blog posts on Astro SEO checklists and portfolio recruiter expectations — directionally useful, not independently verified
- WebSearch summaries of Vercel `vercel.json` header syntax patterns for non-Next.js static sites — consistent across sources but not traced to one canonical Vercel doc page

---
*Research completed: 2026-09-02*
*Ready for roadmap: yes*
