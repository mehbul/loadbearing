# Performance rules (always follow)

These are the guardrails to apply **while writing code** — not after. Most
performance disasters are a handful of well-known patterns repeated everywhere.
Catching them as you type is far cheaper than discovering them under real traffic.

**How to read this file**
- Each rule has a **Do / Don't**, a one-line **"why it hurts at scale,"** and a
  tiny example where it helps.
- 🪝 marks a rule that a loadbearing **hook** (Phase 3) will flag automatically as you
  edit files. The rest are judgment guardrails for you and the agent.
- Stack callouts (**Supabase**, **Next.js**, **Serverless**) give the specific
  version for the first supported stack: **Next.js + Supabase (Postgres)**.
- New to the jargon? Every term is defined in plain English in the
  [Glossary](#glossary) at the bottom.

> **Honest framing:** following these rules *reduces risk* and removes the most
> common footguns. It does not guarantee your app won't fail under load — nothing
> can. You still verify under load (that's the skills layer). Prevention just
> means far fewer fires to put out later.

---

## 1. Database & queries — where scaling pain starts

The database is the single most common reason AI-built apps fall over. Almost
every rule here is about not asking the database to do far more work than needed.

### Rule 1.1 — Never `SELECT *`; ask only for the columns you use 🪝
- **Do:** list the exact columns. **Don't:** select everything "just in case."
- **Why it hurts at scale:** every extra column is more data read from disk and
  pushed over the network on *every single request*. At 10 requests it's
  invisible; at 10,000/min it saturates your database and network.

```sql
-- ❌ bad
select * from orders where user_id = $1;
-- ✅ good
select id, total, status, created_at from orders where user_id = $1;
```
**Supabase:** `supabase.from('orders').select('id, total, status, created_at')`
— not `.select('*')`.

### Rule 1.2 — Always paginate; never fetch an unbounded list 🪝
- **Do:** add a `LIMIT` (and offset/cursor) to any query that returns a list.
- **Don't:** return "all rows" — that grows forever as your data grows.
- **Why it hurts at scale:** a query that returns 50 rows in dev returns 5
  million in production a year later, then times out and takes the page with it.

```js
// ❌ bad — every row, forever
const { data } = await supabase.from('posts').select('id, title')
// ✅ good — one page at a time
const { data } = await supabase.from('posts').select('id, title').range(0, 49)
```

### Rule 1.3 — Index the columns you filter, join, or sort on — especially foreign keys 🪝
- **Do:** add a database index on any column used in `WHERE`, `JOIN`, or
  `ORDER BY`. **Postgres does NOT auto-index foreign keys** — you must add them.
- **Why it hurts at scale:** without an index the database scans *every row* to
  find matches. Fast on 1,000 rows, catastrophic on 10 million.

```sql
-- a foreign key alone does not create an index — add one:
create index on orders (user_id);
-- composite index for a common filter+sort:
create index on orders (user_id, created_at desc);
```

### Rule 1.4 — No N+1 queries; never run a query inside a loop 🪝
- **Do:** fetch related data in one query (a join, an `IN (...)`, or a Supabase
  nested select). **Don't:** loop over results and query once per item.
- **Why it hurts at scale:** showing 50 orders that each fetch their user = 51
  round-trips. Under load those round-trips multiply and exhaust the database.

```js
// ❌ bad — 1 query for orders + 1 per order (N+1)
const orders = await getOrders()
for (const o of orders) { o.user = await getUser(o.user_id) }

// ✅ good — one nested query (Supabase resolves the join)
const { data } = await supabase
  .from('orders')
  .select('id, total, user:users(id, name)')
  .range(0, 49)
```

### Rule 1.5 — Pool your database connections
- **Do:** connect through a **pooler**, not a fresh direct connection per request.
- **Why it hurts at scale:** Postgres handles a *limited* number of connections
  (often ~60–100). Open one per request and you hit the ceiling fast — new
  requests then fail with "too many connections."
- **Serverless (Vercel, Lambda):** this is critical. Each function instance can
  open its own connection, so a traffic spike = a connection flood.
  **Supabase:** use the **pooled connection string** (Supavisor / transaction
  mode, port `6543`) for serverless, not the direct connection (port `5432`).

### Rule 1.6 — Don't compute expensive aggregates on every request
- **Do:** cache, precompute, or use estimated counts for dashboards/totals.
- **Don't:** run `COUNT(*)` over a huge table on every page load.
- **Why it hurts at scale:** exact counts and big `GROUP BY`s get slower as data
  grows, turning a cheap page into your slowest endpoint.
- **Supabase:** prefer `{ count: 'estimated' }` over `'exact'` for large tables
  when an approximate number is fine.

---

## 2. The request path — never make the user wait on someone else

The "request path" is everything that happens between a user's click and their
response. Anything slow or unreliable in that path becomes the user's problem.

### Rule 2.1 — No blocking external / LLM / third-party calls in the request path 🪝
- **Do:** for slow work (sending email, calling an LLM, generating a PDF,
  hitting a third-party API), either **stream** the result or push it to a
  **background job/queue** and return immediately.
- **Don't:** `await` a 5-second API call before responding to the user.
- **Why it hurts at scale:** while one request waits 5s on an external service,
  it's holding a worker/connection. A burst of these and you have no workers left
  for anyone else — one slow dependency freezes your whole app.

```js
// ❌ bad — user waits for the email provider before the page responds
await sendWelcomeEmail(user)   // 3s round-trip on the critical path
return Response.json({ ok: true })

// ✅ good — hand it off, respond now
await queue.enqueue('welcome-email', { userId: user.id })
return Response.json({ ok: true })
```

### Rule 2.2 — Always set a timeout on outbound calls
- **Do:** give every `fetch`/DB/third-party call an explicit timeout.
- **Why it hurts at scale:** a dependency that hangs forever makes *your*
  requests hang forever. Timeouts contain the damage to one feature.

```js
const res = await fetch(url, { signal: AbortSignal.timeout(3000) }) // 3s cap
```

### Rule 2.3 — Keep heavy CPU work out of the request handler
- **Do:** offload image processing, large file parsing, or big report generation
  to a background job. **Don't:** do it inline while the user waits.
- **Why it hurts at scale:** CPU-bound work blocks the event loop / worker, so
  one heavy request slows down every *other* request on that instance too.

---

## 3. Caching & rate limiting — do less work, and cap the work you accept

### Rule 3.1 — Cache expensive reads that rarely change
- **Do:** cache results that are costly to produce and don't change every second
  (HTTP cache headers, a CDN, Next.js data cache, or Redis for shared state).
- **Why it hurts at scale:** recomputing the same answer for every visitor wastes
  your most expensive resource (the database). Compute once, serve thousands.
- **Next.js:** use `fetch(url, { next: { revalidate: 60 } })` or `unstable_cache`
  for data that can be a little stale. Don't refetch identical data per request.

### Rule 3.2 — Rate-limit public and expensive endpoints
- **Do:** cap how many requests a single client/IP can make (e.g. login,
  signup, search, anything that hits the DB or an LLM).
- **Why it hurts at scale:** without a limit, one buggy client, scraper, or abuser
  can generate enough traffic to take the service down for everyone — and run up
  your bill. A rate limit turns "outage" into "that one client gets 429s."

### Rule 3.3 — Parallelize independent work; avoid request waterfalls 🪝
- **Do:** fire independent async calls together with `Promise.all`.
- **Don't:** `await` them one after another when they don't depend on each other.
- **Why it hurts at scale:** three sequential 200ms calls = 600ms of latency per
  request for no reason; in parallel it's 200ms. Latency compounds under load.

```js
// ❌ bad — 3 trips back to back
const user = await getUser(id)
const orders = await getOrders(id)
const prefs = await getPrefs(id)
// ✅ good — all at once
const [user, orders, prefs] = await Promise.all([getUser(id), getOrders(id), getPrefs(id)])
```

---

## 4. Next.js specifics

### Rule 4.1 — Fetch data on the server; don't create client-side waterfalls
- **Do:** load data in Server Components / route handlers near where it's used.
- **Why it hurts at scale:** client-side fetch chains mean the browser does
  round-trip after round-trip; the server can fetch in parallel, closer to the DB.

### Rule 4.2 — Don't ship a huge JavaScript bundle to the browser
- **Do:** `dynamic()`-import heavy components, keep `'use client'` to the parts
  that truly need interactivity, and watch your dependency sizes.
- **Why it hurts at scale:** a heavy bundle is slow to download and parse on every
  visitor's device — especially on mobile — hurting real-world load time for all.

### Rule 4.3 — Optimize images
- **Do:** use `next/image` (or equivalent) so images are sized and compressed.
- **Why it hurts at scale:** unoptimized images are usually the single largest
  thing a page downloads; they dominate load time and bandwidth cost.

---

## 5. You can't fix what you can't see

### Rule 5.1 — Add basic observability before you need it
- **Do:** make sure you can see request latency, error rate, and slow database
  queries (your host's dashboard, Supabase's query insights, or simple logging).
- **Why it hurts at scale:** when things slow down under load, the team with
  metrics finds the bottleneck in minutes; the team without one guesses for hours.
  (The `add-observability` skill, Phase 4, walks through wiring this up.)

---

## Glossary (plain English)

- **Latency** — how long one request takes, start to finish. Lower is better.
- **p95 latency** — "95th percentile." If your p95 is 800ms, then 95% of requests
  finish in under 800ms and the slowest 5% take longer. It captures the bad
  experiences that an *average* hides.
- **RPS** — requests per second; how much traffic you're handling.
- **Throughput** — how much work the system gets done per unit time.
- **N+1 query** — fetching a list (1 query) then making one more query *per item*
  (N queries). Lots of tiny round-trips instead of one efficient query.
- **Index** — a lookup structure the database keeps so it can find rows without
  scanning the whole table — like the index at the back of a book.
- **Foreign key (FK)** — a column pointing at a row in another table (e.g.
  `orders.user_id` → `users.id`). Postgres does **not** index these for you.
- **Connection pool** — a shared, reused set of database connections, so you don't
  open a brand-new one for every request (databases allow only so many at once).
- **Request path / critical path** — the work done between the user's request and
  the response they get. Slow work here is felt directly by the user.
- **Rate limiting** — capping how many requests a client may make in a time
  window, to protect the service from overload and abuse.
- **Caching** — saving the result of expensive work so you can serve it again
  without redoing it.
- **Pagination** — returning data one page at a time (e.g. 50 rows) instead of
  everything at once.
- **Waterfall** — doing async steps one after another when they could run at the
  same time, stacking up their wait times.
- **Background job / queue** — a way to do slow work *after* responding to the
  user, so they don't wait for it.
