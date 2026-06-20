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
| 1.4 | `queryInLoop` | a DB query **or** an awaited data call (`get*`, `fetch*`, `find*`, `load*`, `query*`…) inside a `for` / `while` / `.map` / `.forEach` — catches both the direct N+1 and the common "extracted into a helper" N+1 | §1.4 |
| 2.2 | `fetchNoTimeout` | an **external** `fetch(...)` (an `http(s)://` URL) with no `signal` / `AbortSignal.timeout` | §2.1–2.2 |

**Designed to stay quiet on good code.** `fetchNoTimeout` only flags *external*
calls (relative/internal URLs like `/api/...` are skipped) so it doesn't drown a
real Next.js app in warnings, and `unboundedSelect` ignores `.single()` /
`.limit()` / `.range()` queries. Only `.js/.jsx/.ts/.tsx/.mjs/.cjs` and `.sql`
files are scanned; `node_modules`, build output, and minified files are skipped.

## Files

- `detectors.js` — the detectors as pure functions (`runDetectors(text, filename)`); no dependencies.
- `perf-scan.js` — the entrypoint, in two modes (below).
- `hooks.json` — the Claude Code hook wiring.
- `test/run-tests.js` — proves each detector fires on the bad pattern and stays silent on the good one, plus regression guards for the noise fixes.

## How it runs

**In Claude Code (automatic).** `hooks.json` registers a `PostToolUse` hook on
`Write|Edit|MultiEdit`. After the agent edits a file, `perf-scan.js` reads the
tool payload from stdin, scans the edited file, and — if it finds something —
prints the findings to stderr and exits `2`, which surfaces them back to the
agent to fix or justify. Clean files exit `0` silently. **Requires Node.js** on PATH.

**Anywhere else (manual / CI / other agents).** Run it directly on files:

```bash
node hooks/perf-scan.js app/api/**/*.ts        # exit 1 if any issue found, else 0
```

This makes it usable from Codex, Cursor, Grok, Hermes, a pre-commit hook, or CI.

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

Every detector must fire on a bad sample and stay silent on a good one, and the
**guards** must produce zero findings on realistic clean snippets. If you add a
detector, add a case and a guard.

## Known limitations (honest)

- Heuristics, not an AST — varied ORM shapes (raw SQL in template strings,
  Drizzle/Knex variants), or a query hidden behind two layers of indirection, can
  slip through.
- `fetchNoTimeout` only flags `http(s)://` URLs; an external call via a variable
  URL won't be flagged (a deliberate trade to avoid noise).
- These find *known* patterns; they do not prove the system is fast. Verify under
  load with the `run-load-test` skill.

## Extending

Add a `(text) => Finding[]` function to `detectors.js`, push it into the
`DETECTORS` array, and add a `{ name, rule, bad, good }` case (and a guard) to the
test runner. A `Finding` is `{ rule, line, title, why, fix }`. Keep it
conservative — **silent on good** matters as much as **fires on bad**.
