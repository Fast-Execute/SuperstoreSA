# SuperstoreSA

**Progress: 58%**

```
[██████████████████████░░░░░░░░░░░░░░░░] 58%
```

See [PROGRESS.md](PROGRESS.md) for the full checklist.

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

1. Import products from Alibaba using `/api/alibaba/sync` with action `import`.
2. Start the recurring sync job with `/api/alibaba/sync` and action `start`.
3. When a customer places an order, call `/api/alibaba/orders` to generate a supplier order.

## Important files

- `lib/alibaba/client.ts` — Alibaba API client
- `lib/alibaba/sync.ts` — catalog sync logic
- `app/api/alibaba/sync/route.ts` — sync API endpoint
- `app/api/alibaba/orders/route.ts` — supplier order API endpoint
- `supabase/migrations/001_alibaba_integration.sql` — database tables

## Notes

This is a starter integration. You will still need valid Alibaba credentials and the exact 1688/AliExpress request format used by your supplier account.
