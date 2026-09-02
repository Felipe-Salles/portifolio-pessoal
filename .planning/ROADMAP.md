# Roadmap: Portfólio Dev — Felipe Salles

## Overview

The site is built bottom-up: first a secure, self-hosted build foundation (no external CDN/script/font risk, design tokens wired in), then the structural shell every page shares (nav, footer, semantic layout), then the six content sections that are the actual product (Hero, Dossier, Tech Stack, Projects, Contact, responsive reflow), then the SEO/accessibility baseline a technical recruiter expects, and finally security-header hardening and a verified production deploy on Vercel. Each phase is a vertical slice of a single-page static site — there is no separate "backend phase" because there is no backend.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Design System** - Secure, self-hosted build pipeline and design tokens with zero external script/font/icon origins
- [ ] **Phase 2: Layout & Navigation Shell** - Shared nav/footer/page shell matching the design system, in PT-BR, fully keyboard-accessible
- [ ] **Phase 3: Content Sections** - Hero, Dossier, Tech Stack, Projects, and Contact sections rendered and responsive per the prototype
- [ ] **Phase 4: SEO, Accessibility & Polish** - Discoverability, share previews, custom 404, and accessibility verification
- [ ] **Phase 5: Security Hardening & Deploy** - Production security headers verified live on Vercel over HTTPS

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: The project has a secure, self-contained build pipeline and design-token foundation — no external script/font/icon origins — ready for components to be built on top of it.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01
**Success Criteria** (what must be TRUE):
  1. Site builds and runs (dev/preview) making zero external network requests for scripts, fonts, or icons — Tailwind, fonts, and icons are all self-hosted/compiled at build time
  2. DESIGN.md tokens (color palette, typography scale, spacing) are wired into Tailwind's `@theme` config and usable by any component
  3. A placeholder project entry validates successfully against the Astro Content Collection schema, confirming the data shape before any UI is built
**Plans**: 3 plans (2 waves)
- [ ] 01-01-PLAN.md — Walking Skeleton: Astro build pipeline with self-hosted fonts/icons and the automated SEC-01 zero-external-origin gate
- [ ] 01-02-PLAN.md — DESIGN.md tokens wired into Tailwind v4 `@theme`, prototype CSS primitives, and an automated token-fidelity gate
- [ ] 01-03-PLAN.md — `projects` Content Collection schema with a validated placeholder entry, plus the typed `site.ts` singleton
**UI hint**: yes

### Phase 2: Layout & Navigation Shell
**Goal**: Visitor loads any page and sees the correct site shell — navigation, footer, and page metadata — matching the design system, in Portuguese, and fully keyboard-accessible.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: LAY-03, SEO-06, A11Y-01
**Success Criteria** (what must be TRUE):
  1. Visitor sees a nav bar with logo, section links (Dossier/Stack/Projects/Contact), and a "Connect" button matching DESIGN.md
  2. On mobile, visitor can open and close the nav via a toggle that works without any JS framework (vanilla JS only)
  3. Visitor navigating by keyboard alone can reach every nav link and see a visible cyan focus glow
  4. Page HTML declares `lang="pt-BR"` and uses semantic `<nav>`/`<main>` landmarks
**Plans**: TBD
**UI hint**: yes

### Phase 3: Content Sections
**Goal**: Visitor can read every core section of the portfolio — Hero, Dossier, Tech Stack, Projects, Contact — matching the prototype's visual design and reflowing correctly on mobile.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: HERO-01, HERO-02, DOSS-01, DOSS-02, TECH-01, TECH-02, PROJ-01, PROJ-02, PROJ-03, PROJ-04, CONT-01, LAY-01, LAY-02
**Success Criteria** (what must be TRUE):
  1. Visitor sees a Hero section with placeholder identity/title, an availability badge, and a CTA that leads to Projects
  2. Visitor reads a Dossier section with bio text and "System Specs" stats displayed alongside it
  3. Visitor sees Tech Stack badges grouped into Languages/Frameworks/Infrastructure, styled as monospace badges per DESIGN.md
  4. Visitor browses Project cards (rendered from the Astro Content Collection) showing name, description, tech tags, and safe external live/repo links (`rel="noopener noreferrer"`), with optimized cover images via `astro:assets`
  5. Visitor finds a Contact section with direct email/GitHub/LinkedIn links and no form
  6. On mobile, all sections reflow per DESIGN.md (20px margins, adaptive grid, reduced background grid) and the overall visual matches the `screen.png` prototype
**Plans**: TBD
**UI hint**: yes

### Phase 4: SEO, Accessibility & Polish
**Goal**: The site is discoverable, shareable, and accessible — passing the baseline SEO/a11y checks a technical recruiter or search engine would expect.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, A11Y-02, A11Y-03, A11Y-04
**Success Criteria** (what must be TRUE):
  1. Every page has a unique `<title>`/meta description, and sharing the URL renders an Open Graph/Twitter Card preview image
  2. `sitemap.xml` and `robots.txt` are live and permit indexing; the browser tab shows a Cyber-Sophisticate-styled favicon
  3. Visiting a broken URL shows a custom 404 page reusing the same nav/layout
  4. All images and icons have descriptive alt text (not filenames)
  5. Lighthouse/axe report no contrast violations on the real rendered glassmorphism panels, with focus states remaining visible
**Plans**: TBD
**UI hint**: yes

### Phase 5: Security Hardening & Deploy
**Goal**: The live production site enforces the full security header set and is verified reachable over HTTPS with no known vulnerabilities.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: SEC-02, SEC-03, SEC-04, DEPLOY-01, DEPLOY-02
**Success Criteria** (what must be TRUE):
  1. The production URL responds with CSP (`default-src 'self'` or equivalent), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers, verified via `curl -I`/securityheaders.com against the live URL (not local dev/preview)
  2. `npm audit` reports no known vulnerabilities and no secrets/API keys exist in client-shipped code before deploy
  3. Site is published on Vercel and reachable via HTTPS at the production URL
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 0/3 | Planned | - |
| 2. Layout & Navigation Shell | 0/TBD | Not started | - |
| 3. Content Sections | 0/TBD | Not started | - |
| 4. SEO, Accessibility & Polish | 0/TBD | Not started | - |
| 5. Security Hardening & Deploy | 0/TBD | Not started | - |
</content>
