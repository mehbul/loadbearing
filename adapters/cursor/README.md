# Cursor adapter

Use loadbearing's portable content inside Cursor:

1. **Rules:** add the contents of [`../../rules/performance.md`](../../rules/performance.md) to your Cursor Rules (Project Rules) so they apply while you code.
2. **Write-time checks:** Cursor hooks vary by version; the reliable path is to run `node hooks/perf-scan.js <files>` as a pre-commit hook or CI step (exit 1 = issues found).
3. **Workflows:** open any `skills/*/SKILL.md` and ask Cursor to follow it; run `capacity.js` / `load-test.js` the same way as anywhere.
4. **Index:** [`../../AGENTS.md`](../../AGENTS.md) lists everything in one place.
