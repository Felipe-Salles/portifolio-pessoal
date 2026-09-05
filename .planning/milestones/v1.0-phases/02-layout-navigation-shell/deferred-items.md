# Deferred Items — Phase 02

## `npm run verify:tokens` fails in this worktree — pre-existing, out of scope

**Found during:** 02-01 Task 1 verification.

**Symptom:** `npm run verify:tokens` exits with `Arquivos de design/DESIGN.md not found — cannot derive expected token values`.

**Root cause:** `Arquivos de design/` (the design source-of-truth folder `scripts/verify-design-tokens.mjs` reads) is untracked in git on the base branch (confirmed via `git log --all -- "Arquivos de design"` returning nothing, and `git status --short` on the base commit showing `?? Arquivos de design/`). `git worktree add` only checks out committed content, so this untracked folder does not exist inside the isolated worktree this plan executed in — it is present in the main working copy but not in the worktree's filesystem.

**Scope:** Not caused by any change in 02-01-PLAN.md (Task 1 only touched `src/styles/global.css`, `scripts/verify-shell.mjs`, `package.json`; Task 2 only touched `src/components/Nav.astro`, `src/layouts/Base.astro`, `src/pages/index.astro`). Per SCOPE BOUNDARY in the executor's deviation rules, pre-existing failures in unrelated files are out of scope for this plan and are not auto-fixed here.

**Evidence this plan's own changes are sound:** `npm run verify:sec01` (`external_refs=0`), `npm run verify:shell`, `npm run build`, and `npx astro check` all pass in the same worktree. The two new CSS primitives added in Task 1 are plain rule blocks appended after `.btn-primary:hover`, outside the `@theme static` block `verify:tokens` diffs — they cannot be the cause of this failure.

**Recommended follow-up:** Commit `Arquivos de design/` to the repository (outside this plan's scope) so it survives into every future worktree, or adjust `scripts/verify-design-tokens.mjs` to tolerate its absence gracefully. Flagging for the orchestrator / next phase-transition review.
