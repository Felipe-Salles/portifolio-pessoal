# Requirements: Portfólio Dev — Felipe Salles

**Defined:** 2026-09-02
**Core Value:** Um visitante consegue em poucos segundos entender quem é o dono do site, quais tecnologias domina, e ver projetos reais que provam isso — com o site carregando rápido e passando confiança técnica.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Hero

- [x] **HERO-01**: Visitante vê uma Hero section com identidade/título profissional (placeholder) e badge de disponibilidade
- [x] **HERO-02**: Visitante vê um CTA na Hero que leva para a seção de Projetos

### Dossier

- [x] **DOSS-01**: Visitante lê uma seção "Dossier" (bio/sobre mim) com texto descritivo (placeholder)
- [x] **DOSS-02**: Visitante vê stats resumidos ("System Specs": experiência, foco, domínio) ao lado da bio

### Tech Stack

- [x] **TECH-01**: Visitante vê a seção Tech Stack organizada em 3 categorias (Languages, Frameworks, Infrastructure)
- [x] **TECH-02**: Cada tecnologia é exibida como badge monospace, seguindo o padrão visual do DESIGN.md

### Projects

- [ ] **PROJ-01**: Visitante navega por uma seção de Projetos com cards renderizados a partir de uma Astro Content Collection
- [ ] **PROJ-02**: Cada card de projeto exibe nome, descrição, tags de tecnologia e link(s) live/repo quando existirem (placeholder entries no v1)
- [ ] **PROJ-03**: Links externos de projetos (live/repo) usam `rel="noopener noreferrer"`
- [ ] **PROJ-04**: Imagens de capa dos projetos são otimizadas via `astro:assets` (não servidas cruas de `public/`)

### Contact

- [x] **CONT-01**: Visitante vê uma seção de Contato com links diretos (email, GitHub, LinkedIn) — sem formulário funcional

### Layout & Design Fidelity

- [ ] **LAY-01**: Site é responsivo, com reflow mobile conforme DESIGN.md (margens 20px, grid adaptativo, background grid reduzido)
- [ ] **LAY-02**: Visual do site corresponde fielmente aos tokens do DESIGN.md (cores, tipografia, espaçamento, componentes) e ao protótipo em `screen.png`
- [x] **LAY-03**: Navegação (Nav) inclui logo, links das seções e botão "Connect", com toggle mobile funcional sem framework JS

### SEO & Descoberta

- [ ] **SEO-01**: Toda página tem `<title>` e `<meta name="description">` próprios via layout compartilhado
- [ ] **SEO-02**: Site tem tags Open Graph/Twitter Card com imagem de preview estática (1200×630, seguindo paleta Cyber-Sophisticate)
- [ ] **SEO-03**: Site gera `sitemap.xml` via `@astrojs/sitemap`
- [ ] **SEO-04**: Site tem `robots.txt` permitindo indexação
- [ ] **SEO-05**: Site tem favicon seguindo a paleta Cyber-Sophisticate
- [x] **SEO-06**: HTML declara `lang="pt-BR"` corretamente (não copiado do `lang="en"` do protótipo)

### Acessibilidade

- [x] **A11Y-01**: Navegação é semântica (`<nav>`, `<main>`, hierarquia de headings) e totalmente navegável por teclado, com estados de foco visíveis (glow cyan)
- [ ] **A11Y-02**: Site tem página 404 customizada reaproveitando layout e nav
- [ ] **A11Y-03**: Imagens e ícones têm alt text descritivo (não nomes de arquivo)
- [ ] **A11Y-04**: Contraste de texto/painéis glassmorphism passa em verificação WCAG (Lighthouse/axe) contra o fundo renderizado real, não apenas os valores de token do DESIGN.md

### Segurança

- [x] **SEC-01**: Site não carrega nenhuma origem externa de script/fonte/ícone (Tailwind, fontes e ícones compilados/self-hosted no build)
- [ ] **SEC-02**: Site envia CSP restritiva (`default-src 'self'` ou equivalente) via header HTTP real, verificada na URL de produção
- [ ] **SEC-03**: Site envia HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy e Permissions-Policy via `vercel.json`
- [ ] **SEC-04**: Nenhum segredo/API key exposto no client; `npm audit` sem vulnerabilidades conhecidas antes do deploy

