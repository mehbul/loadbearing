# rules/ — _Phase 2_

Always-follow performance guardrails the agent applies while writing code.

`performance.md` will hold each rule plus a one-line **"why this matters at
scale"** in plain language (pool DB connections, index foreign keys, paginate,
no `SELECT *`, no blocking external/LLM calls in the request path, cache,
rate-limit). Split by stack where it matters.

_This is a placeholder; content lands in Phase 2._
