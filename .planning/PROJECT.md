# Portfólio Dev — Felipe Salles

## What This Is

Site de portfólio pessoal para um desenvolvedor, construído em Astro, para exibir projetos, capacitações técnicas (stack) e redes sociais/contato. Segue o design system "Cyber-Sophisticate" (dark, glassmorphism, acentos cyan) já especificado e prototipado em `Arquivos de design/`.

## Core Value

Um visitante (recrutador, cliente, colega) consegue em poucos segundos entender quem é o dono do site, quais tecnologias domina, e ver projetos reais que provam isso — com o site carregando rápido e passando confiança técnica (segurança básica correta).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Visitante vê uma Hero section com identidade/título profissional e CTA para projetos
- [ ] Visitante lê uma seção "Dossier" (sobre mim / bio) com stats resumidos (experiência, foco, domínio)
- [ ] Visitante vê a Tech Stack organizada por categoria (linguagens, frameworks, infraestrutura)
- [ ] Visitante navega por uma seção de Projetos (cards com nome, descrição, tags de tech, links live/repo quando existirem)
- [ ] Visitante encontra uma seção de Contato com links diretos (email, GitHub, LinkedIn — sem formulário)
- [ ] Site é responsivo (mobile-first reflow conforme DESIGN.md: margens 20px, grid adaptativo)
- [ ] Site aplica security headers corretos (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [ ] Site segue boas práticas gerais de segurança (sem segredos expostos, dependências sem vulnerabilidades conhecidas, HTTPS via Vercel)
- [ ] Conteúdo de projetos gerenciado via Astro Content Collections (Markdown/MDX)
- [ ] Site publicado e acessível via deploy na Vercel

### Out of Scope

- Blog/artigos técnicos — fora do escopo deste v1, focar no portfólio enxuto — usuário decidiu manter só as seções do protótipo
- Formulário de contato funcional (envio de e-mail via backend) — usuário optou por links diretos para minimizar superfície de ataque e complexidade
- Internacionalização (PT/EN) — usuário optou por português apenas neste v1
- CMS externo — conteúdo via Content Collections locais é suficiente

## Context

- Design já decidido e prototipado: `Arquivos de design/DESIGN.md` (design system "Cyber-Sophisticate" completo — cores, tipografia, espaçamento, componentes) e `Arquivos de design/code.html` (protótipo estático em HTML + Tailwind CDN, com screenshot em `screen.png`).
- O protótipo usa conteúdo fictício (nome "SYSTEM_ARCHITECT", projetos fake "Neural Engine"/"Vault-X"/"Omni-Stream", links mortos) — serve apenas de referência visual e estrutural, não de conteúdo final.
- Seções do protótipo a preservar: Nav (logo + Dossier/Stack/Projects/Contact + botão Connect), Hero, Dossier (bio + System Specs), Tech Stack (3 colunas: Languages/Frameworks/Infrastructure), Projects (grid de cards), Contact (CTA com ícones sociais), Footer.
- Usuário decidiu adiar o conteúdo real (nome, bio, stack real, projetos reais, links sociais reais) para alinhar ao final do projeto — construção inicial segue com placeholders claramente identificáveis, fáceis de substituir depois (idealmente centralizados em Content Collections / dados de configuração, não espalhados pelo markup).
- Greenfield: nenhum código de aplicação existe ainda, apenas os arquivos de design.

## Constraints

- **Tech stack**: Astro — escolhido pelo usuário por manter simplicidade, adicionando complexidade (ilhas de interatividade, frameworks JS) só quando necessário
- **Deploy**: Vercel — escolhido para hospedagem, CDN e HTTPS
- **Idioma**: Português (PT-BR) apenas neste v1
- **Segurança**: Deve cobrir os princípios básicos de cybersegurança — no mínimo security headers bem configurados (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) e boas práticas gerais (sem segredos no client, dependências auditadas)
- **Design**: Deve seguir fielmente `Arquivos de design/DESIGN.md` (paleta, tipografia, espaçamento, componentes) — não é uma decisão em aberto, é um contrato de design já aprovado
- **Conteúdo**: Placeholders neste momento — estrutura deve facilitar substituição posterior sem retrabalho de arquitetura

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro como framework | Simplicidade por padrão, complexidade (islands) só quando necessário — preferência explícita do usuário | — Pending |
| Content Collections para projetos | Editar/adicionar projetos sem tocar em componentes; nativo do Astro | — Pending |
| Contato só por links diretos (sem formulário) | Minimiza superfície de ataque e elimina necessidade de backend/serviço de envio de e-mail | — Pending |
| Deploy na Vercel | Suporte de primeira classe a Astro, HTTPS/CDN prontos, facilita configuração de security headers | — Pending |
| Sem blog no v1 | Escopo enxuto — usuário quer só as seções já prototipadas | — Pending |
| PT apenas no v1 | Usuário optou por não fazer i18n agora | — Pending |
| Conteúdo real adiado para o final | Usuário quer validar estrutura/funcionalidade primeiro, alinhar conteúdo depois | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-03 after Phase 4 (seo-accessibility-polish) completion*
