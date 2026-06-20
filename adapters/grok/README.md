# Grok adapter

Grok (xAI) works with Loadbearing's portable content — nothing here is
Claude-specific except auto-discovery.

1. **Entry point:** have Grok read [`../../AGENTS.md`](../../AGENTS.md) — the manual index of every rule, skill, and script.
2. **Rules:** point it at [`../../rules/performance.md`](../../rules/performance.md) as always-follow guardrails.
3. **Write-time checks:** run `node hooks/perf-scan.js <files>` manually, as a pre-commit hook, or in CI (exit 1 = issues found).
4. **Workflows:** the `skills/*/SKILL.md` files are imperative step lists Grok can follow as-is; the scripts (`capacity.js`, `load-test.js`) run the same way everywhere.
