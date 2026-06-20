---
name: perf-readiness-review
description: Use before a launch or when asked "are we ready?", "can this handle the front page / 10k users?", or "is it production-ready?". Gives a tiered readiness verdict (about 100 / 1k / 10k / 100k users) from rules compliance plus a load test — with honest caveats.
---
# perf-readiness-review

A tiered, honest read on how much traffic the app is plausibly ready for. Each
tier is cumulative — you must satisfy the lower tiers first.

## The tiers (what must be true)

**Tier ~100 users — basics**
- App runs without obvious errors; no crashes on normal use.
- Lists are paginated (no "fetch everything").

**Tier ~1,000 users — fundamentals**
- DB connections **pooled** (serverless → Supabase pooled port 6543).
- Indexes on columns used in WHERE / JOIN / ORDER BY (esp. foreign keys).
- No `SELECT *` on hot paths; no obvious N+1.

**Tier ~10,000 users — resilience**
- **Caching** on expensive, stable reads.
- **Rate limiting** on public/expensive endpoints.
- No blocking external/LLM calls on the request path; outbound calls have timeouts.
- **Observability** in place (you can see p95 + errors + slow queries).
- A **load test has been run** near this level and passed.

**Tier ~100,000 users — scale**
- Horizontal scaling / autoscaling configured; no single bottleneck instance.
- Background jobs/queues for all slow work; CDN for static + cacheable responses.
- Load tested near the target; capacity headroom verified.

## Steps
1. Run `/perf-audit` (rules + `hooks/perf-scan.js`) for the static checks.
2. Confirm the judgment items per tier (pooling, indexes, caching, rate limits, observability).
3. Run `run-load-test` at (or near) the target tier.
4. Produce the verdict table:

   | Tier | Status | Blocking gaps |
   |------|--------|---------------|
   | 100 | ✅ / ❌ | … |
   | 1k | ✅ / ❌ | … |
   | 10k | ✅ / ❌ | … |
   | 100k | ✅ / ❌ | … |

State the **highest tier with no known blockers** as the verdict.

## Honest framing
A tier means *"no known blockers found for that level, and tested to it"* — not a guarantee it won't fail. Real launches surprise everyone. This lowers risk and names the gaps; it does not promise success.
