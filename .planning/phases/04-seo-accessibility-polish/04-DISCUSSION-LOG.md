# Phase 4: SEO, Accessibility & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 4-SEO, Accessibility & Polish
**Areas discussed:** Imagem OG/Twitter Card, Página 404, Favicon, Ícones decorativos & alt text

---

## Imagem OG/Twitter Card

| Option | Description | Selected |
|--------|-------------|----------|
| Wordmark + tagline | Reusa site.brand/site.title, atualiza junto com o conteúdo real | ✓ |
| Só padrão visual, sem texto | Grid + glow clouds, sem nome/título | |
| Você decide | Composição a critério do Claude | |

**User's choice:** Wordmark + tagline (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Reaproveitar Hero | Grid + glow clouds + glass panel, consistência visual imediata | ✓ |
| Composição simplificada | Menos elementos, texto maior, otimizado para thumbnail pequeno | |

**User's choice:** Reaproveitar Hero (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Mesma imagem do site | 404 raramente é compartilhada diretamente | ✓ |
| Imagem própria para 404 | Sinaliza visualmente o erro | |

**User's choice:** Mesma imagem do site (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Mantém o estilo placeholder | Texto colchetado, consistente com D-03 | ✓ |
| Texto genérico sem colchetes | Mais apresentável se compartilhado antes do conteúdo real | |

**User's choice:** Mantém o estilo placeholder (recomendado)
**Notes:** Todas as recomendações aceitas sem alteração.

---

## Página 404

| Option | Description | Selected |
|--------|-------------|----------|
| Temático "system" | Linguagem terminal/dossiê, ex: "ERRO 404 — ROTA NÃO ENCONTRADA" | ✓ |
| Direto e simples | Mensagem de erro padrão, sem tom "hacker/system" | |

**User's choice:** Temático "system" (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Botão para a Home | CTA único, estilo btn-primary | ✓ |
| Botão para Projetos | Assume que o visitante procurava um link de projeto | |
| Sem CTA dedicado | Só a nav padrão | |

**User's choice:** Botão para a Home (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Só tipografia + glass-panel | Reaproveita primitivos existentes, sem asset novo | ✓ |
| Ícone grande de erro/aviso | Material Symbols error/warning centralizado | |

**User's choice:** Só tipografia + glass-panel (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, nav completa | Âncoras levam de volta à home e rolam até a seção | ✓ |
| Nav simplificada | Só marca + link de volta | |

**User's choice:** Sim, nav completa (recomendado)
**Notes:** Todas as recomendações aceitas sem alteração.

---

## Favicon

| Option | Description | Selected |
|--------|-------------|----------|
| Glifo abstrato geométrico | Forma simples na paleta cyan, não depende do nome real | ✓ |
| Inicial/monograma | Provisório, precisaria trocar depois | |
| Você decide | Forma exata a critério do Claude | |

**User's choice:** Glifo abstrato geométrico (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Reaproveitar elemento existente | O ">_" do badge de disponibilidade da Hero | ✓ |
| Elemento novo | Forma dedicada desenhada só pro favicon | |

**User's choice:** Reaproveitar elemento existente (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| SVG + fallback PNG/ICO | Compatibilidade máxima | ✓ |
| Só SVG | Mais simples, mas pode falhar em contextos legados | |

**User's choice:** SVG + fallback PNG/ICO (recomendado)
**Notes:** Todas as recomendações aceitas sem alteração. Favicon final: glifo ">_" reaproveitado do badge da Hero.

---

## Ícones decorativos & alt text

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, aria-hidden em todos os decorativos | Evita duplicar anúncio de leitor de tela | ✓ |
| Só nos casos mais óbvios | Aplica seletivamente | |

**User's choice:** Sim, aria-hidden em todos os decorativos (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, aria-hidden="true" | Elementos puramente visuais/atmosféricos | ✓ |
| Não precisa | Já ignoradas na prática | |

**User's choice:** Sim, aria-hidden="true" (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Texto visível já basta | São spans com texto real, já lidos naturalmente | ✓ |
| Adicionar aria-label mais descritivo | Ex: "Tecnologia: Astro" | |

**User's choice:** Texto visível já basta (recomendado)

| Option | Description | Selected |
|--------|-------------|----------|
| Auditoria automatizada como gate | Segue padrão das Fases 1-3 (scripts/verify-*.mjs) | ✓ |
| Revisão manual é suficiente | Site pequeno, checagem visual cobre o escopo | |

**User's choice:** Auditoria automatizada como gate (recomendado)
**Notes:** Todas as recomendações aceitas sem alteração. Gate esperado para cobrir A11Y-03 e A11Y-04 em uma única checagem.

---

## Claude's Discretion

- Exact SVG markup/shape refinement of the `>_` favicon glyph and its crop/sizing for 16×16/32×32/apple-touch-icon variants
- Exact wording of the OG image tagline beyond reusing `site.brand`/`site.title`
- Technical mechanism for generating the static OG image (manual asset vs. build-time composition)
- Exact axe-core integration approach and which specific WCAG ruleset to gate on
- `robots.txt`/`sitemap.xml` content/config — standard `@astrojs/sitemap` output, no gray area raised
- Meta description copy per page — follows existing `site.ts` placeholder convention

## Deferred Ideas

None — discussion stayed within phase scope.
