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

**PAUSED at Task 2 — GitHub repo published and Vercel project linked, but the Vercel GitHub App has no repository-access grant to the newly created repo, so no webhook/deployment has fired. Needs a human action in GitHub's UI before Task 2 can complete.**

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

Blocked:
- Pushed `git commit --allow-empty -m "chore(deploy): trigger first production deploy"` (`2d48b31`) and, after ~4 minutes with no deployment appearing, a second retry push (`5555878`) — neither triggered a Vercel build
- Diagnostic evidence: `gh api repos/Felipe-Salles/portifolio-pessoal/hooks` → `[]` (no classic webhooks, expected for a GitHub-App-based integration); `gh api repos/Felipe-Salles/portifolio-pessoal/commits/main/check-runs` → `total_count: 0` after both pushes and repeated polling; `vercel ls --prod` / `vercel ls portifolio-pessoal` → "No deployments found under felipe-salles-projects"; `vercel project ls` shows `portifolio-pessoal` with Latest Production URL `--`, while this same Vercel team's other pre-existing projects (`ricertidoes`, `consulta-forense`, `santoscorrea`) all show live production URLs — confirming the team/CLI auth itself is fine and this is specific to the new repo's GitHub App access
- Root cause (high confidence): the Vercel GitHub App installation on this GitHub account is very likely scoped to "Only select repositories" rather than "All repositories". A brand-new repo created via `gh repo create` is not automatically added to that allow-list, so the App never receives the push webhook for it — `vercel link`/`vercel git connect` only write the link record on Vercel's side, they do not grant the GitHub App repository access
- This cannot be fixed via `gh`/`vercel` CLI: GitHub's `GET /user/installations` (and related app-management endpoints) reject classic PATs ("You must authenticate with an access token authorized to a GitHub App") — granting repository access to an installed GitHub App is a browser-only action in GitHub's UI

