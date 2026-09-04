# Phase 5: Security Hardening & Deploy - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The site goes live on Vercel over HTTPS and the production URL enforces the full security header set (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), verified against the real deployed URL — not `astro dev`/`astro preview`. This phase also confirms no known dependency vulnerabilities (`npm audit`) and no secrets/API keys in client-shipped code before that deploy happens. This phase does NOT touch content, layout, SEO/a11y markup, or design (Phases 1–4, already complete) — it only adds the adapter/header/deploy layer on top of the site those phases already built.

Covers requirements SEC-02, SEC-03, SEC-04, DEPLOY-01, DEPLOY-02.

</domain>

<decisions>
## Implementation Decisions

### Production Domain (DEPLOY-01)
- **D-01:** Ship v1 on the default Vercel-assigned subdomain (e.g. `portifolio-pessoal.vercel.app`) — no custom domain purchased/pointed yet. `astro.config.mjs`'s `site:` field (currently the RFC 2606 placeholder `.example` domain per the Phase 1–4 `TODO(Phase 5)` markers in `astro.config.mjs`, `scripts/generate-og-image.mjs`, `scripts/verify-seo.mjs`) gets updated to the real `*.vercel.app` URL once the Vercel project is created and the assigned subdomain is known. A custom domain can be added later without any code rework — this only touches the `site:` config value and DNS, nothing structural.

### Deploy Workflow
- **D-02:** Connect the repo to GitHub and use Vercel's Git integration for continuous deployment (push to `main` → automatic production deploy; PRs/branches → preview deployments) — not a one-off manual `vercel deploy --prod` from the CLI. **Note for planner/executor:** `git remote -v` currently returns nothing — there is no GitHub remote configured yet. Creating/connecting that GitHub repo is a prerequisite step this phase's plan must include before the Vercel project can be linked to it.

### HSTS (SEC-03)
- **D-03:** Standard HSTS — `max-age` + `includeSubDomains`, **without** the `preload` directive. Preload is a submission to browser vendors' hardcoded list that's slow/hard to reverse and assumes a stable, final domain — premature while still on a placeholder `*.vercel.app` subdomain (D-01) and pre-real-content. Revisit preload once a custom domain (if any) is finalized.

### CSP Rollout (SEC-02)
- **D-04:** Ship the Content-Security-Policy as a real enforcing header (`Content-Security-Policy`) from the start — not `Content-Security-Policy-Report-Only` as an interim step. Rationale: the site has been verified self-hosted-only since Phase 1 (SEC-01, enforced by `scripts/verify-no-external-origins.mjs` on every build), so the risk of the enforced policy breaking something in production is low, and `Nav.astro`'s mobile-toggle inline script was already written Phase 2 with `script-src 'self'` compatibility in mind (see `src/components/Nav.astro` L129-130 comment). A Report-Only trial period would add a step without a real payoff here.

