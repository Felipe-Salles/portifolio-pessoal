// Source: RESEARCH.md Architecture Pattern 2 (verified against
// tailwindcss.com/docs/installation/framework-guides/astro, astroicon.dev/getting-started)
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
// Source: 04-RESEARCH.md Code Examples "astro.config.mjs additions" (verified
// against docs.astro.build/en/guides/integrations-guide/sitemap/) — SEO-03.
import sitemap from "@astrojs/sitemap";
// Source: 05-RESEARCH.md Code Examples "astro.config.mjs additions" (verified
// against docs.astro.build/en/guides/integrations-guide/vercel/) — Vercel
// deploy target adapter, required per CLAUDE.md.
import vercel from "@astrojs/vercel";

export default defineConfig({
  // Astro 7's default, stated explicitly per CLAUDE.md.
  output: "static",
  // DEPLOY-01: real production origin, assigned by Vercel (D-01 default
  // *.vercel.app subdomain, no custom domain). Every og:image/canonical/
  // sitemap/robots.txt URL depends on this single value.
  site: "https://portifolio-pessoal-seven-sigma.vercel.app",
  // Kept enabled for CLAUDE.md compliance / forward-compatibility even
  // though this project's own vercel.json (not this bridge) is the verified
  // delivery mechanism for the security headers — see 05-RESEARCH.md
  // Pitfall 1 (staticHeaders has a documented history of not reliably
  // delivering headers, including CSP, for output:"static" builds). No
  // `security.csp` key here on purpose: per D-04 the enforcing CSP header
  // is hand-authored in vercel.json, and Astro's CSP feature would only add
  // a <meta> tag that cannot express frame-ancestors anyway.
  adapter: vercel({
    staticHeaders: true,
  }),
  integrations: [
    icon(),
    sitemap({
      filter: (page) => !page.includes("/og-template/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Rule 1 fix (05-04): Vite's default 4096-byte assetsInlineLimit was
    // base64-inlining small @fontsource woff/woff2 subset files directly
    // into the compiled CSS as `data:font/...` URIs. Those data URIs
    // violate this project's `font-src 'self'` CSP directive (no `data:`
    // grant) — confirmed live by scripts/verify-live-csp.mjs against the
    // real production URL. A flat `assetsInlineLimit: 0` was tried first
    // but also externalized Nav.astro's previously-inlined mobile-menu
    // script (the same Vite size-threshold heuristic decides both), which
    // would have broken Phase 5's script-src hash-pinning approach. This
    // predicate form instead forces only font files to stay real
    // same-origin files, consistent with SEC-01's self-hosted-only
    // discipline, and defers to Vite's default heuristic (byte-size vs.
    // 4096) for every other asset — including Nav.astro's script chunk,
    // which keeps inlining exactly as before.
    build: {
      assetsInlineLimit: (filePath) => {
        if (/\.(woff2?|ttf|otf|eot)$/i.test(filePath)) {
          return false;
        }
        return undefined;
      },
    },
  },
});
