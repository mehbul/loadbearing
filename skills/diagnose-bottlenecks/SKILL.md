---
name: diagnose-bottlenecks
description: Use when the app is slow, a page takes seconds, an endpoint times out, latency spiked under traffic, or someone asks "why is this slow?". Finds the actual bottleneck (database, external calls, CPU, payload) with evidence instead of guessing.
---
# diagnose-bottlenecks

Don't guess. Slowness almost always lives in one of a few places. Find which one with evidence, then fix that.

## Steps

1. **Measure before changing anything.** Where is the time going? Add timing around suspect sections, or read request traces / your host's dashboard / Supabase query insights. (No data? Run `add-observability` first.)
2. **Check the database** (the most common culprit):
   - Slow queries? Run `EXPLAIN ANALYZE`.
   - Missing index on a WHERE / JOIN / ORDER BY column (especially a foreign key)?
   - An **N+1** pattern (a query per item in a loop)?
   - `SELECT *` or unbounded result sets pulling huge rows / row-counts?
   - Exact `COUNT(*)` or heavy aggregates on a hot path?
3. **Check external / downstream calls:** a slow third-party API, LLM, or email provider on the request path. Awaited inline? Has a timeout?
4. **Check payload & CPU:** huge JSON responses, unoptimized images, big client bundles, CPU-heavy work in the handler.
5. **Check caching:** is the same expensive result recomputed every request?
6. **Confirm the fix** by measuring again — and, for load-related issues, by re-running `run-load-test`.

## Output
A short findings list: **suspected bottleneck**, the **evidence**, the **fix**, and which `rules/performance.md` rule it maps to.

## Honest framing
This narrows down the *most likely* cause from the evidence at hand. Confirm by measuring after the fix — a faster local run is not proof it's fixed under load.
