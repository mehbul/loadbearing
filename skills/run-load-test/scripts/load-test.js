// loadbearing k6 load test.
// Thresholds set the exit code: if p95 latency or error rate is breached, k6
// exits non-zero -> a REAL pass/fail signal, not a vibe.
//
// Run (only against a URL you own or are permitted to test):
//   k6 run -e TARGET_URL=http://localhost:3000 -e VUS=20 -e DURATION=30s \
//          -e P95_MS=500 -e ERROR_RATE=0.01 load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const TARGET = __ENV.TARGET_URL;
const VUS = Number(__ENV.VUS || 20);
const DURATION = __ENV.DURATION || '30s';
const P95 = Number(__ENV.P95_MS || 500);
const ERR = Number(__ENV.ERROR_RATE || 0.01);

export const options = {
  scenarios: {
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: VUS },
        { duration: DURATION, target: VUS },
        { duration: '5s', target: 0 },
      ],
      gracefulStop: '5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<' + P95],
    http_req_failed: ['rate<' + ERR],
  },
};

export default function () {
  if (!TARGET) {
    throw new Error('Set TARGET_URL, e.g. -e TARGET_URL=http://localhost:3000');
  }
  const res = http.get(TARGET);
  check(res, {
    'status is 2xx or 3xx': function (r) { return r.status >= 200 && r.status < 400; },
  });
  sleep(1);
}
