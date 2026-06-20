---
description: Review the current diff for performance regressions before it ships.
argument-hint: "[optional: base branch, default main]"
---
Review the current changes for performance regressions using the loadbearing **perf-reviewer** agent.

Base: $ARGUMENTS (default: main)

Steps:
1. Get the diff (e.g. `git diff <base>...HEAD`).
2. Dispatch the `perf-reviewer` agent on the changed files.
3. Report only issues introduced or worsened by this diff, each mapped to a rule in `rules/performance.md`, with a fix. Be honest about what static review can and cannot catch.
