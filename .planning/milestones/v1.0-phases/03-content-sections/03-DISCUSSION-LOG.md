# Phase 3: Content Sections - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 3-Content Sections
**Areas discussed:** Mapeamento de conteúdo do Hero, Grid de Projects com contagem variável, Fonte de links do Contact, Efeito hover nos cards sem imagem real

---

## Mapeamento de conteúdo do Hero

| Option | Description | Selected |
|--------|-------------|----------|
| heroHeading | Same placeholder value as site.brand, consistent with nav wordmark | ✓ |
| name | Uses the person's name directly as H1 | |

**User's choice:** heroHeading
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Linha entre H1 e parágrafo | title as secondary line below H1, heroSubtitle stays the body paragraph — 3 text levels | ✓ |
| Substituindo heroSubtitle | title becomes the only secondary line, heroSubtitle unused — 2 text levels | |

**User's choice:** Linha entre H1 e parágrafo
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sem uso na Hero | name reserved for future use (meta tags etc.) | ✓ |
| Usado como parte do H1 | H1 combines name + heroHeading somehow | |

**User's choice:** Sem uso na Hero
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, com pulso | Reuses prototype's CSS pulse animation, zero JS | ✓ |
| Sim, sem animação | Static badge, no pulse | |

**User's choice:** Sim, com pulso
**Notes:** —

---

## Grid de Projects com contagem variável

| Option | Description | Selected |
|--------|-------------|----------|
| 3 colunas fixas, auto-flow | Always 3 columns; sparse counts leave empty cells | ✓ |
| Colunas adaptáveis por contagem | Column count adapts to project count | |

**User's choice:** 3 colunas fixas, auto-flow
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Card maior/destacado | featured spans 2 columns and/or stronger border/glow | ✓ |
| Só afeta ordenação | featured only affects sort position, not card size | |

**User's choice:** Card maior/destacado
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| featured primeiro, depois order | All featured=true first (sorted by order among themselves), then rest by order | ✓ |
| Só order importa | Whole list sorted only by order; featured doesn't affect position | |

**User's choice:** featured primeiro, depois order
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Gradiente cyan com ícone central | Cyan gradient + centered generic icon, reuses design-system colors | ✓ |
| Bloco sólido sem ícone | Plain solid-color block, no graphic element | |

**User's choice:** Gradiente cyan com ícone central
**Notes:** —

---

## Fonte de links do Contact

| Option | Description | Selected |
|--------|-------------|----------|
| Reusar site.socials como está | Contact renders the same 4 entries Footer already uses — single source of truth | ✓ |
| Adicionar campos semânticos dedicados | New contactEmail/contactGithub/contactLinkedin fields, separate from site.socials | |

**User's choice:** Reusar site.socials como está
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, ícones em círculo | Prototype's circular icon-button treatment (w-12 h-12, rounded-full, cyan hover) | ✓ |
| Mesmo estilo do Footer | Contact uses the same plain text-link style as Footer | |

**User's choice:** Sim, ícones em círculo
**Notes:** Both Footer and Contact read from the same site.socials[].icon/.href/.label, just styled differently.

| Option | Description | Selected |
|--------|-------------|----------|
| Novos campos em site.ts | Adds contactHeading/contactSubtitle placeholders, follows D-03 convention | ✓ |
| Texto fixo no componente | Generic non-fictional text hardcoded in Contact.astro, bypassing site.ts | |

**User's choice:** Novos campos em site.ts
**Notes:** —

**Not asked as a choice (single-path, security default):** `rel="noopener noreferrer"` applied to Contact's social links, matching Footer's T-02-17 mitigation from Phase 2 — no genuine alternative once links become real external URLs.

---

## Efeito hover nos cards sem imagem real

| Option | Description | Selected |
|--------|-------------|----------|
| Hover sutil no fallback | Stronger glow or slight opacity/scale change on the gradient fallback | ✓ |
| Sem hover no fallback | Gradient stays static; only border/title react on hover | |

**User's choice:** Hover sutil no fallback
**Notes:** The prototype's grayscale→color photo-reveal effect itself is deferred to when real coverImage assets exist (v2) — this is a different, simpler hover reaction for the gradient placeholder only.

---

## Claude's Discretion

- Exact wording/naming of `contactHeading`/`contactSubtitle` fields in `site.ts`
- Exact gradient fallback composition (color stops, icon choice) for project cards without `coverImage`
- Exact hover treatment intensity on the gradient fallback
- Dossier layout (8/4 column split) — uncontested, no gray area raised
- Tech Stack badge rendering — uncontested, no gray area raised
- Mobile reflow mechanics (background grid scaling per LAY-01) — technical detail, not a user-facing choice

## Deferred Ideas

None — discussion stayed within phase scope. The prototype's grayscale→color photo hover effect was considered and explicitly deferred to when real `coverImage` assets land (v2), not treated as a new-capability idea.
