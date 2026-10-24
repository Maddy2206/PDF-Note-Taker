# Project rules

@AGENTS.md

## Commands and layout

- `npm run dev` (port 3000), `npm run build`, `npm run start`, `npm run lint`. Type-check with `npx tsc --noEmit`. There are no automated tests.
- Client-only app, no backend. Routes in `app/`, UI in `components/`, logic and IndexedDB storage in `lib/`. Details: [docs/architecture.md](docs/architecture.md). User-facing overview: [README.md](README.md).
- `devpost/` and `agent/`, `.agents/`, `.claude/skills/` are hackathon-process material. `devpost/*.md` are historical snapshots and may not match the app; do not treat them as current.

## Documentation maintenance

Docs: `README.md` (overview, usage, limitations), `docs/architecture.md` (structure, data flow, storage), `FEATURES.md` (gitignored, detailed feature list; recreate from the code if missing), this file (agent rules). `AGENTS.md` is auto-generated; leave it.

- Before a substantial change, note which docs it could affect.
- After a feature, architecture, API, dependency, script or setup/deploy change, decide whether docs need updating and do it in the same task. Update:
  - `README.md` and `FEATURES.md` when user-facing features, setup, capabilities or structure change;
  - `docs/architecture.md` when components, data flow or the storage schema change;
  - `CLAUDE.md` when conventions, workflows or agent instructions change.
- Scale the effort: small fix = only the affected doc; new feature = README + FEATURES.md; architecture change = also `docs/architecture.md`; dependency/tooling change = verify commands and setup text; release or milestone = a broader consistency audit (parallel read-only subagents are fine here, not for trivial edits).
- For a full audit run `/docs-audit` (manual; nothing runs automatically on code changes).
- If no doc change is warranted, leave docs untouched. Never edit docs just to create activity.
- Derive docs from the code. Verify commands, paths, links and env var names against the repo (e.g. `package.json`, `ls`, a link-existence check) and never document planned work as implemented. Flag what you cannot verify.
- Documentation updates are part of "done". In the final response, list doc changes and remaining inconsistencies, and never claim a check passed unless you ran it.

## Git: the learner commits and pushes (mandatory)

- **Never commit any code.** Do not run `git commit`, `git commit --amend`, `git add` for the purpose of committing, or any other command that creates a commit. This applies in every mode and to every skill or workflow (including the `5-build` "verify and commit each step" step, parallel agents, and subagents), and no earlier approval overrides it.
- **Never push**, create branches or tags for publishing, or open pull requests. The learner commits and pushes to GitHub themselves.
- Leave changes in the working tree. When a step is finished and verified, say what changed and which files, and suggest a commit message for the learner to use if they want one.
- Read-only git commands (`git status`, `git diff`, `git log`) are fine.
- Instruct any subagent you launch to follow this rule too.

## Never disturb the learner's dev server (mandatory)

- Never kill, restart or stop a `next dev` / `next-server` process you did not start yourself. Never use `pkill` or `pgrep ... | xargs kill` on `next`.
- Never run `npm run build` into the default `.next` folder while a dev server may be running: it overwrites the dev server's files. Build with `NEXT_DIST_DIR=.next-check npm run build` and delete `.next-check` afterwards.
- To test in a browser, start your own server on another port with its own folder (for example `NEXT_DIST_DIR=.next-test npx next dev -p 3100`), remember its PID, and stop only that PID when finished. Otherwise use the learner's server on port 3000 as is (it hot-reloads).
