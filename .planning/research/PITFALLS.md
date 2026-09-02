# Pitfalls Research

**Domain:** Developer portfolio site — Astro static site, deployed on Vercel, with explicit security-hardening requirement (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) and a dark/glassmorphism design system
**Researched:** 2026-09-02
**Confidence:** MEDIUM-HIGH (Astro/Vercel mechanics verified against official docs; CSP hash behavior and header defaults confirmed via official sources; some best-practice claims are WebSearch-verified, not Context7-verified)

## Critical Pitfalls

### Pitfall 1: Tailwind loaded via CDN `<script>` in production (current prototype does this)

**What goes wrong:**
The existing prototype (`Arquivos de design/code.html`) loads Tailwind via `<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries">` and configures it with an inline `<script id="tailwind-config">` block. If this pattern is carried into the Astro build, the browser downloads the full Tailwind JIT engine and re-compiles CSS on every page load, ships unpurged/oversized CSS, is explicitly flagged by Tailwind itself as "should not be used in production," and — critically for this project — requires `script-src 'unsafe-eval'` (or at minimum `'unsafe-inline'`) in the CSP because the CDN build runtime-generates and injects `<style>` tags via JS. That directly conflicts with the project's stated goal of "security headers bem configurados."

**Why it happens:**
The prototype was built quickly as an HTML mockup where the CDN script is the fastest way to preview the design system. Developers moving a prototype into a real build often copy the `<head>` verbatim without swapping to a build-time integration.

**How to avoid:**
- Do not carry the `<script src="cdn.tailwindcss.com">` tag into the Astro project.
- Install Tailwind as a build-time dependency: for Tailwind v4, use `@tailwindcss/vite` (Vite plugin, no PostCSS config needed) added to `astro.config.mjs`; for v3, use the `@astrojs/tailwind` integration. Either way, CSS is generated at build time and shipped as a static, purged stylesheet with no runtime JS or `eval`.
- Re-create the prototype's `tailwind.config` (custom color tokens, dark mode class strategy) as a proper `tailwind.config.mjs`/`@theme` block instead of an inline `<script>` tag.

**Warning signs:**
- Any `<script src="cdn.tailwindcss.com">` in `src/layouts/*.astro` or `public/*.html`.
- Console warning "cdn.tailwindcss.com should not be used in production."
- CSP requiring `unsafe-eval` or `unsafe-inline` in `script-src` with no other justification.
- Full page CSS payload noticeably larger than expected for the used utility classes (Tailwind CDN ships far more than what's used).

**Phase to address:**
Project setup / build configuration phase (first phase touching styling) — this is a foundational build-tooling decision, not a later polish item. Must be resolved before any UI component work begins so components aren't later re-wired.

---

### Pitfall 2: Security headers assumed to be automatic on Vercel, or configured incompletely

**What goes wrong:**
Vercel automatically applies `Strict-Transport-Security` (HSTS) to all deployments (`max-age=63072000` for custom domains, plus `includeSubDomains; preload` on `*.vercel.app`), which creates a false sense that "security headers are handled by Vercel." In reality, Vercel does **not** automatically add CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` — these must be explicitly configured, typically via a `headers` array in `vercel.json` (or Astro's `experimentalStaticHeaders`/`security.csp` config for static output, though CSP support for purely static builds is still evolving). A common failure mode: headers are added but only match specific paths (e.g., `/` only) and don't apply to all routes/assets, or they're added in `astro.config.mjs` under an experimental flag that silently no-ops in static output mode.

**Why it happens:**
Developers conflate "Vercel gives me HTTPS" with "Vercel gives me security headers." Astro's own CSP support is still experimental (introduced ~5.9) and behaves differently for static vs. server output, so a header set that works in a local SSR test may not appear at all in the deployed static build.

**How to avoid:**
- Do not rely on framework defaults. Explicitly define a `headers` block in `vercel.json` with a `source: "/(.*)"` glob so headers apply to every route, not just the homepage.
- Minimum header set for this project: `Content-Security-Policy`, `Strict-Transport-Security` (Vercel's default is fine, but can be made explicit), `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in CSP, which supersedes it in modern browsers — keep both for legacy browser coverage), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (deny unused APIs like camera, microphone, geolocation since this site needs none of them).
- Verify post-deploy with an external header scanner (e.g., securityheaders.com or `curl -I` against the production URL), not just local dev — Vercel's edge and Astro's static adapter can both alter headers between environments.

