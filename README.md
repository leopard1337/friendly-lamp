# Token Analytics

Holder tracking and KOL attribution for token teams. Track campaigns, paid promotions, community stats, and measure how they move the needle.

**Stack:** Next.js 16, tRPC, Prisma (PostgreSQL), Solana wallet auth, Recharts, BullMQ + Redis.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your values
npx prisma db push
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. Railway, Supabase, local) |
| `REDIS_URL` | For worker | Redis URL. Default `redis://localhost:6379`. Needed for BullMQ worker. |
| `JWT_SECRET` | Yes | 32+ char random string for session signing |
| `SIWE_DOMAIN` | Yes | Domain for Sign-In with Ethereum (e.g. `localhost`, `yourapp.com`) |
| `HELIUS_API_KEY` | Yes | [Helius](https://dashboard.helius.dev) API key for Solana holder counts |
| `ALCHEMY_API_KEY` | Optional | For EVM support (future) |
| `CRON_SECRET` | For cron | Bearer token to protect `/api/cron/snapshot` |
| `CRON_USE_QUEUE` | Optional | Set to `true` to enqueue jobs instead of running inline |
| `NEXT_PUBLIC_API_URL` | Optional | API base URL when deployed (default: same origin) |

Create `.env` from `.env.example` and fill in values.

## Snapshot Worker (Holder Counts & Health Score)

Holder counts, health scores, and charts depend on snapshots. Two modes:

### 1. Inline (no Redis)

Cron hits `/api/cron/snapshot` and runs snapshots inline. Works on Vercel cron.

- Set up [Vercel Cron](https://vercel.com/docs/cron-jobs) to call:
  ```
  GET https://yourapp.com/api/cron/snapshot
  Authorization: Bearer YOUR_CRON_SECRET
  ```
- Do **not** set `CRON_USE_QUEUE`
- Do **not** run the worker process

### 2. Queue + Worker (recommended for many workspaces)

Cron enqueues jobs; a separate worker processes them.

1. **Redis** – Use [Railway Redis](https://railway.app), [Upstash](https://upstash.com), or local.
2. **Cron** – Set `CRON_USE_QUEUE=true` and `CRON_SECRET`. Cron will add jobs to the queue.
3. **Worker** – Run the BullMQ worker:
   ```bash
   npm run worker
   ```
   Keep this running (e.g. on Railway, Render, or a separate server).

## Helius Webhook (optional)

For near real-time snapshots on token transfers, configure a [Helius webhook](https://docs.helius.dev/webhooks-and-websockets/webhooks) to POST to:

```
https://yourapp.com/api/webhooks/helius
```

## Database

```bash
npx prisma db push   # Apply schema
npx prisma studio    # Inspect data
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run worker` | Start BullMQ snapshot worker |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

- `src/app/` – Next.js App Router pages and API routes
- `src/components/` – Shared UI components
- `src/server/routers/` – tRPC routers (auth, workspace, campaign, kol, snapshot, community, attribution, team)
- `src/lib/` – Helius, health score, queue, env
- `src/worker/` – BullMQ snapshot worker

## Deploy

1. **Vercel** – Deploy Next.js. Add env vars. Configure cron for `/api/cron/snapshot`.
2. **Worker** – Deploy the worker separately (Railway, Render, etc.) if using `CRON_USE_QUEUE=true`.
3. **Database** – Use managed Postgres (Railway, Supabase, Neon).
4. **Redis** – Use managed Redis (Railway, Upstash) if running the worker.
