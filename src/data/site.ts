// Typed singleton site content (D-02).
//
// Plain build-time TypeScript module, NOT an Astro Content Collection — this
// content has exactly one instance each (identity, bio, System Specs, tech
// stack, social links), so per-file schema validation would be pure overhead.
// Content Collections are reserved for `projects`, the genuine repeating list
// defined in `src/content.config.ts`.
//
// Every content-bearing string value is a conspicuous placeholder per D-03:
// bracketed `[…]` for short identity fields, `PLACEHOLDER — … a definir` for
// descriptive fields. Icon names and `href` values are structural, not
// content, and are exempt. Not imported/rendered anywhere yet — Phases 2 and
// 3 consume this module.
export const site = {
  // Brand/identity for the nav wordmark.
  brand: "[Nome/Marca Aqui]",

  // Visitor's name.
  name: "[Seu Nome Aqui]",

  // Professional title/persona (HERO-01).
  title: "PLACEHOLDER — título/persona a definir",

  // Availability status string shown as a Hero badge (HERO-01).
  availabilityStatus: "PLACEHOLDER — disponibilidade a definir",

  // Hero heading (HERO-01).
  heroHeading: "[Nome/Marca Aqui]",

  // Hero subtitle (HERO-01).
  heroSubtitle: "PLACEHOLDER — subtítulo a definir",

  // Dossier bio — an array of paragraph strings; the prototype renders two
  // <p> elements, so an array keeps that flexible (DOSS-01).
  bio: [
    "PLACEHOLDER — parágrafo 1 da bio a definir",
    "PLACEHOLDER — parágrafo 2 da bio a definir",
  ],

  // "System Specs" label/value pairs shown alongside the bio (DOSS-02).
  systemSpecs: [
    { label: "EXPERIENCE", value: "PLACEHOLDER — a definir" },
    { label: "FOCUS", value: "PLACEHOLDER — a definir" },
    { label: "DOMAIN", value: "PLACEHOLDER — a definir" },
  ],

  // Tech stack grouped by the 3 fixed categories the design requires
  // (TECH-01) — encoded as fixed keys, not a generic category list.
  techStack: {
    languages: ["PLACEHOLDER"],
    frameworks: ["PLACEHOLDER"],
    infrastructure: ["PLACEHOLDER"],
  },

  // Social/contact links (CONT-01). Icon names use the verified base
  // material-symbols glyphs (no -outline suffix). href is structural, not
  // content — "#" is a valid placeholder target.
  socials: [
    { icon: "material-symbols:code", href: "#", label: "PLACEHOLDER" },
    { icon: "material-symbols:work", href: "#", label: "PLACEHOLDER" },
    { icon: "material-symbols:mail", href: "#", label: "PLACEHOLDER" },
    { icon: "material-symbols:chat", href: "#", label: "PLACEHOLDER" },
  ],
} as const;
