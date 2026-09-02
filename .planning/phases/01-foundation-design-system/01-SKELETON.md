# Walking Skeleton — Portfólio Dev (Felipe Salles)

**Phase:** 1 — Foundation & Design System
**Generated:** 2026-09-02
**Mode:** MVP / Walking Skeleton

---

## How the Walking Skeleton Concept Was Adapted

The generic Walking Skeleton checklist ("one real DB read/write", "one real UI interaction wired to the API") assumes a full-stack application. This project is a **static Astro site with `output: 'static'`** — there is no database, no server runtime, and no API layer, ever, by architectural decision (PROJECT.md, CLAUDE.md, 01-RESEARCH.md). Additionally, `01-CONTEXT.md`'s `<domain>` Phase Boundary is a **locked discuss-phase decision** that excludes all rendered product UI from Phase 1.

The concept was therefore adapted, not overridden:

| Generic skeleton item | This project's equivalent | Why |
|---|---|---|
| Database | **Astro Content Collections** | The `projects` collection, read by the `glob()` loader and validated by a Zod schema at build time, is the project's only data layer. |
| "One real read" | The Zod schema validating one placeholder entry during `astro build` | This is a genuine parse-and-validate of a real file through the real loader — not a mock. |
| "One real write" | Authoring the content file itself | In a static, file-based content paradigm the content file *is* the write. There is no runtime write operation to perform, and inventing one would be theatre. |
| "UI interaction wired to the API" | **Deliberately out of scope** | The locked CONTEXT.md phase boundary reserves nav/layout for Phase 2 and all content sections for Phase 3. Inventing a UI interaction here would violate an approved user decision. |
| Deployment to dev environment | `npm run dev` / `npm run build` + `npm run preview` | Vercel deployment is DEPLOY-01/02, mapped to Phase 5 in REQUIREMENTS.md traceability. Phase 1 documents the local full-stack run commands instead. |

---

## Capability Proven End-to-End

> The build pipeline compiles Astro + Tailwind v4 `@theme` tokens (wired from DESIGN.md) + self-hosted fonts and icons + a schema-validated placeholder Content Collection entry into a working `astro build` output, with **zero external network origins**.

This is the foundation every component in Phases 2–5 sits on. It is proven by three automated gates rather than by inspection.

---

## Architectural Decisions

These are contracts. Subsequent phases build on them without renegotiating.

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Astro `^7.2.10`, `output: "static"` | User-locked (PROJECT.md). Zero-JS by default, first-class Content Layer, no server runtime to secure. |
| Styling | Tailwind CSS `^4.3.3` via `@tailwindcss/vite`, CSS-first `@theme` | `@astrojs/tailwind` is officially deprecated. No `tailwind.config.*` file exists anywhere in this project — all tokens are CSS custom properties. |
| Design tokens | Single `@theme { }` block in `src/styles/global.css`, mirroring `Arquivos de design/DESIGN.md` frontmatter 1:1 | DESIGN.md is an approved design contract (LAY-02). Its frontmatter is canonical over the prose Colors section and over `code.html`'s radius block. |
| Fonts | Self-hosted via `@fontsource/{inter,lexend,jetbrains-mono}@^5.3.0`, imported **per weight** (12 imports) | D-01. Font binaries ship inside the npm tarball, so the build is offline-reproducible — no network call at runtime *or* during CI. Bare package imports silently load weight 400 only. |
| Icons | `astro-icon@^1.2.0` + `@iconify-json/material-symbols@^1.2.90`, build-time inline SVG | Inline SVG needs no request at all, not even same-origin, and adds no `font-src` entry to the Phase 5 CSP. All 7 required glyphs use base names with **no `-outline` suffix**. |
| Data layer — repeating | Astro Content Layer `projects` collection, `glob()` loader, defined at `src/content.config.ts` | The legacy `src/content/config.ts` location is not read by Astro 6+ and fails silently. Schema is a function `({ image }) => …` so the `astro:assets` `image()` helper is in scope (D-05). |
| Data layer — singleton | Typed TS module at `src/data/site.ts`, `as const` | D-02. Identity, bio, System Specs, tech stack, and socials each have exactly one instance; per-file schema validation would be pure overhead. |
| Placeholder content | Bracketed `[…]` for identity fields, `PLACEHOLDER — … a definir` for descriptive fields | D-03. Provisional content must be unmistakable so it cannot ship to production looking real. |
| TypeScript | `typescript@^6.0.3` (**not** `latest`/7.x), `tsconfig` extends `astro/tsconfigs/strict` | npm's `latest` tag is `7.0.2`, outside `@astrojs/check@0.9.10`'s peer range of `^5.0.0 \|\| ^6.0.0`. Corrects CLAUDE.md's own flagged-as-uncertain guidance. |
| Node engine | `>=22.12.0` in `package.json` `engines` | Astro 7's hard floor. Local machine runs v24.14.0. Must also be set in Vercel project settings at Phase 5. |
| Package manager | npm `11.13.0` | Claude's discretion per D-06 scope; already present and verified. |
| Deployment target | Vercel — **adapter deferred to Phase 5** | `@astrojs/vercel` is only needed for the `staticHeaders` → `vercel.json` CSP bridge, which is SEC-02/03 (Phase 5). Installing it now would add dependency surface no Phase 1 success criterion requires. |
| Directory layout | `src/content.config.ts`, `src/content/projects/`, `src/data/`, `src/layouts/`, `src/pages/`, `src/styles/`, `scripts/` | Matches Astro's documented conventions; `scripts/` holds the dependency-free Node verification gates. |
| Verification strategy | Three dependency-free Node ESM gates in `scripts/`, registered as `npm run verify:*` | Deterministic and repeatable. Notably, SEC-01 is *not* verified by eyeballing the DevTools Network tab — a bare `<link rel="preconnect">` loads nothing visible yet still opens an off-origin handshake. |

