# Phase 1: Foundation & Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 1-Foundation & Design System
**Areas discussed:** Estratégia de fontes, Arquitetura de dados/placeholder, Estilo do conteúdo placeholder, Schema da Content Collection de projetos

---

## Estratégia de fontes

| Option | Description | Selected |
|--------|-------------|----------|
| @fontsource/* | Pacotes npm com fontes já embutidas; zero rede em qualquer momento, build 100% offline-reproduzível | ✓ |
| Astro Fonts API + fontProviders.google() | API nativa do Astro 6/7; baixa e otimiza fontes durante `astro build` (runtime final self-hosted, mas build precisa de rede) | |

**User's choice:** @fontsource/* (Recomendado)
**Notes:** Nenhuma dúvida adicional — decisão fechada na primeira pergunta.

---

## Arquitetura de dados/placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Arquivo de config tipado | `src/data/site.ts` tipado exportando identidade, bio, stats, tech stack, links sociais num objeto único | ✓ |
| Content Collections separadas por seção | Uma collection Astro com schema Zod para cada bloco (profile, techStack, socials) | |

**User's choice:** Arquivo de config tipado (Recomendado)
**Notes:** Content Collections seguem reservadas só para `projects` (lista real, múltiplas entradas).

---

## Estilo do conteúdo placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder óbvio e rotulado | Texto claramente marcado como provisório, ex: `[Seu Nome Aqui]`, `PLACEHOLDER — bio a definir` | ✓ |
| Placeholder plausível/realista | Texto no estilo do próprio protótipo (ex: "SYSTEM_ARCHITECT"), fica bonito em prints mas risco de parecer conteúdo real | |

**User's choice:** Placeholder óbvio e rotulado (Recomendado)
**Notes:** Evita risco de "Lorem ipsum"/conteúdo fictício ser publicado por engano.

---

## Schema da Content Collection de projetos

| Option | Description | Selected |
|--------|-------------|----------|
| featured (destaque) | Boolean opcional para marcar projetos em destaque | ✓ |
| order (ordem manual) | Número opcional para controlar ordem de exibição manualmente | ✓ |
| coverImage obrigatória já na Fase 1 | Campo obrigatório com placeholder real em /src/assets desde já | |
| Nenhum extra — só o mínimo exigido | Ficar só com título, descrição, tags, links live/repo | |

**User's choice:** featured + order (ambos selecionados)
**Notes:** Segunda pergunta de follow-up sobre `coverImage`:

| Option | Description | Selected |
|--------|-------------|----------|
| Opcional, com fallback | Campo opcional; card sem imagem cai num placeholder visual genérico | ✓ |
| Obrigatório já na Fase 1 | Todo projeto precisa de imagem de capa desde a primeira entrada | |

**User's choice (coverImage):** Opcional, com fallback (Recomendado)

---

## Claude's Discretion

- Exato subset de pesos (`weights`) a instalar de cada `@fontsource` (mapeado do DESIGN.md/code.html: Lexend 400/500/600/700/800, Inter 400/500/600/700, JetBrains Mono 400/500/700).
- Forma/wording exata do placeholder visual genérico de fallback para `coverImage`.
- Gerenciador de pacotes e demais escolhas puramente técnicas de setup não cobertas acima.

## Deferred Ideas

None — discussion stayed within phase scope.
