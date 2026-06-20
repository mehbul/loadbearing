# Codex adapter

Codex doesn't auto-discover Claude Code plugins, but **all the valuable content is
plain text and portable**. Use it manually:

1. **Entry point:** tell Codex to read [`../../AGENTS.md`](../../AGENTS.md) — the manual index of every rule, skill, and script.
2. **Always-follow rules:** point it at [`../../rules/performance.md`](../../rules/performance.md).
3. **Write-time checks:** run the detector directly — `node hooks/perf-scan.js <files>` — manually or in a pre-commit hook / CI step (exit 1 = issues found).
4. **Workflows:** the `skills/*/SKILL.md` files are imperative step lists Codex can follow as-is; the scripts (`capacity.js`, `load-test.js`) run the same way.

Nothing here is Claude-specific except auto-discovery.
