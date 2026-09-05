# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-09-05
**Phases:** 5 | **Plans:** 18 | **Sessions:** ~3 days of work (2026-09-02 → 2026-09-05)

### What Was Built
- Astro 7 + Tailwind v4 static site, zero external script/font/icon origins, self-hosted fonts and inline-SVG icons
- Full design-token fidelity (colors, typography, spacing, radius) gated against drift from DESIGN.md
- Complete site shell (Nav, Footer, layout) and all 5 core content sections (Hero, Dossier, Tech Stack, Projects, Contact) driven by Astro Content Collections
- SEO baseline (title/meta/OG/Twitter/sitemap/robots/favicon), custom 404, WCAG-checked accessibility (real-browser axe scan + pixel-sampled contrast)
- Live production deploy on Vercel: 6 security headers (CSP with build-time hash-pinning, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), continuous deployment via GitHub Git integration, 0 npm audit vulnerabilities, human sign-off with an A grade on securityheaders.com

### What Worked
- Writing the RED (failing) gate before the fix existed (`verify-deploy-headers.mjs` before the site was deployed) caught the CSP header delivery mechanism working correctly on the very first real deploy — zero remediation-ladder rungs needed.
- A real-browser Playwright gate (`verify-live-csp.mjs`) caught a genuine production bug (base64-inlined font CSP violation) on its very first run against the live site — something no header-presence check could have found.
- Independent live re-verification during the milestone audit (rather than trusting each phase's own VERIFICATION.md at face value) found two real, confirmed defects that three phases' worth of automated gates and one recorded-as-"confirmed" human checkpoint had missed.

### What Was Inefficient
- A subagent executor repeatedly backgrounded `npm install` and then ended its turn to "wait" for it — which doesn't actually block — causing the same install to appear stalled three times in a row before the orchestrator diagnosed the real cause (the install was genuinely still running, just slow on Windows) and told it to run in the foreground instead.
- `REQUIREMENTS.md` checkbox tracking drifted from actual implementation status twice in this milestone (SEO-06 after Phase 2, then SEO-01..05/A11Y-02..04 after Phase 4) — each caught only by a later phase's own verifier noting the discrepancy as a "documentation lag," never auto-corrected at the time.
- A Phase 2 human-verification item (footer social-link row overflow on mobile) was flagged as `human_needed` in that phase's own VERIFICATION.md, but the actual human check never happened and the defect shipped through Phases 3, 4, and 5 unnoticed until the milestone audit's live re-test caught it.

### Patterns Established
- Live-URL-only gates (`verify:deploy`, `verify:live-csp`) are deliberately excluded from the build-time composite `verify` chain (they need a real deployed URL argument) but are run explicitly at the relevant checkpoints — a pattern worth reusing for any future live-environment-only checks.
- `astro-icon` inline SVG + a CSS attribute-selector icon-swap (`data-nav-icon="menu"`/`"close"` + `data-menu-open` state) kept the mobile nav's icon toggle entirely CSP-`script-src`-compatible with zero runtime icon-font requests.

### Key Lessons
1. A recorded "human confirmed" checkpoint result is not automatically still true after later phases touch adjacent code — the milestone audit's independent live re-test is what actually caught the Nav-routing regression this time, not the phase-level checkpoint that claimed it worked.
2. `human_needed`/`partial` verification statuses need an explicit close-out step before a milestone ships — without one, they silently ride along as unresolved debt across every subsequent phase.
3. Automated a11y scanning (axe-core) does not check for viewport-relative overflow/clipping of focusable elements — a distinct gate is needed if this class of defect matters (a candidate for a future phase: assert every interactive element's bounding box stays within a phone-width viewport).
4. When a subagent reports it is "waiting" for a background process, verify directly on disk/via the process list before trusting the claim — in this session the install was actually progressing normally, but the agent's own model of "waiting" wasn't actually blocking its turn.

### Cost Observations
- Model mix: 100% Sonnet (executor, verifier, code-reviewer, integration-checker all ran on the configured `balanced`/`sonnet` profile)
- Sessions: 1 continuous session covering Phase 5 execution through v1.0 milestone close
- Notable: the two milestone-audit-discovered fixes (Nav href + footer flex-wrap) were each single-file, few-line changes — fixed inline in under 30 minutes total including live redeploy and re-verification, versus the overhead a full gap-closure phase cycle would have added for defects this small.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 5 | First milestone — established the verify-gate-per-requirement pattern and the RED-before-GREEN live-deploy gate discipline |

### Cumulative Quality

| Milestone | Gates | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 9 build-time + 2 live-only | 30/30 v1 requirements satisfied | 0 (Playwright/axe-core already present, no new runtime deps added for verification) |

### Top Lessons (Verified Across Milestones)

1. A recorded human-checkpoint "confirmed" result should be spot-checked again at milestone close, not assumed durable across later phases' changes.
