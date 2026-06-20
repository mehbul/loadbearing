# Example: Next.js + Supabase + Stripe SaaS — the good patterns

Copy-pasteable snippets showing the *right* version of the patterns loadbearing's
rules and hooks enforce. Stack: Next.js (App Router) + Supabase (Postgres) + Stripe.

## 1. Pool the database connection (serverless)
Use the **pooled** Supabase connection string (Supavisor, transaction mode, port `6543`)
for serverless functions — not the direct connection (`5432`).
```
# .env  (pooled — use this in Vercel / serverless)
DATABASE_URL="postgres://...@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## 2. Paginate + select only the columns you need
```ts
// app/api/posts/route.ts
const PAGE = 50;
export async function GET(req: Request) {
  const page = Number(new URL(req.url).searchParams.get('page') ?? 0);
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, created_at')          // not '*'
    .order('created_at', { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1); // bounded
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
```

## 3. Avoid N+1 with a nested select (one round-trip)
```ts
const { data } = await supabase
  .from('orders')
  .select('id, total, user:users(id, name)')   // join in one query
  .range(0, 49);
```

## 4. Index the columns you filter / sort on
```sql
-- supabase/migrations/xxxx_indexes.sql
create index if not exists idx_orders_user_id on orders (user_id);          -- foreign key
create index if not exists idx_posts_created_at on posts (created_at desc);  -- common sort
```

## 5. Don't block the request on slow work — queue it
```ts
// ❌ await sendEmail(user)  // 3s on the critical path
await supabase.from('jobs').insert({ type: 'welcome_email', user_id: user.id });
return Response.json({ ok: true }); // respond now; a worker sends the email
```

## 6. Cache an expensive, stable read
```ts
const plans = await fetch('https://api.example.com/plans', {
  next: { revalidate: 300 },                  // cache 5 min
  signal: AbortSignal.timeout(3000),          // and time out
}).then((r) => r.json());
```

## 7. Rate-limit public/expensive endpoints
Wrap login, signup, search, and anything hitting the DB or an LLM with a limiter
(e.g. `@upstash/ratelimit`) so one abuser can't take the service down for everyone.

---
Run `node hooks/perf-scan.js <your-file>` on your own code to catch the bad versions of these.
