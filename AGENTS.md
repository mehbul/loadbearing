# AGENTS.md — manual index for any AI harness

This file is the **manual entry point** for AI tools that don't auto-discover
Claude Code plugins (Codex, Cursor, Grok, Hermes, OpenCode, Aider, or plain ChatGPT).

The valuable content in loadbearing — the instructions and the runnable scripts — is
plain text and **portable**. Only discovery differs between harnesses. Claude
Code reads the plugin manifest automatically. Everywhere else, point your agent
here:

> "Read AGENTS.md and follow the relevant section for my task."

---

## How to use loadbearing by hand

1. **Writing or reviewing code?** Read rules/performance.md and treat every rule as an always-follow guardrail.
2. **Worried about scale / load?** Find the matching skill below, open its SKILL.md, follow the steps. Where a skill has scripts/, the script is the source of truth — run it and read its pass/fail output.
3. **Want write-time protection?** Run the detector on your files: node hooks/perf-scan.js <files> (exit 1 = issues found). Wire it into a pre-commit hook or CI.

---

## Index

### Rules
| File | Purpose |
|------|---------|
| rules/performance.md | Guardrails: pool DB connections, index foreign keys, paginate, no SELECT *, no blocking external/LLM calls in the request path, cache, rate-limit. Each with a plain-language "why at scale" + a glossary. |

### Hooks (write-time detectors): node hooks/perf-scan.js <files>
| Rule | Flags |
|------|-------|
| 1.1 | SELECT * (raw SQL or .select with a star) |
| 1.2 | Unbounded query (no .range / .limit / .single) |
| 1.4 | Database query inside a loop (N+1) |
| 2.2 | fetch() with no timeout |

### Skills
| Skill | Use it when |
|-------|-------------|
| define-perf-targets | "10k users" needs to become p95 / error-rate / RPS targets + capacity math. |
| run-load-test | Put the app under simulated traffic with a real pass/fail (k6). |
| diagnose-bottlenecks | Something is slow and you need the cause, with evidence. |
| add-observability | You can't see latency / errors / slow queries yet. |
| perf-readiness-review | You want a tiered verdict: ready for ~100 / 1k / 10k / 100k users? |
| write-perf-report | You need an honest, shareable summary of what was tested and found. |

### Agent
| Agent | Role |
|-------|------|
| perf-reviewer | Audits a code diff for the patterns in rules/performance.md. |

### Commands (Claude Code)
| Command | Does |
|---------|------|
| /perf-audit | Static review of the project against the rules. |
| /loadtest | Runs the k6 load test and reports pass/fail. |
| /perf-review | Reviews the current diff for perf regressions. |

### Practice safely
examples/demo-app/server.js is a zero-dependency localhost target so you can run
the whole flow end-to-end without ever load-testing someone else's site.

---

## The honest-framing rule (applies to every harness)

loadbearing **finds limits and reduces risk; it never guarantees a system "won't
fail."** Any report you generate with these tools must say so plainly.