**Warning signs:**
- `vercel.json` absent or has no `headers` key.
- Headers present in `astro.config.mjs` but project outputs `static` (not `server`) — experimental CSP/header features may require SSR/adapter support to actually emit at the HTTP layer rather than a `<meta>` tag.
- Headers verified only via local `astro preview`, never against the live Vercel URL.

**Phase to address:**
A dedicated "security hardening / headers" phase near the end of the build (after content/components are stable, since CSP hash values depend on final inline script/style content) but before final launch — with a follow-up verification step in the deploy phase.

---

### Pitfall 3: CSP breaks silently against inline styles, Astro islands, and third-party fonts

**What goes wrong:**
A strict CSP (`script-src 'self'; style-src 'self'`) will silently block: (a) any inline `<style>` or `style=""` attribute Astro/component libraries generate, (b) client-side framework islands (`client:load`, `client:visible`) which inject inline scripts/styles at runtime, and (c) Google Fonts / Material Symbols `<link>` tags from `fonts.googleapis.com` and `fonts.gstatic.com`, which are used in the current prototype. The failure is silent — no error thrown to the user, just missing fonts (fallback to system font) or broken component styling, which is easy to miss in casual testing but obvious once a recruiter opens dev tools console (CSP violations log there).

**Why it happens:**
CSP is written once, early, based on generic examples, without accounting for the actual inline styles Astro's compiler emits (Astro auto-generates scoped `<style>` blocks per component) or the exact external origins the design actually uses.

**How to avoid:**
- Prefer self-hosting fonts over Google Fonts `<link>` tags: use `@fontsource` packages (e.g., `@fontsource/inter`, `@fontsource/jetbrains-mono`) bundled at build time. This eliminates the `fonts.googleapis.com`/`fonts.gstatic.com` CSP exceptions entirely, removes a third-party network request (privacy + performance win), and avoids the render-blocking `@import` from Google's CSS.
- Prefer an inline SVG icon set or a bundled icon font/package over Google's Material Symbols web font loaded via `<link>` — same rationale.
- If external font origins are kept, CSP must explicitly allow `style-src 'self' https://fonts.googleapis.com` and `font-src 'self' https://fonts.gstatic.com`.
- Use Astro's built-in CSP support (`security.csp` / hash-based `<meta>` generation in Astro 5.9+) so hashes for Astro's own scoped inline styles are computed automatically at build time instead of hand-maintained — but verify it actually emits for the static output mode being used, and test the final build (not dev server) since dev-mode style injection differs from production.
- Keep interactive islands (`client:*` directives) minimal (aligns with the project's own stated goal of using Astro's "islands only when necessary") — every unnecessary island is another spot the CSP has to accommodate a hydration script.

**Warning signs:**
- Browser console CSP violation errors (`Refused to apply inline style because it violates the following Content Security Policy directive`).
- Fonts rendering as browser default/fallback (Times New Roman / Arial) in production despite look correct in local dev.
- Material Symbols/icons rendering as literal text (e.g., "search" word) instead of icon glyphs — the classic symptom of a blocked icon font.

**Phase to address:**
Same "security hardening" phase as Pitfall 2, but must happen *after* the design system/styling phase is functionally complete — CSP hashes and font choices depend on final component structure. Flag as a phase likely needing focused research on Astro's evolving CSP feature (experimental, changes across versions).

---

### Pitfall 4: Accidentally exposing secrets or over-scoping `PUBLIC_` env vars

