---
description: Run a k6 load test against a URL and report pass/fail against thresholds.
argument-hint: "[target-url] [optional: vus, duration]"
---
Use the loadbearing **run-load-test** skill to load-test the target below.

Target / request: $ARGUMENTS

Rules:
- Only load-test a URL the user owns or has explicit permission to test. If unsure, ask.
- Define thresholds first (p95 latency, error rate) so the run produces a real pass/fail.
- End by reporting the k6 exit code and a short, honest summary of what was and was not tested.
