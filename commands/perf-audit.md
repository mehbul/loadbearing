---
description: Static performance audit of the project against loadbearing's rules (no traffic).
argument-hint: "[optional: path or area to focus on]"
---
Run a static performance audit using loadbearing.

Scope: $ARGUMENTS (default: the whole project)

Steps:
1. Read `rules/performance.md`.
2. Scan the relevant source files with `node hooks/perf-scan.js <files>` and review findings.
3. Also check the judgment-only rules (connection pooling, caching, rate limiting, indexes) that the hooks cannot see.
4. Report findings grouped by severity, each with the plain-language "why at scale" and a concrete fix. Do not claim the app is "safe" — report what you checked and what you found.
