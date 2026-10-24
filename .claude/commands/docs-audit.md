---
description: Audit docs against the code with parallel read-only agents, then fix them (manual, never commits)
argument-hint: [scope, e.g. README.md or "after the export feature"]
---

Audit and repair the documentation. Scope: $ARGUMENTS (if empty: README.md, FEATURES.md, docs/architecture.md and CLAUDE.md).

1. **Protect user work.** Run `git status --short`. Do not overwrite unrelated uncommitted changes.
2. **Audit (parallel, read-only).** Launch Explore agents in one message: (a) architecture and setup (directories, entry points, package.json scripts, env vars read in code, storage schema), (b) features and limitations (routes, components, `lib/`), (c) doc consistency (contradictions, wrong commands, broken relative links, stale files). Tell each: read-only, derive facts from code, never expose secrets, never commit or touch `next dev`.
3. **Plan.** Merge findings. Separate verified facts from uncertain ones. Decide which doc is the source of truth for each fact (see the Documentation maintenance section in `CLAUDE.md`).
4. **Apply.** Edit the docs yourself (one writer, no overlapping edits). Do not change application code. Do not document planned work as implemented.
5. **Verify.** Check relative links resolve, and that commands, paths and env var names exist. Only report checks you actually ran.
6. **Report.** Files audited and changed, inaccuracies fixed, checks with real results, unresolved questions, and a suggested commit message. Do not commit or push.
