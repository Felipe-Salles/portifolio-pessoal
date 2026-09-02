# Feature Research

**Domain:** Personal developer portfolio website (static, Astro, single-page sections, PT-BR, no backend)
**Researched:** 2026-09-02
**Confidence:** HIGH (table stakes — well-established pattern, cross-verified) / MEDIUM (differentiators — trend-based, WebSearch verified)

## Feature Landscape

### Table Stakes (Users Expect These)

Features recruiters/visitors assume exist. Missing these makes the portfolio feel unfinished or untrustworthy — independent of how polished the visual design is.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero with clear identity + CTA | First 3–5 seconds decide if visitor stays; visitor must instantly know who you are and what you do | LOW | Already scoped in PROJECT.md (Hero section, prototype exists) |
| About/bio section ("Dossier") | Recruiters want a human behind the code — name, focus area, years/experience signal | LOW | Already scoped (Dossier + "System Specs" stats) |
| Tech stack listing | Recruiters scan for matching technologies before reading anything else | LOW | Already scoped, organized by category (Languages/Frameworks/Infra) |
| Projects with live + repo links | Portfolio without proof-of-work is just a resume with extra steps; broken/missing links actively hurt credibility | LOW–MED | Requires Content Collections; every card needs working `live` and/or `repo` link — a placeholder or dead link is worse than omitting the card |
| Working outbound links (no 404s, no dead social links) | A single broken link erodes trust in technical competence, which is the whole point of the site | LOW | Must be verified before each deploy; consider a link-check step in CI |
| Contact via direct links (email, GitHub, LinkedIn) | Recruiters need one-click paths to reach out; a contact form is friction they usually skip anyway | LOW | Already scoped as links-only per PROJECT.md decision |
| Mobile responsiveness | Majority of recruiter first-clicks (from LinkedIn/email on phone) are mobile | LOW–MED | Already required by PROJECT.md (mobile-first reflow per DESIGN.md) |
| Fast load / good Core Web Vitals | Recruiters bounce in seconds; slow sites signal poor engineering judgment — ironic for a dev portfolio | LOW (with Astro) | Astro ships zero JS by default; keep hero/project images optimized (`astro:assets`) |
| SEO meta tags (title, description) | Portfolio needs to rank for "[name] developer" and be scannable when shared | LOW | Per-page `<title>`/`<meta name="description">` via shared layout |
| Open Graph / Twitter Card social preview | When the portfolio link is shared on LinkedIn/WhatsApp/X, an ugly or missing preview looks unprofessional and gets fewer clicks | LOW–MED | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`; needs one static preview image (1200×630) since content/screenshots aren't final yet — can use a branded placeholder image following DESIGN.md palette |
| Favicon | Missing favicon is an instant "unfinished project" signal in browser tabs/bookmarks | LOW | Single `favicon.svg`/`.ico` in `public/`, following Cyber-Sophisticate palette |
| `sitemap.xml` | Baseline technical SEO; near-zero cost with Astro | LOW | `@astrojs/sitemap` integration — requires `site` field set in `astro.config.mjs` |
| `robots.txt` | Signals crawlers are welcome; trivial to add | LOW | Static file in `public/`, or `astro-robots-txt` integration |
| Accessible, semantic navigation | Keyboard/screen-reader users must be able to reach every section; also an SEO/quality signal recruiters at larger companies may actually check | LOW–MED | Use `<nav>`, `<main>`, proper heading hierarchy (`h1`→`h2`→`h3`), skip-to-content link, visible focus states — must not be sacrificed for the glassmorphism aesthetic |
| Descriptive alt text on images/icons | Accessibility + image SEO; project screenshots and tech icons need real alt text, not filenames | LOW | Cheap to do right from the start; expensive to retrofit across many cards |
| Custom 404 page | Broken/renamed links are inevitable; a generic host 404 breaks the crafted design experience | LOW | Simple Astro page reusing layout + nav |
| HTTPS | Zero trust signal without it in 2026 | NONE | Free via Vercel, already a PROJECT.md constraint |
| Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) | Not a typical "portfolio feature," but explicitly a differentiator/requirement for *this* project (target audience includes technical reviewers) | LOW–MED | Already a PROJECT.md constraint; configure via `vercel.json` headers |

### Differentiators (Competitive Advantage)

Not required, but meaningfully raise perceived quality or credibility. Choose a few that reinforce the "technical trust + fast + polished" Core Value — don't chase all of them.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Resume/CV download (PDF link) | Recruiters often want an ATS-parsable artifact they can save/forward, separate from the site itself | LOW | Static PDF in `public/`, linked from Hero or Contact; content (the actual CV) is deferred per PROJECT.md but the *feature slot* can ship now as a placeholder link |
| Subtle scroll/hover micro-interactions | Reinforces the "Cyber-Sophisticate" polish; signals front-end craft without needing a heavy JS framework | LOW–MED | Achievable with CSS transitions + a sprinkle of Astro `<script>`/View Transitions; avoid heavy animation libraries given the "simplicity by default" stack constraint |
| Astro View Transitions (page/section transitions) | Native to Astro, near-zero bundle cost, elevates perceived polish | LOW | `<ClientRouter />` (Astro's View Transitions) — worth doing since it's basically free within the chosen stack |
| Structured data (JSON-LD: `Person`, `WebSite`, `ItemList` for projects) | Improves how recruiters/search engines and AI crawlers represent the site (rich results, better "who is this person" answers) | LOW–MED | Pure markup addition in `<head>`; can ship with placeholder data now, refine when real content lands |
| GitHub contribution graph / repo stats widget | Visual, low-effort "proof of activity" that's popular in current dev portfolios | MED | Options: static image badge (e.g., github-readme-stats-style embed) vs. client-side fetch to GitHub API. Static/build-time fetch is preferable — avoids client JS and rate-limit/CORS issues; but adds a build-time dependency and slight staleness. Evaluate against "Astro islands only when needed" constraint before committing |
| Project case study pages (deeper per-project detail: problem, approach, stack, outcome) | Turns a card grid into evidence of thinking, not just a link list — the single highest-leverage differentiator for a hiring audience | MED | Natural extension of Content Collections already planned; each project MDX file gains a body; low incremental cost since the collection already exists, high payoff |
| Skill proficiency / experience-level indicators in Tech Stack | Helps recruiters quickly gauge depth vs. familiarity | LOW | Simple UI treatment (tags/bars) layered onto the already-planned 3-column stack section |
| Copy-to-clipboard on email/contact link | Small UX nicety, avoids opening a mail client unexpectedly | LOW | Trivial with a few lines of vanilla JS in an Astro island |
| Print-friendly stylesheet | Lets a recruiter "print to PDF" the About/Projects sections cleanly if no CV is downloaded | LOW | `@media print` CSS; low cost, rarely used but cheap insurance |
| Privacy-respecting analytics (e.g., Vercel Analytics, Plausible) | Lets the owner learn what recruiters actually look at, without cookie-consent overhead | LOW | Vercel Analytics integrates trivially with Vercel deploy already planned; no PII, no consent banner needed |

### Anti-Features (Commonly Requested, Often Problematic)

Given PROJECT.md already excludes a blog and a functional contact form, the anti-features below extend that same reasoning to adjacent temptations that tend to creep back in.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Functional contact form (backend email send) | "Feels more professional / lets me capture leads" | Requires a backend or third-party form service, secrets management, spam/anti-bot handling — directly contradicts the PROJECT.md decision to minimize attack surface and avoid a backend | Direct `mailto:`/social links (already decided) |
| Blog/technical articles section | "Good for SEO and shows expertise" | Turns a portfolio into a content-maintenance commitment (freshness, comments, RSS, more surface area); explicitly out of scope in PROJECT.md | If desired later, publish externally (Dev.to, Medium, LinkedIn) and link out from Contact/About instead of hosting it |
| Light/dark mode toggle | "Common pattern, seems accessible" | The approved DESIGN.md is a single, deliberately-crafted dark "Cyber-Sophisticate" theme (glassmorphism + cyan accents tuned for dark backgrounds); a toggle would require designing and maintaining a second full theme, which conflicts with the existing design contract | Ship the single approved dark theme; revisit as a v2 decision only if the design system is intentionally extended |
| i18n (PT/EN toggle) | "More reach for international recruiters" | Doubles content maintenance (every bio/project/CTA string) before any content is even finalized; PROJECT.md explicitly defers this | Ship PT-only per PROJECT.md; add an EN version later as a distinct milestone if needed |
| External CMS (Contentful, Sanity, etc.) | "Non-technical editing, familiar pattern" | Adds a hosted dependency, API keys, and network calls for a single-owner static site that already has a perfectly adequate local content model | Astro Content Collections (already decided) — Markdown/MDX edited directly in the repo |
| Live/dynamic GitHub API calls from the client on every page load | "Always up-to-date stats" | Introduces client-side JS, GitHub API rate limits, CORS/auth complexity, and a runtime dependency for a purely decorative widget — works against the "add JS islands only when necessary" stack philosophy | If GitHub stats are wanted, fetch at build time (SSG) or use a pre-rendered badge/image service |
| Third-party chat widgets / newsletter signup | "Increases engagement" | Adds render-blocking third-party scripts, tracking/privacy concerns, and no real payoff for a personal portfolio's actual goal (get recruiters to view real proof-of-work and reach out via existing links) | None needed — Contact section with direct links already covers the intent |
| Heavy animation/3D frameworks (e.g., Three.js hero scenes) | "Stands out visually" | Large JS payload, accessibility/performance risk, high build complexity relative to payoff, and directly conflicts with the "simplicity by default, complexity only when needed" Astro decision in PROJECT.md | Subtle CSS-based micro-interactions and Astro View Transitions deliver most of the perceived polish at a fraction of the cost |

## Feature Dependencies

```
Projects (Content Collections)
    └──requires──> Astro Content Collections schema (already decided)
                       └──enables──> Project case study pages (differentiator)
                       └──enables──> Structured data ItemList (differentiator)

