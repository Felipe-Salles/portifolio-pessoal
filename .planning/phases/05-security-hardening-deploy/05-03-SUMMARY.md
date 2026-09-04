---
phase: 05-security-hardening-deploy
plan: 03
subsystem: infra
tags: [github, vercel, deploy, ci-cd, dns, production]

# Dependency graph
requires:
  - phase: 05-security-hardening-deploy
    provides: "05-01: vercel.json headers contract, verify:deploy gate (RED); 05-02: green audit:ci, verify:secrets gate"
provides:
  - "Public GitHub repo (origin) with main as default branch"
  - "Vercel project Git-connected for continuous deployment"
  - "Live production URL serving all six SEC-02/SEC-03 headers"
  - "astro.config.mjs site: pointed at the real production origin"
affects: [05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Continuous deployment via Vercel Git integration (push to main), never manual vercel deploy --prod"

key-files:
  created: []
  modified:
    - astro.config.mjs
    - public/og-image.png

key-decisions: []

requirements-completed: [DEPLOY-01, DEPLOY-02, SEC-02, SEC-03]

completed: 2026-09-04
---

# Phase 5 Plan 3: Publish to GitHub, Connect Vercel, Go Live Summary

**Portfolio is live at `https://portifolio-pessoal-seven-sigma.vercel.app` — GitHub-connected continuous deployment, all six SEC-02/SEC-03 headers verified on the real production URL (root + 404 probe), and the `astro.config.mjs` `site:` config now points at the real origin.**

## Production URL

**`https://portifolio-pessoal-seven-sigma.vercel.app`**

Note: the "clean" `https://portifolio-pessoal.vercel.app` subdomain was already taken by an unrelated, pre-existing Vercel deployment on another account (confirmed via `curl -sI` — it returns `X-Vercel-Error: DEPLOYMENT_NOT_FOUND` with an HSTS header carrying `preload`, a config this project's `vercel.json` never sets, proving it belongs to a different project entirely). Vercel therefore assigned the suffixed alias above as this project's actual production domain. This is still the "default Vercel-assigned subdomain" per D-01 (no custom domain purchased/pointed) — just not byte-identical to the project name, which the plan's research had flagged as an assumption to confirm at execution time, not a locked guarantee.

## Task 1 Decision (recorded verbatim, answered by the user via the orchestrator)

- **Repo name:** `portifolio-pessoal`
- **Visibility:** `public`
- **Branch rename `master` -> `main`:** APPROVED (rename before publishing)

No `gh` or `vercel` command was executed during Task 1.

## Task 2 Progress So Far

Completed:
- `git branch -M main` — local branch renamed from `master` to `main`
- `gh repo create portifolio-pessoal --public --source=. --remote=origin --push` — repo created and pushed. Confirmed: `git remote get-url origin` → `https://github.com/Felipe-Salles/portifolio-pessoal.git`; `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` → `main`; `gh repo view --json visibility --jq .visibility` → `PUBLIC`
- `vercel link --yes --project portifolio-pessoal` — created Vercel project `felipe-salles-projects/portifolio-pessoal` and auto-connected the GitHub repository (CLI printed "Connecting GitHub repository... Connected"); this also appended `.vercel` and `.env*` to `.gitignore` (committed separately, `3b25271`)
- `vercel git connect` — ran explicitly per the plan; CLI reported "Felipe-Salles/portifolio-pessoal is already connected to your project" (idempotent, confirms the Vercel-side link record exists)
- `.vercel/project.json` exists locally (`projectId=prj_wAC8gxXmQePiPkxl8GlXur4fEKgN`, `orgId=team_J7rCzdvtFEpWYOgeVz1mEi79`, `projectName=portifolio-pessoal`); `git status --short` confirms `.vercel/` stays untracked

Initially blocked, then resolved:
- Pushed `git commit --allow-empty -m "chore(deploy): trigger first production deploy"` (`2d48b31`) and, after ~4 minutes with no deployment appearing, a second retry push (`5555878`) — neither triggered a Vercel build
- Diagnostic evidence at the time: `gh api repos/Felipe-Salles/portifolio-pessoal/hooks` → `[]` (no classic webhooks, expected for a GitHub-App-based integration); `gh api repos/Felipe-Salles/portifolio-pessoal/commits/main/check-runs` → `total_count: 0` after both pushes and repeated polling; `vercel ls --prod` / `vercel ls portifolio-pessoal` → "No deployments found under felipe-salles-projects"; `vercel project ls` showed `portifolio-pessoal` with Latest Production URL `--`, while this same Vercel team's other pre-existing projects (`ricertidoes`, `consulta-forense`, `santoscorrea`) all showed live production URLs — isolating the fault to this new repo's GitHub App access, not CLI auth or team config
- Root cause: the Vercel GitHub App installation was scoped to "Only select repositories" and the brand-new repo was not yet in that allow-list — `vercel link`/`vercel git connect` only write Vercel's own link record, they do not grant the GitHub App repository access. This required the user to grant access in GitHub's UI (https://github.com/settings/installations), which could not be scripted via `gh`/`vercel` CLI (GitHub's app-installation-management REST endpoints reject classic PATs)
- **Resolved:** user confirmed the GitHub App's repository access was set to "All repositories". A fresh trigger push (`git commit --allow-empty -m "chore(deploy): retrigger production deploy"`, `d7dab13`) was made; `gh api .../check-runs` still showed `0` after ~2 minutes of polling (evidently the App's access grant took a short propagation delay to take effect on GitHub's webhook-delivery side, or the check-runs API specifically lagged behind the deployment itself), but `vercel ls --prod` / `vercel project ls` / `vercel inspect` directly confirmed **two** Ready production deployments had actually landed — one from the `d7dab13` push (~10s build) and one from an earlier queued push that had apparently been retroactively picked up once access was granted (~18s build, 54min-old timestamp at time of check). No manual `vercel deploy` command was ever run — both deployments were Git-integration-triggered, satisfying D-02 and the acceptance criteria's "triggered by the push, not a manual `vercel deploy --prod`" requirement.
- `curl -sI https://portifolio-pessoal-seven-sigma.vercel.app` → `HTTP/1.1 200 OK` with all six headers present in the raw response
- `npm run verify:deploy https://portifolio-pessoal-seven-sigma.vercel.app` → exit 0, `DEPLOY SUMMARY url=https://portifolio-pessoal-seven-sigma.vercel.app paths=2 root_status=200 notfound_status=404 csp=ok hsts=ok xfo=ok xcto=ok refpol=ok permpol=ok violations=0` — the DEPLOY-02 gate authored RED in plan 05-01 is now GREEN, on the first real deploy, with **no remediation ladder needed** (rung 0: the hand-authored `vercel.json` delivered every header correctly out of the box; `staticHeaders: true` stayed enabled in `astro.config.mjs`, unchanged, alongside it)

## Task 2 Acceptance Criteria — confirmed

- `git remote get-url origin` → `https://github.com/Felipe-Salles/portifolio-pessoal.git`
- `git rev-parse --abbrev-ref HEAD` → `main`; `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` → `main`
- `gh repo view --json visibility --jq .visibility` → `PUBLIC` (matches Task 1's choice)
- `.vercel/project.json` exists; `git status --short` shows no `.vercel` entry
- Vercel project is Git-connected; both production deployments were triggered by pushes to `main`, not `vercel deploy --prod`
- `curl -sI <production-url>` → `200` over `https://`
- `npm run verify:deploy <production-url>` exits 0, `violations=0`, all six `=ok`, covering both `/` and the `/__gsd-404-probe` path
- Exact production URL recorded verbatim above
- Remediation ladder: not needed — rung 0 (hand-authored `vercel.json`, `staticHeaders: true` unchanged) worked on the first deploy

