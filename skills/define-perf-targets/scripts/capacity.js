#!/usr/bin/env node
'use strict';
/*
 * Rough capacity math: turn an audience size into load-test targets.
 * Usage:
 *   node capacity.js --users 10000 --actions 5 --window 60 --peak 3 [--p95 500] [--errors 1]
 */
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 && process.argv[i + 1] !== undefined ? Number(process.argv[i + 1]) : def;
}
const users = arg('users', 1000);
const actions = arg('actions', 5);
const windowMin = arg('window', 60);
const peak = arg('peak', 3);
const p95 = arg('p95', 500);
const errors = arg('errors', 1);

const totalReq = users * actions;
const avgRps = totalReq / (windowMin * 60);
const peakRps = avgRps * peak;
const startVus = Math.max(10, Math.ceil(peakRps * 0.3 * 1.5));

const out = [
  '',
  'loadbearing capacity estimate',
  '  audience:        ' + users + ' users x ' + actions + ' actions over ' + windowMin + ' min (peak x' + peak + ')',
  '  average load:    ' + avgRps.toFixed(1) + ' req/s',
  '  peak load:       ' + peakRps.toFixed(1) + ' req/s   <- design and test to this',
  '  suggested test:  ~' + startVus + ' virtual users (ramp to peak, then hold)',
  '',
  '  suggested thresholds (tune to your product):',
  '    p95 latency:   < ' + p95 + ' ms',
  '    error rate:    < ' + errors + ' %',
  '',
  '  run (only against a URL you own / are permitted to test):',
  '    k6 run -e TARGET_URL=<your-url> -e VUS=' + startVus + ' -e P95_MS=' + p95 + ' -e ERROR_RATE=' + (errors / 100),
  '      skills/run-load-test/scripts/load-test.js',
  ''
];
console.log(out.join('\n'));
