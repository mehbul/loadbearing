# adapters/

Loadbearing's content is plain text and **agent-agnostic** — only *discovery*
differs per agent; the rules, skills, and scripts are shared by all of them.

| Agent | How it loads Loadbearing |
|-------|--------------------------|
| **Claude Code** | Native plugin (manifest at repo root) — auto-discovers skills, commands, agent, and hooks. See [`claude-code/`](claude-code/). |
| **Codex** | Manual via `AGENTS.md` + `perf-scan.js`. See [`codex/`](codex/). |
| **Cursor** | Project rules + `perf-scan.js`. See [`cursor/`](cursor/). |
| **Grok** | Manual via `AGENTS.md` + `perf-scan.js`. See [`grok/`](grok/). |
| **Hermes / local models** | Manual via `AGENTS.md` + `perf-scan.js`. See [`hermes/`](hermes/). |
| **Anything else** | Point it at [`../AGENTS.md`](../AGENTS.md) and run the CLI. |

The portable detector CLI works everywhere (just needs Node.js):
```bash
node hooks/perf-scan.js <files>      # exit 1 if any issue is found, else 0
```
