# demo-app — a safe target to practice load testing

A tiny, zero-dependency Node server so you can run the whole loadbearing flow
**end-to-end on your own machine**, without ever pointing a load test at someone
else's site.

## Run it
```bash
node examples/demo-app/server.js
# loadbearing demo app on http://localhost:3000  (routes: /fast, /slow?ms=300)
```

## Routes
- `GET /fast` — responds instantly. A passing baseline.
- `GET /slow?ms=400` — waits `ms` milliseconds, simulating a heavy endpoint. Use it to watch a load test **fail** a p95 threshold.

## Load test it (in a second terminal)
```bash
# should PASS p95 < 500ms
k6 run -e TARGET_URL=http://localhost:3000/fast skills/run-load-test/scripts/load-test.js

# should FAIL p95 < 500ms (endpoint sleeps 800ms)
k6 run -e TARGET_URL="http://localhost:3000/slow?ms=800" -e P95_MS=500 skills/run-load-test/scripts/load-test.js
```

The second run exits non-zero — that's the point: a real pass/fail signal you can see and trust.
