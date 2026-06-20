# Performance report — <app / feature> — <date>

## 1. What we tested
- **Environment:** <local / staging / prod>  ·  **Commit:** <sha>
- **Scope:** <which endpoints / flows>
- **Scenario:** <virtual users, ramp, duration>
- **Targets:** p95 < <N> ms · error rate < <N>% · peak <N> req/s

## 2. Results
| Metric | Target | Observed | Pass? |
|--------|--------|----------|-------|
| p95 latency | < <N> ms | <N> ms | ✅ / ❌ |
| Error rate | < <N>% | <N>% | ✅ / ❌ |
| Throughput | <N> req/s | <N> req/s | — |
| k6 exit code | 0 | <0 / non-zero> | ✅ / ❌ |

## 3. Bottlenecks found
- <finding — evidence — rule it maps to>

## 4. Fixes made / recommended
- <change — expected effect>

## 5. Readiness
- **Highest tier with no known blockers:** ~<100 / 1k / 10k / 100k> users.
- **Known gaps:** <list>

## 6. Honest caveat (do not delete)
This report shows how the system behaved **under the scenarios above**, on this
data and infrastructure, on this date. It does **not** prove the system "won't
fail." Different traffic shapes, more data, or a degraded dependency can still
cause problems. We reduced risk and found limits — we did not guarantee success.