**What goes wrong:**
Astro only exposes environment variables prefixed `PUBLIC_` to client-side code; anything else stays server-only. The common mistakes are: (a) prefixing something sensitive with `PUBLIC_` "to make it work" when a build/import error suggests the variable isn't available, permanently baking it into the shipped JS bundle; (b) hardcoding real values (API keys, analytics IDs, contact form endpoints) directly in `.astro`/`.ts` source instead of env vars, so they end up in git history; (c) for a static/no-backend site like this one (contact via direct links only, no form/backend per the project's own scope decision), assuming "there's nothing to leak" and then later adding a client-side integration (e.g., an analytics or forms-as-a-service script) with an embedded key without reconsidering exposure.

**Why it happens:**
Astro's env var system is easy to misunderstand at a glance — the `PUBLIC_` convention is opt-in exposure, and developers used to server frameworks (where all env vars are private by default) sometimes assume all vars are safe unless proven otherwise.

**How to avoid:**
- Since this project has no backend and no contact form (explicit scope decision), there should be very few, if any, real secrets — keep it that way. Resist adding server-side integrations that require secret API keys unless truly needed.
- Any future third-party client-side integration (analytics, forms-as-a-service) should use keys explicitly designed to be public (e.g., a public/site-scoped analytics ID, not an account-level secret).
- Never commit `.env` — add to `.gitignore` from project start; use `.env.example` with placeholder names only.
- Run a final grep for common secret patterns (`API_KEY`, `SECRET`, `TOKEN`) across `src/` and the built `dist/` output before each deploy as a sanity check.

**Warning signs:**
- Any variable name containing `SECRET`, `KEY`, or `TOKEN` prefixed with `PUBLIC_`.
- `.env` present in `git status` as tracked (not ignored).
- Build output (`dist/`) contains a recognizable API key format when grepped.

**Phase to address:**
Project setup phase (establish `.gitignore`, env var conventions) with a recurring check at the deploy/hardening phase.

---

### Pitfall 5: Outdated or vulnerable dependencies shipped silently

**What goes wrong:**
A greenfield project starts with fresh dependencies, but by the time it's actually built and deployed (weeks later, or if development pauses), `astro`, the Vercel adapter, and any UI/icon libraries may have known CVEs or breaking changes. Because this is a static portfolio with infrequent updates after launch, it's also the type of project that gets set up once and never touched again — meaning any vulnerability present at launch persists indefinitely unless there's an explicit process to catch it.

**Why it happens:**
Static/personal sites are perceived as "low risk" so dependency maintenance is deprioritized, but the project's own stated requirement is "dependências auditadas" (audited dependencies) — this needs an explicit, not implicit, process.

**How to avoid:**
- Run `npm audit` (or `pnpm audit`/`yarn audit` matching the chosen package manager) before every deploy, and treat any `high`/`critical` finding as a blocker.
- Pin dependency versions via the lockfile (commit `package-lock.json`/`pnpm-lock.yaml`) so builds are reproducible and audits are meaningful.
- Enable Dependabot (free on GitHub for public/private repos) or Renovate for automated PRs on vulnerable/outdated packages, even for a low-churn personal site — it costs nothing to configure and catches issues without ongoing manual effort.
- Avoid adding unnecessary dependencies for simple UI needs (e.g., don't pull in a heavy icon library if a handful of inline SVGs cover the design's icon set) — smaller dependency surface = smaller audit surface.

**Warning signs:**
- No `package-lock.json`/equivalent committed.
- `npm audit` never run, or run once at project start and never again before deploy.
- No Dependabot/Renovate config (`.github/dependabot.yml`) present.

**Phase to address:**
Project setup phase (lockfile + audit habit established) and deploy/hardening phase (final audit gate before each release).

---

### Pitfall 6: SEO/meta basics missing or copy-pasted incorrectly from the prototype

