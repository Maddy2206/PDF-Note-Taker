# Project rules

@AGENTS.md

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