---

## Stack Touched in Phase 1

- [x] **Project scaffold** — `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, hand-authored (the repo root is non-empty, so `npm create astro` is not usable), plus `astro check` as the type-check gate
- [x] **Routing** — one real route (`src/pages/index.astro`) rendering through `src/layouts/Base.astro`
- [x] **Data layer** — real build-time read: the `glob()` loader parses `src/content/projects/placeholder-project.md` and validates it against the Zod schema. Enforcement is proven by a negative probe, not assumed.
- [ ] **UI interaction wired to an API** — **N/A by design.** No API exists in this architecture, and rendered UI is reserved for Phases 2–3 by the locked CONTEXT.md phase boundary. See "Out of Scope" below.
- [x] **Deployment** — documented local full-stack run: `npm run dev` (dev server), `npm run build` + `npm run preview` (production build). Vercel deployment is Phase 5 (DEPLOY-01/02).

---

## Local Full-Stack Run Commands

```
npm install          # install dependencies
npm run dev          # dev server
npm run build        # static build to dist/
npm run preview      # serve the built output
npm run check        # astro check — type-check .astro + collection schemas

npm run verify:sec01   # SEC-01 gate: zero external origins in dist/
npm run verify:tokens  # DESIGN.md → @theme fidelity gate
npm run verify:schema  # Content Collection positive + negative schema gate
npm run verify         # build, then all three gates in sequence — the phase gate
```

`npm run verify` passing is the definition of Phase 1 being complete.

---

## Out of Scope (Deferred to Later Slices)

Explicit, so later phases do not re-litigate Phase 1's minimalism:

- **All rendered product UI** — nav bar, footer, hero, dossier, tech stack, projects grid, contact section. Reserved for Phase 2 (LAY-03, SEO-06, A11Y-01) and Phase 3 (HERO/DOSS/TECH/PROJ/CONT, LAY-01, LAY-02) by the locked `01-CONTEXT.md` phase boundary. `src/pages/index.astro` is scaffolding — a pipeline-proof page and token gallery — and is replaced in Phase 2.
- **`@astrojs/vercel` adapter, `vercel.json`, CSP, HSTS, and all other security headers** — Phase 5 (SEC-02, SEC-03, SEC-04, DEPLOY-01, DEPLOY-02). Phase 1 covers SEC-01 only.
- **`@astrojs/sitemap`, robots.txt, favicon, Open Graph images, custom 404** — Phase 4 (SEO-01…05, A11Y-02).
- **`astro:assets` image optimisation actually running** — `coverImage` is *typed* through the `image()` helper now (D-05) so no migration is needed, but PROJ-04 is exercised at render time in Phase 3.
- **Real content** — REAL-01/02/03 in REQUIREMENTS.md v2. Everything authored in Phase 1 is conspicuously provisional by design (D-03).
- **Contact form / serverless email** — permanently out of scope (REQUIREMENTS.md "Out of Scope"). `src/data/site.ts` must never grow form-related fields.
- **Astro View Transitions / `ClientRouter`** — DIFF-04 (v2), and flagged in CLAUDE.md as incompatible with Astro's built-in CSP feature. Do not introduce without resolving that conflict first.
- **Typography visual sanity-check** — `01-UI-SPEC.md`'s Dimension 4 checker flagged the 1px gap between `mono-label` (14px) and `mono-code` (13px) as non-blocking, to be eyeballed once wired. This cannot be meaningfully judged on a token gallery; it belongs in Phase 3 where real text renders against `screen.png`. Carried forward as a Phase 3 verification item.

---

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2 — Layout & Navigation Shell:** visitor loads a page and sees the correct nav, footer, and metadata — PT-BR, keyboard-accessible, replacing the scaffolding `index.astro`.
- **Phase 3 — Content Sections:** visitor reads Hero, Dossier, Tech Stack, Projects (rendered from the `projects` collection), and Contact, matching the prototype and reflowing on mobile.
- **Phase 4 — SEO, Accessibility & Polish:** the site becomes discoverable, shareable, and accessibility-verified.
- **Phase 5 — Security Hardening & Deploy:** the full security header set is enforced and verified against the live Vercel production URL over HTTPS.
