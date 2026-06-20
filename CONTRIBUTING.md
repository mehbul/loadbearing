# Contributing to loadbearing

Thanks for helping make AI-built apps survive real traffic. loadbearing is
deliberately **single-domain and tight** — we'd rather have 6 excellent surfaces
than 30 mediocre ones. Contributions are welcome within that spirit.

## Ground rules

1. **Stay in scope.** loadbearing is *only* about performance engineering and
   performance testing. Great idea that's about auth, billing, or UI? It belongs
   in a different pack.
2. **Honest framing always.** Never add language that implies a guarantee
   ("bulletproof," "won't fail," "100% safe"). We find limits and reduce risk.
3. **Runnable beats readable.** If a contribution can end in a script with a
   real pass/fail, it should. Prose-only checks drift.
4. **Plain language.** Assume the reader has never heard of p95 latency. Define
   terms; explain *why it matters at scale*.

## Definition of done (match the component you're touching)

- **Skill:** triggers reliably on a realistic prompt, ends in a runnable check
  with a clear pass/fail, and has a fixed report template.
- **Hook:** ships with a test proving it **fires on the bad pattern and stays
  silent on the good one**.
- **Rule:** one always-follow guardrail + a one-line "why this matters at scale."
- **Docs:** lead with the honest "finds limits, doesn't guarantee" framing.

## How to contribute

1. Fork the repo and create a branch.
2. Make your change, following the relevant Definition of Done above.
3. Include or update tests where applicable (especially for hooks).
4. Open a pull request describing *what* it catches/does and *why it matters at
   scale*.

---

## 📮 Submit a launch-day postmortem (case study)

The most valuable thing you can contribute is a **real story**: something that
got slow or fell over under load, and what fixed it. These become teaching
examples. Copy the template below into a new file under `examples/postmortems/`
(e.g. `examples/postmortems/2026-03-checkout-meltdown.md`) and open a PR.

```markdown
# Postmortem: <short title>

**Stack:** <e.g. Next.js + Supabase + Stripe>
**Scale at failure:** <e.g. ~800 concurrent users during a product launch>

## What happened
<Plain-language story. What did users experience? What broke?>

## The root cause
<The actual bottleneck. e.g. "an N+1 query on the orders page issued ~50 DB
calls per request; connection pool exhausted at ~600 concurrent users.">

## How we found it
<Logs? A load test? Your hosting dashboard? Be specific.>

## The fix
<What changed, in concrete terms.>

## Would loadbearing have caught it at write-time?
<Yes / No / Partially — and which rule or hook. If "no," that's a feature
request: tell us what detector would have caught it.>

## Lesson for others
<One or two sentences a stranger can act on.>
```

Anonymize anything sensitive (company names, real user data, secrets). Synthetic
or redacted numbers are fine — the *shape* of the failure is what teaches.
