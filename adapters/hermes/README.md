# Hermes (and other local / open-model agents) adapter

Hermes (Nous Research) — and any local or open-weight model driving an agent —
works with Loadbearing's portable content. Only auto-discovery is Claude-specific.

1. **Entry point:** have the agent read [`../../AGENTS.md`](../../AGENTS.md) — the manual index of every rule, skill, and script.
2. **Rules:** load [`../../rules/performance.md`](../../rules/performance.md) into its system prompt / context as always-follow guardrails.
3. **Write-time checks:** run `node hooks/perf-scan.js <files>` manually, as a pre-commit hook, or in CI (exit 1 = issues found). This needs only Node.js — no model API.
4. **Workflows:** the `skills/*/SKILL.md` files are plain step lists the agent can follow; the scripts run the same way regardless of which model is behind the agent.
