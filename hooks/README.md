# hooks/ — write-time performance detectors (the differentiator)

These detectors fire **as you edit code** and flag a performance-killer the moment
it's written, each with a plain-language *"why it'll hurt at scale"* and a fix.
Catching these at write-time is the cheapest place to fix them.

> **Honest framing:** these are fast **heuristics**, not a full parser or a
> guarantee. They catch the common, obvious cases with very few false positives,
> and they will miss cleverly disguised versions. A finding means *"look here and
> verify"*, not *"this is definitely broken"*.

## What it catches

| Rule | Detector | Flags | Maps to |
|------|----------|-------|---------|
| 1.1 | `selectStar` | `SELECT *` (SQL) or `.select('*')` (Supabase) | [rules/performance.md](../rules/performance.md) §1.1 |
| 1.2 | `unboundedSelect` | a `.from(...).select(...)` chain with no `.range` / `.limit` / `.single` | §1.2 |
| 1.4 | `queryInLoop` | a `await`-ed DB query inside a `for`/`while`/`.map`/`.forEach` (N+1) | §1.4 |
| 2.2 | `fetchNoTimeout` | `fetch(...)` with no `signal` / `AbortSignal.timeout` | §2.1–2.2 |

Only `.js/.jsx/.ts/.tsx/.mjs/.cjs` and `.sql` files are scanned; `node_modules`,
build output, and minified files are skipped.

## Files

- `detectors.js` — the detectors as pure functions (`runDetectors(text, filename)`); no dependencies.
- `perf-scan.js` — the entrypoint, in two modes (below).
- `hooks.json` — the Claude Code hook wiring.
- `test/run-tests.js` — proves each detector fires on the bad pattern and stays silent on the good one.

## How it runs

**In Claude Code (automatic).** `hooks.json` registers a `PostToolUse` hook on
`Write|Edit|MultiEdit`. After the agent edits a file, `perf-scan.js` reads the
tool payload from stdin, scans the edited file, and — if it finds something —
prints the findings to stderr and exits `2`, which surfaces them back to the
agent to fix or justify. Clean files exit `0` silently. **Requires Node.js** on PATH.

**Anywhere else (manual / CI / other harnesses).** Run it directly on files:

```bash
node hooks/perf-scan.js app/api/**/*.ts        # exit 1 if any issue found, else 0
```

This makes it usable from Codex/Cursor, a pre-commit hook, or a CI step.

## Tuning & disabling

- **Turn it off:** remove the `PostToolUse` block from `hooks.json` (or delete the file).
- **Make it non-blocking / warn-only:** have your wrapper ignore the exit code, or
  change the hook to log instead of exiting `2`.
- **Narrow what it scans:** adjust the `matcher` in `hooks.json`, or the `SKIP` /
  extension regexes at the top of `detectors.js`.

## Running the tests

```bash
node hooks/test/run-tests.js     # or:  cd hooks && npm test
```

The test suite is the **Definition of Done** for a hook: every detector must fire
on a bad sample and stay silent on a good one. If you add a detector, add a case.

## Extending

Add a `(text) => Finding[]` function to `detectors.js`, push it into the
`DETECTORS` array, and add a `{ name, rule, bad, good }` case to the test runner.
A `Finding` is `{ rule, line, title, why, fix }`. Keep the heuristic conservative
— **silent on good** matters as much as **fires on bad**, or people turn it off.
