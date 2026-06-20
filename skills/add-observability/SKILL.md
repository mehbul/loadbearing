---
name: add-observability
description: Use when you can't see what your app is doing in production, before a launch, or after a slow incident with no data to explain it. Wires up latency, error-rate, and slow-query visibility so the next problem is diagnosable in minutes, not hours.
---
# add-observability

You can't fix what you can't see. Before chasing performance, make sure the signals exist.

## The four signals to capture
1. **Latency** — p50 / p95 / p99 per route. (p95 is the one that bites.)
2. **Error rate** — % of requests failing (5xx, timeouts).
3. **Throughput** — requests/sec, so you can correlate slowness with load.
4. **Slow database queries** — which queries, how often, how slow.

## How (Next.js + Supabase, minimal first)
- **Host dashboard:** Vercel/your platform already reports latency, error rate, and traffic per route — turn it on and know where it is.
- **Supabase:** enable the **Query Performance / slow query** insights in the dashboard; check `pg_stat_statements` for the worst queries.
- **App logs:** log request duration + status for each API route (structured: route, ms, status). Even a one-line logger beats nothing.
- **When you outgrow that:** add an error/perf tool (e.g. Sentry) and, if needed, OpenTelemetry traces. Don't start here — start with the dashboards you already have.

## What "good" looks like
You can answer, without redeploying: *which route is slow, how slow at p95, how often it errors, and which query is behind it.*

## Output
A short checklist of which signals are now visible and where to look at them. Note any still missing.

## Honest framing
Observability doesn't make you faster — it makes problems *findable*. It's the prerequisite for `diagnose-bottlenecks`, not a fix on its own.
