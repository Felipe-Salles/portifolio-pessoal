# Phase 5: Security Hardening & Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 5-Security Hardening & Deploy
**Areas discussed:** Domínio de produção, Fluxo de deploy, HSTS, Rollout do CSP

---

## Domínio de produção

| Option | Description | Selected |
|--------|-------------|----------|
| Subdomínio Vercel (*.vercel.app) | Zero configuração extra, HTTPS automático, pronto para deploy imediato. `astro.config.mjs` `site:` aponta pra essa URL. Domínio customizado pode ser adicionado depois sem retrabalho. | ✓ |
| Domínio customizado já disponível | Usuário já possui um domínio (ex: felipesalles.dev) e quer configurá-lo agora no Vercel + apontar o DNS. | |

**User's choice:** Subdomínio Vercel (*.vercel.app)
**Notes:** Nenhum domínio customizado disponível ainda; `site:` em `astro.config.mjs` (atualmente placeholder `.example`) será atualizado para o subdomínio real assim que o projeto Vercel existir.

---

## Fluxo de deploy

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub + deploy contínuo | Push na main = deploy automático na Vercel, preview deployments em PRs/branches. Fluxo padrão do Vercel. Requer criar/conectar um repo no GitHub (nenhum remote configurado ainda). | ✓ |
| CLI manual (vercel deploy --prod) | Publica direto do terminal, sem depender de um repo remoto no GitHub. Mais simples agora, mas cada atualização futura exige rodar o deploy manualmente. | |

**User's choice:** GitHub + deploy contínuo (recomendado)
**Notes:** `git remote -v` confirma que não há remote configurado ainda — criar/conectar o repo GitHub é um passo pré-requisito para este plano.

---

## HSTS

| Option | Description | Selected |
|--------|-------------|----------|
| HSTS padrão, sem preload | `max-age` + `includeSubDomains`, sem `preload`. Ainda força HTTPS após a primeira visita. | ✓ |
| Com preload | Site nunca é acessível via HTTP em nenhum navegador atualizado, mesmo na primeira visita — exige domínio definitivo e é trabalhoso reverter. | |

**User's choice:** HSTS padrão, sem preload (recomendado para v1)
**Notes:** Preload adiado até o domínio final (se houver) estar estável — consistente com a decisão de usar o subdomínio Vercel por ora.

---

## Rollout do CSP

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce direto | Site 100% self-hosted desde a Fase 1 (SEC-01, verificado por script), risco baixo de quebrar produção. Vai direto para o header real. | ✓ |
| Report-Only primeiro | Roda em modo relatório antes de travar de verdade — mais seguro para sites complexos, mas etapa extra sem necessidade real aqui. | |

**User's choice:** Enforce direto (recomendado)
**Notes:** Nenhuma origem externa existe no site (confirmado pelo gate `verify-no-external-origins.mjs` desde a Fase 1); nenhuma etapa intermediária necessária.

---

## Claude's Discretion

- Lista exata de diretivas CSP além de `default-src 'self'` (script-src, style-src, img-src, font-src, frame-ancestors, object-src, base-uri) — detalhe técnico para pesquisa/planejamento.
- Mecanismo de emissão da CSP (API nativa do Astro com auto-hash vs. `vercel.json` manual) — detalhe de implementação, não escolha do usuário.
- Lista específica de features do Permissions-Policy (câmera/microfone/geolocalização/etc.) — postura padrão de negar tudo, sem ambiguidade real.
- Abordagem de remediação de vulnerabilidades do `npm audit`, se encontradas — tratado por achado, no momento da execução.
- Nome/visibilidade exata do repositório GitHub a criar — sem preferência forte levantada; confirmar na execução se ambíguo.

## Deferred Ideas

Nenhuma nova capacidade foi proposta fora do escopo da fase. Domínio customizado e HSTS `preload` foram considerados e explicitamente adiados para depois que o domínio estiver definitivo — são decisões de sequenciamento dentro da própria Fase 5, não ideias que pertencem a outra fase.
