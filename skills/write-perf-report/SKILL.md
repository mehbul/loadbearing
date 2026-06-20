---
name: write-perf-report
description: Use after a load test or audit to produce a clear, honest, shareable performance report. Use when asked for "a perf report", "the results", "a summary for the team", or "is it ready to ship?".
---
# write-perf-report

Turn raw results into an honest, shareable report. Use the fixed template so every
report has the same shape — and the same honesty.

## Steps
1. Gather: the targets (`define-perf-targets`), the load-test output (`run-load-test`), and any findings (`diagnose-bottlenecks` / `/perf-audit`).
2. Fill in `references/report-template.md` section by section. Do not delete the caveat section.
3. Use real numbers. If something wasn't tested, say "not tested" — never imply coverage you don't have.

## The one rule
The report must make clear **what was tested and what was not**, and must never claim the system "won't fail" or is "guaranteed" to handle anything. We report limits found and risk reduced.

See the template: [references/report-template.md](references/report-template.md).