Open Graph / social preview image
    └──requires──> at least one static branded image (1200x630) — can ship before real content exists

sitemap.xml
    └──requires──> `site` field set in astro.config.mjs
                       └──requires──> production domain decided (Vercel URL or custom domain)

Structured data (Person schema)
    └──enhanced-by──> real bio/name content (deferred per PROJECT.md — ship with placeholder-safe fields now)

Resume/CV download
    └──requires──> actual CV file (content, deferred) — feature slot (button/link) can ship now with placeholder

GitHub contribution/stats widget
    └──conflicts-with──> "Astro islands only when necessary" stack constraint if implemented as client-side fetch
    └──prefer──> build-time fetch or static badge instead

Security headers (CSP, HSTS, etc.)
    └──requires──> Vercel deploy configuration (vercel.json / astro adapter config)

Dark/light mode toggle
    └──conflicts-with──> approved single-theme DESIGN.md contract
```

### Dependency Notes

- **Projects requires Content Collections:** Already decided in PROJECT.md; every downstream project-related differentiator (case studies, structured data ItemList) builds on this same schema, so getting the collection shape right early avoids rework.
- **Open Graph image doesn't require final content:** Because real names/projects are deferred to the end of the project, the OG image should be a generic branded asset (logo/wordmark on the Cyber-Sophisticate background) rather than a screenshot — this unblocks shipping SEO table stakes immediately instead of waiting on final content.
- **sitemap.xml requires a decided production URL:** `@astrojs/sitemap` needs `site` in config; this should be settled once the Vercel project/domain exists, otherwise the sitemap silently fails to generate correctly.
- **GitHub stats conflicts with the "minimal JS" stack philosophy:** If pursued, prefer a build-time data fetch (Astro SSG loader) over a client-side API call, to stay consistent with the "islands only when necessary" principle already stated in PROJECT.md.
- **Dark/light toggle conflicts with the design contract:** DESIGN.md is described as a already-approved, non-negotiable contract; a mode toggle is a scope decision that belongs to a future milestone, not this one.

## MVP Definition

### Launch With (v1)

Matches PROJECT.md's Active requirements — this is the actual scope already agreed for this milestone.

- [ ] Hero section (identity + CTA) — core first impression, already scoped
- [ ] Dossier/About section with stats — establishes credibility, already scoped
- [ ] Tech Stack section (categorized) — recruiters scan this first, already scoped
- [ ] Projects section (cards, live/repo links) — proof of work, already scoped
- [ ] Contact section (direct links only) — conversion point, already scoped
- [ ] Mobile-responsive layout — majority of first-touch traffic, already scoped
- [ ] SEO meta tags + Open Graph/social preview — needed for the site to be shareable and discoverable from day one, cheap relative to payoff
- [ ] Favicon + sitemap.xml + robots.txt — near-zero cost, prevents "unfinished" signals and blocks nothing else
- [ ] Accessible semantic nav + custom 404 page — prevents broken/degraded experience for a subset of visitors and for link rot
- [ ] Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) — explicit PROJECT.md requirement, reinforces the "technical trust" Core Value
- [ ] Deployed on Vercel with HTTPS — already scoped

### Add After Validation (v1.x)

Add once the core site is live and real content (name, bio, real projects, real links) has landed.

- [ ] Resume/CV download — trigger: real CV content exists
- [ ] Project case study pages (expanded detail per project) — trigger: at least 2–3 real projects are documented and there's time to write case-study copy
- [ ] Structured data (JSON-LD Person/WebSite/ItemList) — trigger: real name/bio content exists (placeholder data isn't worth indexing)
- [ ] Astro View Transitions / subtle micro-interactions polish pass — trigger: core sections are stable and won't keep changing structurally
- [ ] Privacy-respecting analytics (Vercel Analytics) — trigger: site is live and owner wants usage data to prioritize further work

### Future Consideration (v2+)

Explicitly deferred; matches PROJECT.md's Out of Scope list plus adjacent items surfaced by this research.

- [ ] Blog/technical articles — deferred: PROJECT.md scope decision, adds ongoing content-maintenance burden
- [ ] Functional contact form with backend — deferred: PROJECT.md scope decision, contradicts minimal-attack-surface goal
- [ ] i18n (EN version) — deferred: PROJECT.md scope decision, doubles content maintenance
- [ ] Dark/light mode toggle — deferred: conflicts with current single-theme design contract; only reconsider if DESIGN.md itself is revisited
- [ ] GitHub contribution graph/stats widget — deferred: nice-to-have, but adds either client JS or build-time complexity that isn't justified until core content is real

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Hero, Dossier, Tech Stack, Projects, Contact sections | HIGH | LOW–MED | P1 |
| Mobile responsiveness | HIGH | LOW–MED | P1 |
| SEO meta tags + Open Graph image | HIGH | LOW | P1 |
| Favicon / sitemap / robots.txt | MEDIUM | LOW | P1 |
| Accessible nav + custom 404 | MEDIUM | LOW | P1 |
| Security headers | MEDIUM (HIGH for this project's stated Core Value) | LOW–MED | P1 |
| Resume/CV download | HIGH | LOW | P2 |
| Project case study pages | HIGH | MEDIUM | P2 |
| Structured data (JSON-LD) | MEDIUM | LOW–MED | P2 |
| View Transitions / micro-interactions | MEDIUM | LOW–MED | P2 |
| Privacy-respecting analytics | LOW–MEDIUM | LOW | P2 |
| GitHub stats widget | LOW–MEDIUM | MEDIUM | P3 |
| Skill proficiency indicators | LOW | LOW | P3 |
| Blog | MEDIUM (but explicitly excluded) | HIGH | Out of scope |
| Contact form (backend) | LOW (links already cover intent) | MEDIUM–HIGH | Out of scope |
| Dark/light toggle | LOW (design already fixed dark) | MEDIUM | Out of scope (v1) |
| i18n | LOW (v1 target is PT-only audience) | MEDIUM–HIGH | Out of scope (v1) |

**Priority key:**
- P1: Must have for launch (matches PROJECT.md Active requirements + baseline SEO/a11y hygiene)
- P2: Should have, add once real content exists
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Rather than named competitors, developer portfolios cluster into three recognizable archetypes. Comparing against these clarifies where this project's approach sits.

| Feature | Minimalist static portfolio (e.g., Brittany Chiang-style single-page) | Interactive/3D portfolio (e.g., Bruno Simon-style WebGL) | Template/builder portfolio (Framer/Webflow templates) | Our Approach |
|---------|---|---|---|---|
| Framework/JS weight | Near-zero JS, hand-built, fast | Heavy JS (Three.js/WebGL), slow initial load, high wow-factor | Varies, often JS-heavy from the builder's runtime | Astro, zero-JS-by-default, islands only when needed — closest to the minimalist archetype but with a distinct dark "Cyber-Sophisticate" visual identity |
| Content model | Hardcoded markup, manual edits | Hardcoded/scene-based | CMS-driven (builder's own CMS) | Astro Content Collections (Markdown/MDX) — structured but still fully local/version-controlled |
| Contact | Usually direct links (email/LinkedIn/GitHub) | Usually direct links | Sometimes a form (builder makes this trivial) | Direct links only — matches the minimalist archetype, deliberately rejects the form pattern |
| Blog | Sometimes present as a separate section | Rare | Common (builders make blogging trivial) | Explicitly excluded |
| SEO/OG setup | Often done well (developer-built, cares about it) | Often weak (heavy JS hurts crawlability/perf) | Usually built-in by the template/builder | Explicit requirement in this research — Astro's static output makes this cheap to do well |
| Differentiator focus | Craft/performance/typography | Visual spectacle/interactivity | Speed of setup/visual variety | Technical trust signals (security headers, performance, accessibility) + polished-but-restrained interaction — aligns with the project's stated Core Value of "passing confiança técnica" |

## Sources

- [Best Developer Portfolio Examples (2026) — DEV Community](https://dev.to/_d7eb1c1703182e3ce1782/best-developer-portfolio-examples-2026-2d8m) — MEDIUM confidence, trend/example roundup
- [21 Best Developer Portfolio Websites — Colorlib](https://colorlib.com/wp/developer-portfolios/) — MEDIUM confidence, example roundup
- [What to Include in a Developer Portfolio: 2026 Checklist — Showproof](https://showproof.io/guides/what-to-include-in-developer-portfolio/) — MEDIUM confidence
- [SEO Checklist for Developer Portfolios and Landing Pages — Shipixen](https://shipixen.com/blog/seo-checklist-for-developer-portfolios-and-landing-pages) — MEDIUM confidence, verified against general OG/schema knowledge
- [SEO for Developers: The Complete Guide (2026) — SEOAgent](https://seoagent.com/blog/seo-for-developers) — MEDIUM confidence
- [DEV Community — SEO tips for your developer portfolio](https://dev.to/rossellafer/seo-tips-for-your-developer-portfolio-26fm) — LOW–MEDIUM confidence, single-author blog
- [Astro SEO: A Developer's Implementation Guide (2026) — nadiamohamed.me](https://nadiamohamed.me/insights/astro-seo/) — MEDIUM confidence, cross-checked against Astro's known `@astrojs/sitemap` behavior
- [Astro SEO Guide 2026: Technical Checklist — nodeascend](https://nodeascend.com/blog/astro-js-seo-guide-2026/) — MEDIUM confidence
- [Junior Dev Resume & Portfolio in the Age of AI: What Recruiters Care About in 2026 — DEV Community](https://dev.to/dhruvjoshi9/junior-dev-resume-portfolio-in-the-age-of-ai-what-recruiters-care-about-in-2025-26c7) — MEDIUM confidence
- `.planning/PROJECT.md` — HIGH confidence, primary source for confirmed scope and constraints

---
*Feature research for: Personal developer portfolio website (Astro, PT-BR, static)*
*Researched: 2026-09-02*
