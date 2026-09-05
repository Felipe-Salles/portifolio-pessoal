# Portfólio Dev — Felipe Salles

## What This Is

Site de portfólio pessoal para um desenvolvedor, construído em Astro, publicado em produção na Vercel com headers de segurança completos e SEO/acessibilidade validados. Exibe projetos, capacitações técnicas (stack) e redes sociais/contato, seguindo o design system "Cyber-Sophisticate" (dark, glassmorphism, acentos cyan) especificado em `Arquivos de design/`. Conteúdo ainda em placeholders — estrutura e infraestrutura (v1.0) estão prontas para receber o conteúdo real.

## Core Value

Um visitante (recrutador, cliente, colega) consegue em poucos segundos entender quem é o dono do site, quais tecnologias domina, e ver projetos reais que provam isso — com o site carregando rápido e passando confiança técnica (segurança básica correta).

## Requirements

### Validated

- [x] Visitante vê uma Hero section com identidade/título profissional e CTA para projetos — v1.0 (Phase 3)
- [x] Visitante lê uma seção "Dossier" com stats resumidos (experiência, foco, domínio) — v1.0 (Phase 3)
- [x] Visitante vê a Tech Stack organizada por categoria (linguagens, frameworks, infraestrutura) — v1.0 (Phase 3)
- [x] Visitante navega por uma seção de Projetos (cards via Astro Content Collection, tags, links live/repo) — v1.0 (Phase 3)
- [x] Visitante encontra uma seção de Contato com links diretos (sem formulário) — v1.0 (Phase 3)
- [x] Site é responsivo (mobile-first reflow conforme DESIGN.md) — v1.0 (Phase 2/3)
- [x] Conteúdo de projetos gerenciado via Astro Content Collections — v1.0 (Phase 1/3)
- [x] Site aplica security headers corretos (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) — v1.0 (Phase 5): verificado com gate próprio (`verify:deploy`) e scan independente (securityheaders.com, nota A) contra a URL de produção real
- [x] Site segue boas práticas gerais de segurança (sem segredos expostos, dependências sem vulnerabilidades conhecidas, HTTPS via Vercel) — v1.0 (Phase 5): gate de secret hygiene, `npm audit` 0 vulnerabilidades, HTTPS confirmado ao vivo
- [x] Site publicado e acessível via deploy na Vercel — v1.0 (Phase 5): repo público no GitHub, deploy contínuo via integração Git, sem `vercel deploy` manual
- [x] SEO básico (title/meta/OG/sitemap/robots/favicon) e acessibilidade (alt text, contraste WCAG, 404 customizada) — v1.0 (Phase 4)

### Active

- [ ] **REAL-01**: Substituir nome/título/bio placeholder pelo conteúdo real de Felipe Salles
- [ ] **REAL-02**: Substituir projetos placeholder pelos projetos reais (nome, descrição, tech, links)
- [ ] **REAL-03**: Substituir links sociais placeholder pelos reais (GitHub, LinkedIn, email)

### Out of Scope

- Blog/artigos técnicos — fora do escopo deste v1, focar no portfólio enxuto — usuário decidiu manter só as seções do protótipo
- Formulário de contato funcional (envio de e-mail via backend) — usuário optou por links diretos para minimizar superfície de ataque e complexidade
- Internacionalização (PT/EN) — usuário optou por português apenas neste v1
- CMS externo — conteúdo via Content Collections locais é suficiente
- Light/dark mode toggle — conflita com o tema único "Cyber-Sophisticate" já aprovado
- Chamadas client-side à API do GitHub — conflita com a filosofia "islands só quando necessário"
- Chat widgets / newsletter — sem payoff real para um portfólio pessoal
- Frameworks pesados de animação/3D — conflita com simplicidade do stack Astro

## Context

- **v1.0 shipped** (2026-09-05): site completo, seguro e em produção, mas com conteúdo 100% placeholder. Site em `https://portifolio-pessoal-seven-sigma.vercel.app`, repo público em `github.com/Felipe-Salles/portifolio-pessoal`, deploy contínuo via push para `main`.
- Stack: Astro 7 + Tailwind v4, ~6.500 LOC de código fonte, 9 gates automatizados (`npm run verify`) cobrindo tokens/shell/seções/schema/SEO/a11y/CSP-hash/secrets, mais 2 gates live-only (`verify:deploy`, `verify:live-csp`).
- Design já decidido e prototipado: `Arquivos de design/DESIGN.md` (design system "Cyber-Sophisticate" completo) e `Arquivos de design/code.html` (protótipo original).
- Conteúdo ainda 100% placeholder (nome, bio, projetos, links sociais) — essa é a lacuna central para o próximo milestone. Estrutura já centraliza tudo em `src/data/site.ts` + Content Collections (`src/content/projects/`), pronta para receber conteúdo real sem retrabalho de arquitetura.
- Candidatos para milestones futuros (hoje em `.planning/milestones/v1.0-REQUIREMENTS.md`, seção "v2 Requirements"): slot de CV/currículo, páginas de case study por projeto, dados estruturados JSON-LD, Vercel Analytics, View Transitions (avaliar trade-off com CSP antes de adotar).
- Nenhum débito técnico crítico pendente — os 2 defeitos achados na auditoria do milestone (Nav quebrado fora da home, footer mobile overflow) foram corrigidos e verificados ao vivo antes do fechamento.

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
| Astro como framework | Simplicidade por padrão, complexidade (islands) só quando necessário — preferência explícita do usuário | ✓ Good — zero framework JS ao longo de 5 fases, build pipeline simples e rápido |
| Content Collections para projetos | Editar/adicionar projetos sem tocar em componentes; nativo do Astro | ✓ Good — schema validado, gate de negative-probe confirma proteção contra entradas inválidas |
| Contato só por links diretos (sem formulário) | Minimiza superfície de ataque e elimina necessidade de backend/serviço de envio de e-mail | ✓ Good — zero superfície de ataque adicional, decisão mantida sem revisão |
| Deploy na Vercel | Suporte de primeira classe a Astro, HTTPS/CDN prontos, facilita configuração de security headers | ✓ Good — site ao vivo em produção, deploy contínuo via GitHub, 6 headers verificados, nota A no securityheaders.com |
| Sem blog no v1 | Escopo enxuto — usuário quer só as seções já prototipadas | ✓ Good — escopo mantido, nenhuma pressão para adicionar |
| PT apenas no v1 | Usuário optou por não fazer i18n agora | ✓ Good — sem necessidade identificada de mudar |
| Conteúdo real adiado para o final | Usuário quer validar estrutura/funcionalidade primeiro, alinhar conteúdo depois | ⚠️ Revisit — v1.0 provou a estrutura; conteúdo real (REAL-01/02/03) é agora o item central do próximo milestone |

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
*Last updated: 2026-09-05 after v1.0 milestone completion (5 phases shipped, 30/30 requirements validated)*
