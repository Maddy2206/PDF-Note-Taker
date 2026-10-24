---
description: Clean up the repo with the four specialist cleanup agents (manual, never commits)
argument-hint: [path or scope, e.g. lib/ or "last 20 commits"]
---

Run a behavior-preserving repo cleanup. Scope: $ARGUMENTS (if empty: files changed in the last 20 commits; if that is empty, the whole repo).

1. **Protect user work.** Run `git status --short`. Files with uncommitted changes are read-only for every agent. List them in the final report.
2. **Baseline.** Run `npx tsc --noEmit`, `npx eslint .` and `NEXT_DIST_DIR=.next-check npm run build`, then delete `.next-check`. Record real results.
3. **Audit (parallel, audit-only).** Launch `dead-code-auditor`, `duplication-consolidator`, `modularity-simplifier` and `comments-imports-tidier` in one message, each told "audit only" with the scope and the read-only file list. Include the git rules: never commit/push, never touch `next dev`.
4. **Plan.** Merge findings. Keep only high-confidence, behavior-preserving items. Assign each file to exactly one agent so no two agents edit the same file.
5. **Apply.** Run the editing agents (sequentially if their files could interact) with their assigned files only.
6. **Review.** Read every diff yourself. Re-run tsc, eslint and the isolated build. Revert any change that breaks a check or that you are unsure about. Delete `.next-check`.
7. **Report.** Changes by file, checks with actual results (say so if a check could not run), uncertain code deliberately retained, remaining opportunities, and a suggested commit message. Do not commit or push.
