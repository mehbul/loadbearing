# Claude Code adapter (the default)

loadbearing is a native Claude Code plugin — the manifest lives at
`.claude-plugin/plugin.json` and everything is auto-discovered.

## Install (recommended: as a plugin)
```
/plugin marketplace add <path-or-git-url-to-this-repo>
/plugin install loadbearing@loadbearing
```
Restart when prompted. Skills, commands (`/loadtest`, `/perf-audit`, `/perf-review`),
the `perf-reviewer` agent, and the write-time `hooks` all load automatically.

## Install (fallback: into one project)
```
./install.sh <your-project-dir>      # or:  .\install.ps1 <your-project-dir>
```
Copies skills/commands/agents into `<project>/.claude/` and prints the one hook
line to add to `.claude/settings.json`.

## Verify a clean clone
```
./install.sh check                   # or:  .\install.ps1 check
```
Checks required files, validates JSON, and runs the hook detector tests.

**Requires Node.js** on PATH (for the hooks) and **k6** for load tests (see `run-load-test`).
