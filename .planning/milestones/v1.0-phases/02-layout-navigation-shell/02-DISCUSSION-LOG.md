# Phase 2: Layout & Navigation Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 02-layout-navigation-shell
**Areas discussed:** Mobile Nav Toggle, Connect Button, Footer Links, Accessibility Skip Link

---

## Mobile Nav Toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay full-screen | Painel cobre a viewport inteira, links grandes centralizados | ✓ |
| Dropdown abaixo do nav | Painel compacto desliza para baixo | |
| Você decide | Claude's discretion, seguindo DESIGN.md | |

**User's choice:** Overlay full-screen
**Notes:** Prototype (`code.html`) has no markup for the expanded mobile state — only the closed `menu` icon. The overlay must be designed fresh within DESIGN.md's system (glass-panel, cyan glow, motion patterns).

---

## Connect Button

| Option | Description | Selected |
|--------|-------------|----------|
| Link para #contact | href="#contact" — funciona assim que a seção Contact existir (Fase 3) | ✓ |
| mailto: direto | Usa o placeholder de e-mail em site.ts | |
| Placeholder inércio | Sem destino funcional ainda | |

**User's choice:** Link para #contact
**Notes:** The button becomes a real anchor now, even though `#contact` won't resolve to a real section until Phase 3. This is intended sequencing.

---

## Footer Links

| Option | Description | Selected |
|--------|-------------|----------|
| Reusar site.socials | Mesmos links estruturais de site.ts (ícones → texto no footer) | ✓ |
| Lista própria do footer | GitHub/LinkedIn placeholders próprios, sem Documentation | |
| Manter os 3 do protótipo | GitHub/LinkedIn/Documentation, href="#" | |

**User's choice:** Reusar site.socials
**Notes:** `site.socials` currently has 4 entries (code/work/mail/chat), not the prototype's 3 (GitHub/LinkedIn/Documentation) — footer will reflect however many entries `site.socials` has. Single source of truth across footer and future Contact section.

---

## Accessibility Skip Link

| Option | Description | Selected |
|--------|-------------|----------|
| Adicionar na Fase 2 | Reforça A11Y-01 desde já | ✓ |
| Deixar para a Fase 4 | Agrupar com A11Y-02/03/04 | |

**User's choice:** Adicionar na Fase 2
**Notes:** Cheap to add alongside the rest of the shell; directly reinforces the keyboard-navigation requirement this phase already owns.

---

## Claude's Discretion

- Mobile overlay open/close animation, icon swap (menu ↔ close), and focus-trap implementation details
- Whether to add scroll-spy / active-link highlighting (skipped — sections don't exist until Phase 3)
- Footer copyright line content (follows Phase 1's placeholder-content convention, not the prototype's fake text)

## Deferred Ideas

None — discussion stayed within phase scope.
