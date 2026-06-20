'use strict';
/*
 * Zero-dependency test runner for loadbearing detectors.
 * Proves each detector FIRES on the bad pattern and STAYS SILENT on the good one.
 * Exit code 0 = all pass, 1 = a failure. (This is the hook Definition of Done.)
 */
const { runDetectors } = require('../detectors');
const FILE = 'app/api/example/route.ts';

const cases = [
  {
    name: 'Rule 1.1  SELECT *',
    rule: '1.1',
    bad:  "const { data } = await supabase.from('orders').select('*').range(0, 49)",
    good: "const { data } = await supabase.from('orders').select('id, total').range(0, 49)"
  },
  {
    name: 'Rule 1.4  N+1 query inside a loop',
    rule: '1.4',
    bad:  "for (const o of orders) {\n  const u = await supabase.from('users').select('id, name').eq('id', o.user_id).single()\n}",
    good: "const ids = orders.map((o) => o.user_id)\nconst { data } = await supabase.from('users').select('id, name').in('id', ids).limit(100)"
  },
  {
    name: 'Rule 2.2  fetch() without a timeout',
    rule: '2.2',
    bad:  "const res = await fetch('https://api.example.com/data')",
    good: "const res = await fetch('https://api.example.com/data', { signal: AbortSignal.timeout(3000) })"
  },
  {
    name: 'Rule 1.2  unbounded query (no pagination)',
    rule: '1.2',
    bad:  "const { data } = await supabase.from('posts').select('id, title')",
    good: "const { data } = await supabase.from('posts').select('id, title').range(0, 49)"
  }
];

let failed = 0;
console.log('\nloadbearing detector tests\n');
for (const c of cases) {
  const badF = runDetectors(c.bad, FILE);
  const goodF = runDetectors(c.good, FILE);
  const firesOnBad = badF.some((f) => f.rule === c.rule);
  const silentOnGood = goodF.length === 0;
  const ok = firesOnBad && silentOnGood;
  if (!ok) failed++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + c.name);
  if (!firesOnBad) console.log('          expected a rule ' + c.rule + ' finding on BAD, got: ' + JSON.stringify(badF.map((f) => f.rule)));
  if (!silentOnGood) console.log('          expected 0 findings on GOOD, got: ' + JSON.stringify(goodF.map((f) => f.rule + '@L' + f.line)));
}
console.log('\n  ' + (failed ? (failed + ' test(s) FAILED') : 'all ' + cases.length + ' tests passed') + '\n');
process.exit(failed ? 1 : 0);
