<!-- GSD:project-start source:PROJECT.md -->
## Project

**Portfólio Dev — Felipe Salles**

Site de portfólio pessoal para um desenvolvedor, construído em Astro, para exibir projetos, capacitações técnicas (stack) e redes sociais/contato. Segue o design system "Cyber-Sophisticate" (dark, glassmorphism, acentos cyan) já especificado e prototipado em `Arquivos de design/`.

**Core Value:** Um visitante (recrutador, cliente, colega) consegue em poucos segundos entender quem é o dono do site, quais tecnologias domina, e ver projetos reais que provam isso — com o site carregando rápido e passando confiança técnica (segurança básica correta).

### Constraints

- **Tech stack**: Astro — escolhido pelo usuário por manter simplicidade, adicionando complexidade (ilhas de interatividade, frameworks JS) só quando necessário
- **Deploy**: Vercel — escolhido para hospedagem, CDN e HTTPS
- **Idioma**: Português (PT-BR) apenas neste v1
- **Segurança**: Deve cobrir os princípios básicos de cybersegurança — no mínimo security headers bem configurados (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) e boas práticas gerais (sem segredos no client, dependências auditadas)
- **Design**: Deve seguir fielmente `Arquivos de design/DESIGN.md` (paleta, tipografia, espaçamento, componentes) — não é uma decisão em aberto, é um contrato de design já aprovado
- **Conteúdo**: Placeholders neste momento — estrutura deve facilitar substituição posterior sem retrabalho de arquitetura
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Important note on versions
- **Astro `7.2.10`** is current (Astro 6 shipped March 2026, Astro 7 shipped June 2026 with a Rust-rewritten compiler). Astro 6 stabilized three features this project needs out of the box: the **Fonts API**, the **Content Security Policy (CSP) API**, and the modern **Content Layer** (`glob()` loader) collections API — none of these require `experimental` flags anymore.
- **`@astrojs/tailwind` is deprecated.** Do not install it. Tailwind CSS now ships an official Vite plugin (`@tailwindcss/vite`) which is the documented, preferred integration path for Tailwind 4 in Astro ≥5.2.
- Node.js **`>=22.12.0`** is required by Astro 7 and its adapters — set this in `package.json` `engines` and as the Vercel project's Node version.
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | `^7.2.10` | Site framework, static generation, islands | Already decided by user. Ships zero-JS by default (matches the "no framework complexity unless needed" constraint), has first-class Content Collections, a built-in Fonts API, and a built-in CSP API — covering three of this project's explicit requirements (content management, font loading, security headers) without extra libraries. HIGH confidence (verified via Context7 `/withastro/docs`, npm `astro@7.2.10`). |
| Tailwind CSS | `^4.3.3` (via `@tailwindcss/vite`) | Utility-first styling, matches the existing HTML prototype | The design prototype (`code.html`) already uses Tailwind class names extensively. Tailwind v4's CSS-first `@theme` config maps 1:1 onto the DESIGN.md token list (colors, `display-lg`/`headline-md`/`body-lg` type scale, 8px spacing unit, radii) as CSS custom properties — no `tailwind.config.js` needed. HIGH confidence. |
| `@astrojs/vercel` | `^11.0.9` | Vercel deployment adapter | Required to (a) emit real HTTP security headers instead of `<meta>` tags via `staticHeaders: true`, and (b) use Vercel-specific features (Web Analytics, Image Optimization) later if desired. For a purely static site the adapter is technically optional for hosting alone (static output deploys to Vercel with zero adapter), but it is **required for the `staticHeaders` CSP-to-`vercel.json` bridge** — see Security section. HIGH confidence (verified via Context7). |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro-icon` | `^1.2.0` | Renders icons as inline, build-time-optimized SVG (`<Icon />` component) | Use instead of the prototype's Material Symbols **icon font** (loaded from `fonts.googleapis.com`/`fonts.gstatic.com` in `code.html`). Pair with `@iconify-json/material-symbols` (`^1.2.90`) to keep the exact same glyphs (`menu`, `arrow_forward`, `open_in_new`, `code`, `work`, `mail`, `chat`) the prototype uses, but self-hosted and tree-shaken at build time — zero runtime requests, zero extra `font-src`/`connect-src` CSP entries, no icon-font FOUC. HIGH confidence. |
| `@astrojs/sitemap` | `^3.7.4` | Auto-generates `sitemap.xml` at build | Cheap SEO win for a public portfolio; zero runtime cost since it's a build-time integration. Optional but recommended. MEDIUM confidence (standard practice, not explicitly requested in PROJECT.md). |
| `sharp` | bundled transitively by Astro | Image transformation (resize/format conversion) engine behind `astro:assets` | Installed automatically as Astro's default image service in Node-based builds (including Vercel's build environment). No manual install needed in the common case — only add explicitly if a lockfile/hoisting issue omits it. MEDIUM confidence (behavior is documented but exact bundling mechanics can vary by package manager). |
| `@astrojs/mdx` | `^4.x` (only if needed) | Lets project Markdown bodies embed Astro/UI components | **Not needed for v1.** PROJECT.md scope (project cards: name, description, tags, links) is fully representable in plain Markdown frontmatter + body. Add later only if a project write-up needs embedded interactive snippets. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | Type-checking, Content Collection schema inference | Astro projects are TypeScript-first by default (`astro.config.mjs`, `content.config.ts`). Use the `strict` base tsconfig (`astro/tsconfigs/strict`). Latest stable `5.x` (verified `typescript@7.0.2` is actually the newest published major — confirm compatibility with Astro's bundled TS tooling before adopting; if in doubt pin to the TS version Astro's own `tsconfig` bases were tested against). LOW-MEDIUM confidence on the exact TS major to pin — re-verify at implementation time since this moves independently of Astro. |
| `@astrojs/check` | `astro check` — type-checks `.astro` files, validates Content Collection schemas | Run in CI/pre-deploy to catch content frontmatter mistakes (e.g., a project entry missing a required field) before they reach production. |
| Prettier + `prettier-plugin-astro` | Formatting `.astro` files | `prettier-plugin-astro@^0.14.1`. Standard in the Astro ecosystem; avoids manual formatting bikeshedding. |
| ESLint + `eslint-plugin-astro` | Linting | `eslint-plugin-astro@^3.1.0`. Optional but recommended given the security-conscious requirement — lint rules catch accidental `set:html` misuse (XSS-relevant) early. |
| Vercel CLI (`vercel`) | Local preview of the exact Vercel build/output, header inspection | Use `vercel build && vercel deploy --prebuilt` or `vercel dev` to confirm `vercel.json` headers actually apply — Astro's own `astro preview` does **not** simulate Vercel's header layer. |
## Installation
# Core
# Styling
# Icons (self-hosted, replaces Material Symbols icon font from the prototype)
# SEO (optional but recommended)
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Tailwind v4 via `@tailwindcss/vite` | `@astrojs/tailwind` (legacy integration) | Never for a new project — package is officially deprecated in favor of the Vite plugin. Only relevant if forced onto Tailwind 3 for an unrelated legacy dependency. |
| Astro built-in Fonts API (`fonts: [...]`, `fontProviders.google()`) | `@fontsource/*` packages imported manually, or raw `<link>` to `fonts.googleapis.com` (what the prototype does today) | Use `@fontsource/*` (e.g. `@fontsource/inter`) instead of `fontProviders.google()` if you want the build to be **fully offline-reproducible** (font files ship inside the npm package, no network call to Google during `astro build`). Functionally near-identical output either way — both self-host the final files, no runtime request to Google in either case. Never use a raw Google Fonts `<link>` — that's exactly the pattern this project needs to remove for CSP/privacy reasons. |
| `astro-icon` + `@iconify-json/material-symbols` (inline SVG) | Keep the Material Symbols variable icon font | Only keep the icon font if you need Material Symbols' fill/weight animation (`FILL 0→1` morph) exactly as a live CSS transition — inline SVG requires swapping icon variants instead of animating a font-variation-setting. For this project's static icon usage (nav, socials, project links), inline SVG is strictly better: no external request, no FOUC, no CSP `font-src`/`style-src` exception needed. |
| `@astrojs/vercel` adapter with `staticHeaders: true` | Astro's meta-tag-only CSP (no adapter, or adapter without `staticHeaders`) | Meta-tag CSP still works with zero adapter config, but **cannot** express `frame-ancestors` (browsers ignore this directive in `<meta>` — it only works as a real HTTP header) and can't set X-Frame-Options/HSTS/Referrer-Policy/Permissions-Policy at all. Since PROJECT.md explicitly requires those headers, the adapter + `staticHeaders` + `vercel.json` path is not optional here. |
| Content Collections with `glob()` loader (Content Layer API) | Legacy `type: 'content'` collections (pre-Astro 5 API) | The legacy API still works in Astro 7 for back-compat but is not how new projects should be written — `glob()` is the documented, current API and is what `astro add`/scaffolding generates today. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Tailwind CDN script (`<script src="https://cdn.tailwindcss.com">`) — used in the current `code.html` prototype | Loads and JIT-compiles Tailwind in the browser at runtime: adds an external script dependency (forces `script-src` to allow `cdn.tailwindcss.com`), ships the full Tailwind runtime to the client, and is explicitly called out by Tailwind's own docs as **not intended for production**. Directly conflicts with the "security headers / minimal attack surface" constraint in PROJECT.md. | `@tailwindcss/vite` — compiles Tailwind at build time into a static CSS file, zero runtime JS, zero external script origin needed. |
| `<link>` to `fonts.googleapis.com` / `fonts.gstatic.com` — used in the current prototype for Inter/JetBrains Mono/Lexend/Material Symbols | Every page load makes a third-party request to Google, requires whitelisting `fonts.googleapis.com` in `style-src` and `fonts.gstatic.com` in `font-src` in your CSP, and leaks visitor IP/UA to Google on every visit. | Astro's built-in Fonts API (`fontProviders.google()` or `fontProviders.fontsource()`) — downloads and self-hosts the font files at build time; CSP can stay `font-src 'self'`. |
| `@astrojs/tailwind` | Officially deprecated (confirmed via npm README, published under `deprecated` warning banner: "Tailwind CSS now offers a Vite plugin which is the preferred way to use Tailwind 4 in Astro"). | `@tailwindcss/vite`. |
| A contact form + serverless email-sending function | PROJECT.md explicitly scoped this out ("sem formulário... minimiza superfície de ataque") — adding one would reintroduce the exact attack surface (spam, injection, secrets handling, rate limiting) the user chose to avoid. | Direct `mailto:`/social links, exactly as already decided. |
| Astro View Transitions (`<ClientRouter />`) combined with strict CSP | Astro's docs explicitly flag that the built-in CSP feature is currently **incompatible** with `ClientRouter`-based view transitions. If the design calls for animated page transitions later, this is a real conflict to resolve, not a hypothetical one. | If cross-page transitions are wanted, prefer CSS-only entrance animations (`@starting-style`, opacity/transform on scroll) per-page rather than `ClientRouter`; revisit if Astro ships a fix. |
## Stack Patterns by Variant
- Keep `output: 'static'` (Astro's default — do not switch to `server`/`hybrid`).
- The Vercel adapter is still worth keeping (not purely optional) specifically for the `staticHeaders: true` → `vercel.json` header-injection path described below; without it you're limited to meta-tag CSP and manually hand-written `vercel.json` headers for everything else.
- No Astro middleware is needed for security headers — middleware only runs for on-demand/server-rendered routes, and this site has none. All headers for a static site are best expressed via `vercel.json` (platform-level, applies even to prerendered/cached responses) rather than middleware.
- Reach for a lightweight approach first: vanilla `<script>` with `client:load`/`client:visible` directives, or a tiny library (e.g., Alpine.js) before introducing a full UI framework (React/Vue/Svelte) — matches the user's explicit "complexity only when necessary" preference for Astro.
- If a full framework becomes justified, Astro's official integrations (`@astrojs/react`, `@astrojs/svelte`, etc.) are the correct install path — do not hand-roll a custom renderer.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `astro@^7.2.10` | `@astrojs/vercel@^11.0.9` (peer dep `astro: ^7.0.0`) | Verified via `npm view @astrojs/vercel peerDependencies`. |
| `astro@^7.2.10` | `astro-icon@^1.2.0` (peer dep `node >= 22.12.0`, no explicit astro peer range published but actively maintained for current Astro) | Node engine requirement matches Astro 7's own `node >= 22.12.0` floor — no extra constraint introduced. |
| `tailwindcss@^4.3.3` | `@tailwindcss/vite@^4.3.3` | Must stay on matching major/minor — the Vite plugin ships from the same monorepo/release train as `tailwindcss` core; mismatched majors (v3 core + v4 plugin or vice versa) will break the build. |
| Node.js | `>=22.12.0` | Hard floor from `astro@7`'s own `engines` field. Set this explicitly in Vercel Project Settings → Node.js Version (and in `package.json` `engines`) so local dev and the Vercel build container agree. |
## Security Headers & CSP — specific guidance
## Sources
- Context7 `/withastro/docs` — queried: fonts API / self-hosting behavior, `security.csp` configuration reference and limitations, `@astrojs/vercel` adapter reference (`staticHeaders`, output modes), Content Collections `glob()` loader reference, `astro:assets` Image/Picture component reference, Tailwind v4 integration guide (deprecation notice for `@astrojs/tailwind`). HIGH confidence — official docs source.
- `npm view astro / @astrojs/vercel / @astrojs/tailwind / tailwindcss / @tailwindcss/vite / astro-icon / @iconify-json/material-symbols / @fontsource/inter / @astrojs/sitemap / @astrojs/check / prettier-plugin-astro / typescript / eslint-plugin-astro` (npm registry, live, 2026-09-02) — version numbers and `engines`/`peerDependencies` fields. HIGH confidence — direct registry query, not training data.
- npm README for `@astrojs/tailwind` (fetched live) — explicit deprecation banner confirming the Vite-plugin migration path. HIGH confidence.
- [Astro 6.0 blog post](https://astro.build/blog/astro-6/), [Astro 7.0 blog post](https://astro.build/blog/astro-7/) (via WebSearch) — confirms Fonts API / CSP API / Content Layer stabilization timeline. MEDIUM confidence (WebSearch summary, not primary-source-fetched, but corroborated by Context7 upgrade-guide docs which explicitly list `csp`, `fonts`, `liveContentCollections` as flags removed/stabilized in v6).
- WebSearch: "Vercel vercel.json headers Strict-Transport-Security..." — general pattern for `vercel.json` `headers` array syntax and common security-header values. LOW-MEDIUM confidence (third-party guides, not Vercel's own primary docs — flagged above where relied upon).
- Read locally: `Arquivos de design/code.html` (prototype markup — confirms current Tailwind CDN `<script>` tag, Google Fonts `<link>` tags, and Material Symbols icon-font usage patterns that this stack replaces) and `Arquivos de design/DESIGN.md` (confirms Lexend/Inter/JetBrains Mono font requirement and full type scale).
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