**What goes wrong:**
The current prototype HTML has `<html lang="en">` despite the project being explicitly PT-BR only — if carried forward verbatim, this creates an accessibility (screen readers mispronounce content) and SEO (search engines may index/target the wrong locale) mismatch on day one. More broadly, portfolio sites frequently ship without: a `sitemap.xml`, `robots.txt`, Open Graph/Twitter Card meta tags (so shared links on LinkedIn/Twitter show no preview image or generic text), a `<meta name="description">`, a canonical URL, or a favicon — all invisible in casual browser testing but immediately obvious to a recruiter sharing the link or checking "does this person know SEO basics."

**Why it happens:**
SEO/meta tags don't affect how the site *looks* while building it, so they're easy to defer indefinitely and then forget entirely, especially for a project with a single page/limited routes where "it obviously loads fine" masks the gap.

**How to avoid:**
- Fix `lang="pt-BR"` on the root `<html>` element immediately when porting the prototype markup — do not copy the prototype's `lang="en"`.
- Add `@astrojs/sitemap` integration (auto-generates `sitemap.xml` at build time) and a `robots.txt` in `public/` pointing to it.
- Build a single reusable `<SEO>`/`BaseHead.astro` component (or use the `astro-seo` community package) that centralizes title, description, canonical URL, Open Graph, and Twitter Card tags — apply it to every page from day one so it's never "added later."
- Include a real Open Graph image (not a generic placeholder) sized correctly (1200x630) so link previews on LinkedIn/GitHub/Twitter look intentional — high-value for a portfolio meant to be shared with recruiters.
- Add a proper favicon set (not just the Vite/Astro default rocket icon left in place, a classic "looks unfinished" tell).

**Warning signs:**
- `<html lang="en">` while all visible content is Portuguese.
- View-source shows no `<meta property="og:*">` tags.
- Sharing the deployed URL in Slack/LinkedIn shows no preview image or shows a generic Astro/Vercel placeholder.
- Favicon is still the default Astro rocket ship icon.
- No `sitemap.xml` reachable at `/sitemap-index.xml` or similar.

**Phase to address:**
Content/components phase for the `<SEO>` component pattern (build it once, apply everywhere), with a final verification pass in the polish/pre-launch phase (favicon, OG image, lang attribute, sitemap reachability).

---

### Pitfall 7: Glassmorphism + dark UI contrast failures (WCAG)

**What goes wrong:**
The design system's `.glass-panel` (semi-transparent dark background, `rgba(20, 27, 34, 0.6)`, with `backdrop-filter: blur`) and cyan-accent text/borders on a near-black background are visually striking but structurally prone to WCAG contrast failures: translucent panels mean the *effective* contrast of text depends on whatever content sits behind the glass (varies by scroll position, background glow position, etc.), and low-opacity secondary text colors (like the prototype's `on-surface-variant: #b9cacb`) that look fine against pure black can drop below the 4.5:1 (normal text) / 3:1 (large text, UI components) WCAG AA thresholds once layered over a blurred, lighter glow gradient. Focus indicators on interactive glass elements (buttons, nav links) are also easy to lose visually against a translucent, low-contrast border.

**Why it happens:**
Contrast is checked once against a flat background swatch (e.g., in a design tool) but never re-verified against the actual rendered glass panel with blur and glow layers behind it, where the composite color differs from the flat swatch.