### Claude's Discretion
- Exact CSP directive list beyond `default-src 'self'` (e.g. `script-src`, `style-src`, `img-src`, `font-src`, `frame-ancestors`, `object-src`, `base-uri`) — technical detail for research/planning, informed by what Phase 1–4 actually ship (self-hosted fonts/icons/scripts, no external origins).
- Whether CSP is emitted via Astro's built-in CSP API (auto-hashing inline scripts) or manually authored in `vercel.json` — implementation mechanism, not a user-facing choice. Per CLAUDE.md, `@astrojs/vercel` + `staticHeaders: true` is required regardless (meta-tag-only CSP can't express `frame-ancestors`/X-Frame-Options/HSTS/Referrer-Policy/Permissions-Policy for a static site).
- Permissions-Policy specific feature list (camera/microphone/geolocation/etc.) — standard deny-all posture for a portfolio site with zero use of those APIs; no gray area to raise.
- `npm audit` remediation approach if vulnerabilities are found (update vs. override vs. accept-and-document) — handled per finding at execution time, not a decision to lock now.
- Exact GitHub repo name/visibility (public vs. private) when creating the remote for D-02 — no strong preference surfaced; default to whatever the user's existing GitHub convention is, confirm at execution time if ambiguous.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level security & stack contract
- `CLAUDE.md` — "Security Headers & CSP — specific guidance" section, the `@astrojs/vercel` + `staticHeaders: true` requirement and rationale (meta-tag CSP can't express `frame-ancestors`/set X-Frame-Options/HSTS/Referrer-Policy/Permissions-Policy), Vercel CLI note that `astro preview` does NOT simulate Vercel's header layer (must use `vercel build && vercel deploy --prebuilt` or `vercel dev` to verify headers locally before relying on production).
- `.planning/PROJECT.md` — Constraints section: "Segurança: ... no mínimo security headers bem configurados (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) e boas práticas gerais (sem segredos no client, dependências auditadas)".
- `.planning/REQUIREMENTS.md` — SEC-02, SEC-03, SEC-04, DEPLOY-01, DEPLOY-02 definitions.
- `.planning/ROADMAP.md` §"Phase 5" — Success Criteria (curl -I / securityheaders.com verification against the live URL, `npm audit` clean, site reachable via HTTPS at the production URL).

### Phase 1–4 outputs this phase builds directly on top of
- `astro.config.mjs` — currently `output: "static"` with no adapter and a placeholder `.example` `site:` value; has an explicit `TODO(Phase 5)` comment marking where the real domain (D-01) and (implicitly) the `@astrojs/vercel` adapter + `staticHeaders: true` config need to land.
- `scripts/generate-og-image.mjs` and `scripts/verify-seo.mjs` — both explicitly reference "Phase 5 domain swap" as the trigger that updates their behavior; `verify-seo.mjs` reads the expected origin live from `astro.config.mjs`'s `site:` value (no hardcoded second copy), so updating `site:` per D-01 is the only change needed for both to pick up the real domain.
- `src/components/Nav.astro` (L129-130) — mobile-nav-toggle inline script comment already anticipates `script-src 'self'` CSP compatibility; confirms D-04's low-risk assessment for enforcing CSP immediately.
- `scripts/verify-no-external-origins.mjs` (SEC-01, Phase 1) — the existing build-gate script that already proves no external script/font/icon origins exist; this phase's CSP work is the natural extension of that same discipline into a real HTTP header.
- `scripts/verify-*.mjs` pattern generally (`verify-tokens`, `verify-shell`, `verify-sections`, `verify-schema`, `verify-seo`, `verify-a11y`) — established pattern this phase's own gate (deployed-header verification, `npm audit` check) should follow, wired into `npm run verify`.
- `package.json` — current `dependencies`/`devDependencies` (no `@astrojs/vercel` yet); `scripts.verify` chain this phase's new gate(s) should extend.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/verify-no-external-origins.mjs` — proves the self-hosted-only claim that D-04's "enforce CSP immediately" decision leans on.
- Existing `scripts/verify-*.mjs` + `npm run verify` chain — template for wiring a new deployed-security-header verification step and an `npm audit` gate.

### Established Patterns
- Deterministic build-time verification gates for every phase's core requirements (Phases 1-4 precedent) — extends here to production header verification and dependency audit.
- Placeholder-content convention (`.example` domain, bracketed site.ts fields) — the `site:` config placeholder follows the same "obviously fake until real" discipline; D-01 replaces it with the real (if still provisional) `*.vercel.app` URL, not another placeholder.

### Integration Points
- `astro.config.mjs` gains: `@astrojs/vercel` adapter import + config, `staticHeaders: true`, updated `site:` value (D-01).
- New `vercel.json` at repo root — CSP + HSTS + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy headers (bridged from `staticHeaders: true` output plus/or hand-authored per CLAUDE.md guidance).
- New GitHub remote + Vercel project Git integration (D-02) — infrastructure step with no code footprint beyond `git remote add`/push and Vercel dashboard/CLI project linking.
- `package.json` `scripts.verify` — likely gains an `npm audit` step and/or a live-header-check script (`verify:deploy` or similar) per DEPLOY-02's "verified against production, not local" requirement.

</code_context>

<specifics>
## Specific Ideas

- Default Vercel subdomain for v1, custom domain deferred — user's explicit choice (D-01)
- GitHub-connected continuous deployment over manual CLI deploys — user's explicit choice (D-02); repo has no GitHub remote yet, this is a prerequisite setup step
- Standard HSTS without `preload` — user's explicit choice (D-03)
- CSP enforced from the start, no Report-Only trial period — user's explicit choice (D-04)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Custom domain and HSTS `preload` were both explicitly considered and deferred to a future pass once the domain is finalized (see D-01, D-03) — not new-capability ideas, just sequencing calls within this same phase's concerns.

</deferred>

---

*Phase: 5-Security Hardening & Deploy*
*Context gathered: 2026-09-03*
