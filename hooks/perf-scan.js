#!/usr/bin/env node
'use strict';
/*
 * loadbearing hook + CLI entrypoint.
 *
 *  - Hook mode (Claude Code PostToolUse): reads the tool JSON from stdin, scans
 *    the edited file, and on findings prints them to stderr and exits 2 so the
 *    agent sees them and can fix or justify.
 *  - CLI mode (portable): node perf-scan.js <file> [more...]  scans each file,
 *    prints findings to stdout, exits 1 if any are found (use in CI / other harnesses).
 */
const fs = require('fs');
const { runDetectors } = require('./detectors');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch (_) { return ''; }
}

function format(file, findings) {
  const L = [];
  L.push('');
  L.push('  loadbearing: ' + findings.length + ' performance issue(s) in ' + file);
  L.push('  (heuristic check - look here, verify, then fix or dismiss)');
  L.push('');
  for (const f of findings) {
    L.push('  [Rule ' + f.rule + ']  line ' + f.line + '  -  ' + f.title);
    L.push('     why at scale: ' + f.why);
    L.push('     fix: ' + f.fix);
    L.push('');
  }
  L.push('  Full rules: rules/performance.md   |   Tune/disable: hooks/README.md');
  L.push('');
  return L.join('\n');
}

function scanFile(file) {
  if (!file || !fs.existsSync(file)) return [];
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
  return runDetectors(text, file);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length) { // CLI mode
    let total = 0;
    for (const file of args) {
      const findings = scanFile(file);
      if (findings.length) { total += findings.length; process.stdout.write(format(file, findings)); }
    }
    if (!total) process.stdout.write('loadbearing: no issues found.\n');
    process.exit(total ? 1 : 0);
  }

  // Hook mode
  let payload = {};
  try { payload = JSON.parse(readStdin()); } catch (_) { process.exit(0); }
  const ti = payload.tool_input || {};
  const file = ti.file_path || ti.path || ti.filePath;
  const findings = scanFile(file);
  if (!findings.length) process.exit(0);
  process.stderr.write(format(file, findings));
  process.exit(2);
}

main();
