---
name: define-perf-targets
description: Use when someone asks "will it handle N users", "we're launching", "how much traffic can this take", or needs concrete performance goals. Turns a vague user count into hard targets — p95 latency, error rate, and requests-per-second — with capacity math, so a load test has a real pass/fail.
---
# define-perf-targets

Vague goals ("handle 10k users") can't pass or fail a test. This skill turns them into numbers a load test can check.

## Steps

1. **Gather inputs** (ask the user; use sensible defaults if they don't know):
   - Active users in the busy hour? (e.g. 10,000)
   - Requests one user makes in that period? (e.g. 5)
   - Length of the busy period, in minutes? (e.g. 60)
   - How spiky is traffic — peak vs. average multiplier? (default 3x)
   - Acceptable latency? (default p95 < 500 ms)
   - Acceptable error rate? (default < 1%)

2. **Do the capacity math** with the helper script:
   ```bash
   node skills/define-perf-targets/scripts/capacity.js --users 10000 --actions 5 --window 60 --peak 3 --p95 500 --errors 1
   ```
   It prints average req/s, **peak req/s** (design to this), suggested virtual users, and a ready-to-run k6 command.

3. **Write the targets down** so `run-load-test` and `write-perf-report` can use them:

   | Metric | Target |
   |--------|--------|
   | Peak load | _N_ req/s |
   | p95 latency | < _N_ ms |
   | Error rate | < _N_ % |
   | Test profile | _N_ virtual users, ramp + hold |

## Plain-language notes
- **p95 < 500 ms**: 95% of requests finish under half a second.
- **Peak load** is what matters — averages hide the spike that takes you down.
- These are *starting* targets. A checkout flow is stricter than a blog.

## Honest framing
Targets are assumptions about the future, not guarantees. They make a test meaningful; they don't predict reality. Revisit as you learn real traffic.