**How to avoid:**
- Test actual rendered contrast (not the design token's nominal color) using a browser-based contrast checker (e.g., axe DevTools, Chrome Lighthouse accessibility audit, or WebAIM's contrast checker against a screenshot) on the real glass panels with their glow backgrounds, not the DESIGN.md color swatch in isolation.
- Slightly increase glass panel background opacity or add a subtle darker inner shadow behind body text specifically (not just the panel) to guarantee a stable contrast floor regardless of what's blurred behind it.
- Ensure all interactive elements (nav links, buttons, cards) have a visible, high-contrast focus state (the cyan glow border pattern already in the design, e.g. `.border-glow-cyan`, is a good candidate — just make sure it's applied on `:focus-visible`, not only `:hover`).
- Run an automated accessibility check (Lighthouse or axe) against every built page before launch as a standing gate, not a one-time check.

**Warning signs:**
- Lighthouse Accessibility score below ~90 with contrast-specific warnings.
- Secondary/muted text (captions, metadata) that's hard to read against certain background regions but fine against others.
- Buttons/links with no visible state change on keyboard `Tab` focus.

**Phase to address:**
Design system / styling implementation phase (build the contrast-safe tokens in from the start) with a verification checkpoint before launch.

---

### Pitfall 8: Images served unoptimized from `public/` instead of using Astro's Image pipeline

**What goes wrong:**
Astro's `public/` folder is served as-is with zero processing — no resizing, no format conversion (WebP/AVIF), no lazy loading, no automatic `width`/`height` (which prevents Cumulative Layout Shift). A portfolio with project screenshots/thumbnails is exactly the kind of site where this matters: if screenshots are dropped into `public/images/` and referenced with plain `<img src="/images/foo.png">`, the site ships full-resolution PNGs/JPEGs, hurting both Core Web Vitals (LCP, CLS) and the "loading rápido" requirement explicitly stated in the project's Core Value.

**Why it happens:**
`public/` is the obvious, path-simplest place to drop images during rapid prototyping, and it "just works" visually, so the performance cost is invisible without running Lighthouse/PageSpeed.

**How to avoid:**
- Store project screenshots and other local raster images in `src/assets/` (or `src/images/`) and reference them through Astro's `<Image>` / `<Picture>` components from `astro:assets`, which auto-optimizes to WebP/AVIF, infers `width`/`height` from the source file to prevent CLS, and lazy-loads by default.
- Reserve `public/` only for files that genuinely must be served byte-for-byte unprocessed (favicon variants, `robots.txt`, `sitemap.xml`, any file referenced by exact fixed path from outside the app).
- On Vercel, enabling the adapter's `imageService` option additionally allows on-demand image optimization at the edge — useful if remote/CMS images are ever introduced, though for this project's local Content Collections + local screenshots, build-time `astro:assets` optimization is likely sufficient on its own.
- If any image must stay in `public/` for a valid reason, manually specify `width`/`height` on the `<Image>`/`<img>` tag (required for unanalyzable public images) to still avoid CLS.

**Warning signs:**
- `public/` folder contains multi-megabyte PNG/JPEG project screenshots.
- Plain `<img>` tags (not `astro:assets` `<Image>`) used for local project images.
- Lighthouse flags "Serve images in next-gen formats" or "Properly size images" or reports non-zero CLS from image elements.

**Phase to address:**
Content/projects section phase (where project screenshots are first added) — establish the `astro:assets` pattern before the first project card is built so it isn't retrofitted across every image later.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Keep Tailwind CDN script from prototype "just to move fast" | Zero build config, instant visual parity with mockup | Blocks CSP hardening, ships bloated CSS, contradicts stated security requirement | Never for the actual project — acceptable only for throwaway visual spikes never deployed |
| Skip `<SEO>`/`BaseHead` component, hardcode meta tags per page | Faster to start building | Meta tags drift inconsistently across pages, easy to forget on new pages | Never — build it once at the start, it's cheap |
| Leave images in `public/` with plain `<img>` during early layout work | Faster iteration while design is unstable | Retrofitting every image reference to `astro:assets` later, unnoticed perf regression | Acceptable briefly during pure layout/wireframe spikes, must be fixed before content phase ends |
| Defer security headers until "right before launch" | Faster early iteration, no CSP debugging mid-build | CSP violations discovered late are harder to diagnose (component structure already finalized, must retrofit hashes) | Acceptable to defer *exact* CSP tuning, but headers file/skeleton should exist from early on |
| Use Google Fonts `<link>` instead of self-hosting via `@fontsource` | Zero setup, matches prototype exactly | Extra external CSP exceptions, third-party request, minor privacy/perf cost | Acceptable if the security/perf tradeoff is consciously accepted; better to self-host given stated priorities |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Vercel deploy | Assuming Vercel auto-adds CSP/`X-Frame-Options`/`Referrer-Policy`/`Permissions-Policy` because it auto-adds HSTS | Explicitly define all non-HSTS headers in `vercel.json` `headers` array with a catch-all `source` glob |
| Google Fonts (`fonts.googleapis.com`) | Loading via `<link>` without CSP allowances, or without `preconnect`, causing render-blocking or CSP violations | Self-host via `@fontsource/*` packages to avoid the issue entirely, or explicitly allow both `fonts.googleapis.com` (style-src) and `fonts.gstatic.com` (font-src) in CSP if kept external |
| Astro Vercel adapter (`@astrojs/vercel`) | Using the default zero-config static deploy but then trying to set headers only in `astro.config.mjs` experimental CSP flags, which may not emit real HTTP headers for pure static output | Use `vercel.json` as the source of truth for HTTP response headers on a static Astro site; treat Astro's native CSP feature as supplementary/experimental, verify it actually appears in deployed response headers |
| `@astrojs/sitemap` | Forgetting to set the `site` field in `astro.config.mjs`, which the sitemap and canonical URL generation depend on | Set `site: "https://yourdomain.com"` in Astro config from project start, not right before launch |
| Astro Content Collections | Defining a schema that doesn't validate optional fields (e.g., live/repo links that may not exist for a given project), causing build failures when placeholder content is swapped for real content | Model `liveUrl`/`repoUrl` as optional in the Zod schema from the start, since the project explicitly plans to add real links later |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Tailwind CDN runtime compilation | Slow First Contentful Paint, large unstyled flash before JIT compiles | Build-time Tailwind via Vite plugin/integration | Immediately, even at zero traffic — it's a per-request cost, not a scale issue |
| Overusing `client:load` on static content (hero text, cards, nav) | Unnecessary JS shipped and hydrated for content with no interactivity | Default to zero-JS Astro components; only use `client:*` on genuinely interactive islands (if any) | Immediately — hurts every visitor's load time, not scale-dependent |
| Unoptimized project screenshots in `public/` | High LCP, poor Lighthouse score, slow mobile load | Use `astro:assets` `<Image>` with WebP/AVIF output | Immediately, worsens as more projects/screenshots are added |
| Google Fonts loaded without `preconnect` or self-hosting | Extra round-trip before text renders (FOIT/FOUT) | `preconnect` at minimum, self-host via `@fontsource` for best result | Immediately; more noticeable on slow/mobile connections |
| Backdrop-filter blur on large/many glass panels | Janky scroll performance, especially on lower-end mobile GPUs | Limit blur radius and number of simultaneously blurred large panels; test on real mid-range mobile devices | Noticeable once several glass panels stack/overlap in viewport (e.g., project grid with many glass cards) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| CSP allows `unsafe-inline`/`unsafe-eval` broadly "to make things work" instead of scoping via hashes | Defeats the primary purpose of CSP (mitigating XSS), gives false sense of security while providing near-zero real protection | Use Astro's build-time hash generation for inline styles/scripts; only allow specific, justified external origins by exact URL, never wildcard `*` |
| `X-Frame-Options`/`frame-ancestors` omitted | Site can be embedded in a hostile iframe for clickjacking (e.g., fake overlay tricking a recruiter into clicking a malicious link disguised as a portfolio link) | Set both `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` since this site has no legitimate embedding use case |
| `Permissions-Policy` left unset | Browser APIs (camera, mic, geolocation, USB, etc.) remain available to any script that runs, even though the site needs none of them, widening attack surface if a dependency is ever compromised | Explicitly deny all unused permissions the site doesn't need: `camera=(), microphone=(), geolocation=(), usb=()`, etc. |
| Contact links point to `mailto:`/social profile URLs without `rel="noopener noreferrer"` on `target="_blank"` links | Reverse tabnabbing — the opened tab can manipulate the original portfolio tab via `window.opener` | Add `rel="noopener noreferrer"` to every `target="_blank"` external link (GitHub, LinkedIn, project live demos) |
| No Subresource Integrity (SRI) on any remaining third-party `<script>`/`<link>` tags | If a third-party CDN is compromised, injected malicious code runs on the portfolio with the page's trust | Prefer bundling/self-hosting over CDN `<script src>` wherever feasible (also resolves Pitfall 1); if a CDN script must remain, add `integrity`/`crossorigin` attributes |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Dead/placeholder links left live at launch (prototype has fake project links) | Recruiter clicks a project link expecting a live demo/repo and hits a 404 or nothing, damaging credibility | Ensure every placeholder that would render as a clickable link either has a real destination before launch or is clearly non-interactive/hidden until real content lands |
| Glassmorphism panels with insufficient contrast make body text hard to read on some backgrounds/scroll positions | Recruiters skimming quickly (a few seconds, per the project's own Core Value) may miss key info due to poor readability | Verify contrast on real rendered backgrounds (Pitfall 7), not just design tokens |
| No visible focus states for keyboard navigation | Keyboard/screen-reader users (including accessibility-conscious technical recruiters) can't tell what's focused | Apply the existing cyan glow treatment to `:focus-visible` states consistently across nav, buttons, and cards |
| Heavy blur/glow effects on low-end devices causing jank | Visitors on older phones perceive the site as slow/unpolished — ironic for a site meant to prove technical competence | Test on mid-range mobile hardware, consider `prefers-reduced-motion`/reduced-effects fallback |

## "Looks Done But Isn't" Checklist

- [ ] **Security headers:** Often "configured" only in `astro.config.mjs` experimental flags that don't actually emit for static output — verify with `curl -I` or securityheaders.com against the live Vercel URL, not local dev.
- [ ] **Fonts:** Often visually correct in dev but silently falling back to system fonts in production due to CSP blocking `fonts.googleapis.com`/`fonts.gstatic.com` — check the Network tab and computed font-family in production, not just visually "looks right."
- [ ] **SEO meta tags:** Often present on the homepage only — verify every route (Dossier/Stack/Projects/Contact sections or pages) has correct title/description/canonical, not just `/`.
- [ ] **Images:** Often "working" (visible, correct) but unoptimized — verify actual served format (WebP/AVIF vs PNG/JPEG) and file size via DevTools Network tab, not just visual correctness.
- [ ] **Contrast/accessibility:** Often passes a casual visual glance but fails automated checks — run Lighthouse/axe accessibility audit, don't rely on "it looks readable to me."
- [ ] **Dependency audit:** Often run once at project start and assumed still clean at launch — re-run `npm audit` immediately before the final deploy.
- [ ] **`lang` attribute and locale consistency:** Often copy-pasted from an English-language prototype/template and never revisited — verify `<html lang="pt-BR">` and no stray English UI strings remain.
- [ ] **External link safety:** Often functional but missing `rel="noopener noreferrer"` — verify every `target="_blank"` link.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|-----------------|
| Tailwind CDN shipped to production | LOW | Swap to build-time Tailwind integration, re-run build, verify visual parity against `DESIGN.md`/prototype screenshot; no data/content migration involved |
| CSP too strict, breaking fonts/styles post-launch | LOW-MEDIUM | Inspect browser console CSP violation reports, add the specific missing hash/origin, redeploy; consider CSP `Report-Only` mode during a hardening pass to catch violations without breaking the live site first |
| Contrast failures discovered post-launch via accessibility audit | LOW | Adjust panel opacity/text color tokens centrally (if design tokens are centralized in Tailwind config/CSS variables, this is a small diff), redeploy |
| Unoptimized images already deployed | LOW-MEDIUM | Move images from `public/` to `src/assets/`, swap `<img>` to `astro:assets` `<Image>`, rebuild — mechanical but touches every project card |
| Vulnerable dependency found via late `npm audit` | LOW-HIGH (depends on breaking changes) | Patch/minor bump usually LOW; major version bump of Astro/Tailwind may require config migration — budget time accordingly, don't treat as a same-day fix if it's a major bump |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Tailwind CDN in production | Project setup / build config phase | `dist/` build output contains a static, purged CSS file; no `cdn.tailwindcss.com` reference anywhere in shipped HTML |
| Missing/incomplete security headers | Security hardening phase (post-content, pre-launch) | `curl -I` against deployed Vercel URL shows CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy on every route, verified via securityheaders.com or similar |
| CSP breaking fonts/styles/islands | Security hardening phase | Zero CSP violation entries in browser console across all pages in production build |
| Exposed secrets / misused `PUBLIC_` prefix | Project setup phase (convention), deploy phase (gate) | Grep `dist/` for secret-shaped strings before each deploy; `.env` confirmed git-ignored |
| Outdated/vulnerable dependencies | Project setup phase (lockfile + Dependabot), deploy phase (gate) | `npm audit` clean (no high/critical) immediately before deploy |
| Missing SEO/meta basics, wrong `lang` | Content/components phase (build `<SEO>` component), polish phase (final check) | View-source on every route shows correct `lang`, title, description, OG tags, canonical; sitemap reachable |
| Glassmorphism contrast failures | Design system/styling phase, polish phase (verification) | Lighthouse Accessibility score ≥ 90 with no contrast violations on every page |
| Unoptimized images | Content/projects phase (establish pattern early) | Lighthouse "Serve images in next-gen formats" and "Properly size images" pass; zero image-driven CLS |

## Sources

- [Astro on Vercel — official Vercel docs](https://vercel.com/docs/frameworks/frontend/astro) — HIGH confidence, deploy/adapter behavior, image optimization, headers/caching
- [astrojs/vercel — Astro official integration docs](https://docs.astro.build/en/guides/integrations-guide/vercel/) — HIGH confidence
- [Astro 5.9 — Content Security Policy announcement](https://astro.build/blog/astro-590/) — HIGH confidence (official), notes CSP is experimental and hash-based
- [Astro Images guide — official docs](https://docs.astro.build/en/guides/images/) — HIGH confidence, `public/` vs `src/assets` behavior
- [Astro environment variables guide — official docs](https://docs.astro.build/en/guides/environment-variables/) — HIGH confidence, `PUBLIC_` prefix behavior
- [withastro/astro Issue #13960 — non-PUBLIC env vars exposure discussion](https://github.com/withastro/astro/issues/13960) — MEDIUM confidence, community-reported edge case
- [Tailwind CSS CDN production warning discussions (GitHub issues/discussions)](https://github.com/tailwindlabs/tailwindcss/issues/18731) — MEDIUM-HIGH confidence, corroborated by Tailwind's own official warning text
- [Vercel response headers / HSTS defaults](https://vercel.com/docs/headers/response-headers) — MEDIUM-HIGH confidence, WebSearch-verified against official docs summary
- [Axess Lab — Glassmorphism Meets Accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) — MEDIUM confidence, accessibility-focused analysis, corroborated by general WCAG 2.1/2.2 contrast requirements (4.5:1 / 3:1, well-established standard — HIGH confidence on the numeric thresholds themselves)
- Direct inspection of `Arquivos de design/code.html` (this project's own prototype) — HIGH confidence, primary source for what mistakes are actually present in this codebase (Tailwind CDN script, Google Fonts links, `lang="en"`, inline `tailwind.config` script, glass-panel/color tokens)
- General OWASP-aligned web security header guidance (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, `rel="noopener noreferrer"`, SRI) — MEDIUM confidence, established industry practice rather than a single cited source

---
*Pitfalls research for: Astro static developer portfolio site (dark/glassmorphism design, Vercel deploy, explicit security-header requirement)*
*Researched: 2026-09-02*
