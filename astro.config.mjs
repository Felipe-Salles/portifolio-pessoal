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
  },
});
