---
name: run-load-test
description: Use when asked to "load test", "stress test", "see if it handles traffic", "simulate N users", or to verify performance under load. Runs a k6 test whose thresholds set the exit code — a real pass/fail, not a guess.
---
# run-load-test

Put the app under simulated traffic and get a **pass/fail** against your targets.
The k6 script's thresholds set its exit code, so the result is a real signal.

## Step 0 — Safety (do not skip)
- Only load-test a URL **you own or have explicit written permission to test.**
- **Never** point a load test at someone else's site or a third-party API — that is an attack.
- Prefer a staging/local environment. Loading production can cause a real outage.

## Steps
1. **Get targets.** Use `define-perf-targets` (or its `capacity.js`) for: target URL, p95 ms, error rate, virtual users (VUS), duration.
2. **Install k6** if needed:
   - macOS: `brew install k6`  ·  Windows: `choco install k6` or `winget install k6`  ·  Linux: see grafana.com/docs/k6.
   - Verify: `k6 version`.
3. **Run** the bundled script (thresholds → exit code):
   ```bash
   k6 run \
     -e TARGET_URL=http://localhost:3000 \
     -e VUS=20 -e DURATION=30s \
     -e P95_MS=500 -e ERROR_RATE=0.01 \
     skills/run-load-test/scripts/load-test.js
   ```
4. **Read the result:**
   - **Exit code 0** = thresholds held under this scenario.
   - **Non-zero** = a threshold was breached (p95 too high or too many errors) → FAIL. Note which.
5. **Next:** if it failed, use `diagnose-bottlenecks`; either way, summarize with `write-perf-report`.

## Customizing
Edit `scripts/load-test.js` to hit real endpoints (login, search, checkout), add headers/auth, or model a realistic mix of requests. A single GET is only a starting point.

## Honest framing
A passing load test shows the system held up **under the scenario you tested**, on the data and infra you tested. It does **not** prove it won't fail under different traffic, more data, or a flaky dependency. You found a limit and a data point — not a guarantee.
