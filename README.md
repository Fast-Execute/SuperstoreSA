# SuperstoreSA

South African online superstore foundation with a local Alibaba dropshipping integration layer.

## What this repo includes

- Next.js app setup for storefront development
- Supabase-ready data layer for product and order sync
- Alibaba product import and sync scaffolding
- Simple API routes for sync triggers and supplier order placement

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Alibaba sync flow

All calls to `/api/alibaba/sync` need the header `Authorization: Bearer <SYNC_API_KEY>`. If `SYNC_API_KEY` is not set on the server, the endpoint refuses every request.

1. Import products from Alibaba using `/api/alibaba/sync` with action `import`.
2. Keep prices and stock fresh with action `sync`, which runs one sync pass. This is called automatically every hour by the **Scheduled product sync** GitHub Actions workflow (see below). The `start` action uses an in-process timer that does not work on serverless hosting.
3. When a customer places an order, call `/api/alibaba/orders` to generate a supplier order.

## Automation

| Workflow | When | What it does |
|---|---|---|
| `ci.yml` | Every push to `main` and every pull request | Installs and builds the app (includes the TypeScript check) |
| `scheduled-sync.yml` | Hourly, and on demand from the Actions tab | Calls `POST /api/alibaba/sync` with `{"action":"sync"}`. The run fails (and GitHub emails you) if the site is unreachable or the sync fails |
| `dependabot.yml` | Weekly | Opens pull requests for npm and GitHub Actions updates |

To switch on the scheduled sync, add two repository secrets (Settings → Secrets and variables → Actions): `SITE_URL` (the deployed site) and `SYNC_API_KEY` (same value as the app's `SYNC_API_KEY`). Until both exist the job skips itself without failing. Scheduled workflows only run from `main`.

The sync route reads `SUPABASE_SERVICE_ROLE_KEY` and `ALIBABA_API_KEY` / `ALIBABA_API_SECRET` / `ALIBABA_API_BASE`, which differ from the names in `.env.example` (`SUPABASE_SECRET_KEY`, `ALIBABA_APP_KEY`, and so on). Set the names the code actually reads in your hosting environment, or unify them, before relying on the sync.

## Important files

- `lib/alibaba/client.ts` — Alibaba API client
- `lib/alibaba/sync.ts` — catalog sync logic
- `app/api/alibaba/sync/route.ts` — sync API endpoint
- `app/api/alibaba/orders/route.ts` — supplier order API endpoint
- `supabase/migrations/001_alibaba_integration.sql` — database tables

## Notes

This is a starter integration. You will still need valid Alibaba credentials and the exact 1688/AliExpress request format used by your supplier account.
