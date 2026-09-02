// Source: RESEARCH.md Architecture Pattern 2 (verified against
// tailwindcss.com/docs/installation/framework-guides/astro, astroicon.dev/getting-started)
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  // Astro 7's default, stated explicitly per CLAUDE.md.
  output: "static",
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