### Deploy

- [ ] **DEPLOY-01**: Site publicado na Vercel, acessível via HTTPS
- [ ] **DEPLOY-02**: Headers de segurança (SEC-02, SEC-03) verificados contra a URL de produção real (não apenas `astro dev`/`preview` local)

## v2 Requirements

Deferred to future release (v1.x, após conteúdo real e validação do core). Tracked but not in current roadmap.

### Conteúdo Real

- **REAL-01**: Substituir nome/título/bio placeholder pelo conteúdo real de Felipe Salles
- **REAL-02**: Substituir projetos placeholder pelos projetos reais (nome, descrição, tech, links)
- **REAL-03**: Substituir links sociais placeholder pelos reais (GitHub, LinkedIn, email)

### Diferenciais

- **DIFF-01**: Slot de download de CV/currículo (placeholder até o PDF real existir)
- **DIFF-02**: Páginas de case study por projeto (detalhe expandido: problema, abordagem, resultado)
- **DIFF-03**: Dados estruturados (JSON-LD Person/WebSite/ItemList)
- **DIFF-04**: Astro View Transitions / micro-interações sutis (avaliar trade-off com CSP antes de adotar)
- **DIFF-05**: Analytics respeitando privacidade (Vercel Analytics)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Blog/artigos técnicos | Escopo enxuto decidido pelo usuário; adiciona manutenção de conteúdo contínua fora do foco do projeto |
| Formulário de contato funcional (com backend) | Usuário optou por links diretos para minimizar superfície de ataque e evitar backend/serviço de e-mail |
| i18n (PT/EN) | Usuário optou por PT-BR apenas no v1; dobraria manutenção de conteúdo antes do conteúdo real existir |
| Light/dark mode toggle | Conflita com o contrato de design DESIGN.md (tema único "Cyber-Sophisticate" já aprovado) |
| CMS externo (Contentful, Sanity, etc.) | Astro Content Collections já cobre a necessidade sem dependência hospedada externa |
| Chamadas client-side à API do GitHub (stats/contribution widget) | Conflita com a filosofia "islands só quando necessário"; se buscado depois, deve ser build-time, não client-side |
| Chat widgets / newsletter | Scripts de terceiros bloqueantes, sem payoff real para um portfólio pessoal |
| Frameworks pesados de animação/3D (Three.js, etc.) | Conflita com a decisão de simplicidade por padrão do stack Astro |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HERO-01 | Phase 3 | Complete |
| HERO-02 | Phase 3 | Complete |
| DOSS-01 | Phase 3 | Complete |
| DOSS-02 | Phase 3 | Complete |
| TECH-01 | Phase 3 | Complete |
| TECH-02 | Phase 3 | Complete |
| PROJ-01 | Phase 3 | Pending |
| PROJ-02 | Phase 3 | Pending |
| PROJ-03 | Phase 3 | Pending |
| PROJ-04 | Phase 3 | Pending |
| CONT-01 | Phase 3 | Complete |
| LAY-01 | Phase 3 | Pending |
| LAY-02 | Phase 3 | Pending |
| LAY-03 | Phase 2 | Complete |
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 4 | Pending |
| SEO-03 | Phase 4 | Pending |
| SEO-04 | Phase 4 | Pending |
| SEO-05 | Phase 4 | Pending |
| SEO-06 | Phase 2 | Complete |
| A11Y-01 | Phase 2 | Complete |
| A11Y-02 | Phase 4 | Pending |
| A11Y-03 | Phase 4 | Pending |
| A11Y-04 | Phase 4 | Pending |
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 5 | Pending |
| SEC-03 | Phase 5 | Pending |
| SEC-04 | Phase 5 | Pending |
| DEPLOY-01 | Phase 5 | Pending |
| DEPLOY-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30 (100%)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-02*
*Last updated: 2026-09-02 after roadmap creation (5 phases, 100% coverage)*
</content>
