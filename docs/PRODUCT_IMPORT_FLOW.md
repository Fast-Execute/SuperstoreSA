# Product Import Flow (Exact)

## Overview

The product import flow takes Alibaba 1688/AliExpress products and mirrors them into the local Supabase database for retail sale with markup. This document details the exact sequence, data transformations, and API contracts.

---

## Phase 1: Product Search & Fetch (Alibaba Client)

### Trigger
```typescript
POST /api/alibaba/sync
{
  "action": "import",
  "keyword": "electronics",    // Required: search keyword
  "pageSize": 50,             // Optional: default 50, max 50 per page
  "markup": 30                // Optional: retail markup %, default 30%
}
```

### Step 1.1: Search Products
**File**: `lib/alibaba/client.ts` → `searchProducts()`

**API Call**:
```
GET https://api.1688.com/openapi/param2/1/alibabaitem/search?
  apikey=<ALIBABA_API_KEY>
  &keyword=electronics
  &categoryId=
  &pageNum=1
  &pageSize=50
  &sortBy=sales
  &fields=title,price,discount,image,sales,rating,shop,categoryId,productId,minOrder,weight,dimensions
```

**Alibaba Response Format** (example):
```json
{
  "items": [
    {
      "productId": "1234567890",
      "title": "Wireless Bluetooth Earbuds",
      "price": "12.50",
      "discount": "10",
      "image": "https://img.example.com/product.jpg",
      "images": ["url1", "url2"],
      "sales": 5000,
      "rating": 4.8,
      "shop": {
        "name": "Shenzhen Electronics Co."
      },
      "categoryId": "26",
      "minOrder": 1,
      "weight": "0.05",
      "dimensions": "10x10x5cm"
    }
  ]
}
```

### Step 1.2: Normalize Product Data

**Transformation** in `normalizeProduct()`:

```typescript
Input: {
  productId: "1234567890",
  title: "Wireless Bluetooth Earbuds",
  price: "12.50",
  discount: "10",
  images: ["url1", "url2"],
  sales: 5000,
  rating: 4.8,
  shop: { name: "Shenzhen Electronics Co." },
  minOrder: 1,
  weight: "0.05",
  dimensions: "10x10x5cm"
}

Output: AlibabaProduct {
  alibabaId: "1234567890",
  title: "Wireless Bluetooth Earbuds",
  description: "",
  price: 12.50,                    // string → number
  discount: 10,
  images: ["url1", "url2"],
  sales: 5000,
  rating: 4.8,
  shopName: "Shenzhen Electronics Co.",
  minOrder: 1,
  weight: 0.05,
  dimensions: "10x10x5cm",
  specifications: [],
  syncedAt: <now>
}
```

---

## Phase 2: Import into Local Database

**File**: `lib/alibaba/sync.ts` → `importProducts()`

### Step 2.1: Create Local Product

**Supabase Insert**:
```sql
INSERT INTO products (
  title,
  description,
  images,
  price,                          -- Retail price with markup applied
  sku,
  stock_quantity,
  alibaba_original_price,         -- Supplier cost (wholesale)
  alibaba_rating,
  alibaba_sales,
  created_at,
  updated_at
) VALUES (
  'Wireless Bluetooth Earbuds',
  '',
  '["url1", "url2"]',
  16.25,                          -- 12.50 * (1 + 30/100) = 16.25
  'ALI-1234567890',
  50,                             -- max(minOrder=1, 50) = 50
  12.50,
  4.8,
  5000,
  now(),
  now()
)
RETURNING id;                     -- Returns: UUID e.g., "abc-123-def"
```

**Response**:
```json
{
  "id": "abc-123-def-456",
  "title": "Wireless Bluetooth Earbuds",
  "price": 16.25,
  "sku": "ALI-1234567890",
  "alibaba_original_price": 12.50
}
```

### Step 2.2: Create Product Sync Record

**Purpose**: Establishes the link between Alibaba product and local product for recurring updates.

**Supabase Insert**:
```sql
INSERT INTO product_syncs (
  alibaba_product_id,
  local_product_id,
  status,
  markup_percent,
  last_synced_at,
  sync_frequency,
  created_at
) VALUES (
  '1234567890',
  'abc-123-def-456',
  'active',
  30,
  now(),
  'daily',
  now()
)
```

**Result**:
```json
{
  "id": "sync-789",
  "alibaba_product_id": "1234567890",
  "local_product_id": "abc-123-def-456",
  "status": "active",
  "markup_percent": 30,
  "sync_frequency": "daily"
}
```

### Step 2.3: Loop & Accumulate

Repeat steps 2.1–2.2 for each product in the batch. Return count of successfully imported products.

**Response**:
```json
{
  "success": true,
  "productsImported": 47  // 50 searched, 3 failed, 47 imported
}
```

---

## Phase 3: Recurring Sync (Product Updates)

**Trigger**: Manual start or scheduled job

### Step 3.1: Start Sync Engine

```bash
curl -X POST http://localhost:3000/api/alibaba/sync \
  -H "Authorization: your-sync-api-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

**Response**:
```json
{
  "success": true,
  "message": "Sync engine started"
}
```

### Step 3.2: Fetch Active Syncs

**Supabase Query** in `executeSync()`:
```sql
SELECT * FROM product_syncs WHERE status = 'active'
```

**Result** (example):
```json
[
  {
    "id": "sync-789",
    "alibaba_product_id": "1234567890",
    "local_product_id": "abc-123-def-456",
    "markup_percent": 30,
    "last_synced_at": "2026-10-04T10:00:00Z",
    "sync_frequency": "daily"
  },
  {
    "id": "sync-790",
    "alibaba_product_id": "1234567891",
    "local_product_id": "abc-123-def-457",
    "markup_percent": 30,
    "last_synced_at": "2026-10-04T10:00:00Z",
    "sync_frequency": "daily"
  }
]
```

### Step 3.3: Fetch Latest Product Details from Alibaba

For each active sync record:

```typescript
const product = await alibaba.getProductDetail(sync.alibaba_product_id);
```

**Alibaba API Call**:
```
GET https://api.1688.com/openapi/param2/1/alibabaitem/detail?
  apikey=<ALIBABA_API_KEY>
  &productId=1234567890
  &fields=title,price,discount,image,sales,rating,shop,categoryId,productId,minOrder,weight,dimensions,description,specifications,images
```

**Response** (extended):
```json
{
  "productId": "1234567890",
  "title": "Wireless Bluetooth Earbuds v2",
  "description": "Now with noise cancellation",
  "price": "11.00",  // PRICE CHANGED
  "discount": "15",
  "images": ["url1-new", "url2-new", "url3-new"],
  "sales": 7000,     // SALES INCREASED
  "rating": 4.9,     // RATING INCREASED
  "specifications": [
    { "name": "Battery Life", "value": "8 hours" },
    { "name": "Color", "value": "Black, White" }
  ]
}
```

### Step 3.4: Calculate Retail Price

```typescript
const retailPrice = product.price * (1 + markup_percent / 100);
// Example: 11.00 * (1 + 30/100) = 14.30
```

### Step 3.5: Update Local Product

**Supabase Update**:
```sql
UPDATE products SET
  title = 'Wireless Bluetooth Earbuds v2',
  description = 'Now with noise cancellation',
  images = '["url1-new", "url2-new", "url3-new"]',
  price = 14.30,
  alibaba_original_price = 11.00,
  alibaba_rating = 4.9,
  alibaba_sales = 7000,
  stock_quantity = 50,
  updated_at = now()
WHERE id = 'abc-123-def-456'
```

### Step 3.6: Update Sync Timestamp

```sql
UPDATE product_syncs SET
  last_synced_at = now()
WHERE id = 'sync-789'
```

### Step 3.7: Record Sync Job

**Supabase Insert**:
```sql
INSERT INTO sync_jobs (
  id,
  status,
  products_processed,
  products_updated,
  products_skipped,
  started_at,
  completed_at
) VALUES (
  'sync-2026-10-05T18:30:00Z',
  'completed',
  2,
  2,
  0,
  now() - interval '5 minutes',
  now()
)
```

**Response**:
```json
{
  "id": "sync-2026-10-05T18:30:00Z",
  "status": "completed",
  "productsProcessed": 2,
  "productsUpdated": 2,
  "productsSkipped": 0,
  "startedAt": "2026-10-05T18:25:00Z",
  "completedAt": "2026-10-05T18:30:00Z"
}
```

---

## Data Schema

### `products` Table
```
id (UUID)
title (TEXT)
description (TEXT)
sku (TEXT, UNIQUE)
price (NUMERIC 10,2)           -- Retail price
images (TEXT[] ARRAY)
stock_quantity (INTEGER)
alibaba_original_price (NUMERIC 10,2)  -- Supplier cost
alibaba_rating (NUMERIC 4,2)
alibaba_sales (INTEGER)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### `product_syncs` Table
```
id (UUID)
alibaba_product_id (TEXT)
local_product_id (UUID, FK → products)
status (TEXT: 'active'|'inactive'|'archived')
markup_percent (NUMERIC 5,2)   -- Default: 30%
last_synced_at (TIMESTAMP)
sync_frequency (TEXT: 'hourly'|'daily'|'weekly')
created_at (TIMESTAMP)

UNIQUE (alibaba_product_id, local_product_id)
INDEX on status
INDEX on alibaba_product_id
```

### `sync_jobs` Table
```
id (TEXT, PRIMARY KEY)
status (TEXT: 'pending'|'running'|'completed'|'failed')
products_processed (INTEGER)
products_updated (INTEGER)
products_skipped (INTEGER)
error (TEXT, nullable)
started_at (TIMESTAMP)
completed_at (TIMESTAMP, nullable)
```

---

## Error Handling

### Search Fails
- **Condition**: `response.ok === false`
- **Action**: Throw error, stop import
- **Response**: `400/401/429/500` from Alibaba API

### Product Insert Fails
- **Condition**: `createError` from Supabase
- **Action**: Skip product, increment `productsSkipped`, continue
- **Example**: Duplicate SKU, disk quota

### Sync Record Insert Fails
- **Condition**: `syncError` from Supabase
- **Action**: Rollback product insert, skip, continue
- **Example**: Foreign key violation (product deleted)

### Sync Job Fails
- **Condition**: Any exception in `executeSync()`
- **Action**: Catch error, record with `status: 'failed'`, log error message
- **Response**:
```json
{
  "id": "sync-2026-10-05T18:30:00Z",
  "status": "failed",
  "error": "Alibaba API unreachable",
  "startedAt": "2026-10-05T18:25:00Z",
  "completedAt": "2026-10-05T18:30:15Z"
}
```

---

## Configuration

**Environment Variables**:
```
ALIBABA_API_BASE=https://api.1688.com
ALIBABA_API_KEY=your-api-key
ALIBABA_API_SECRET=your-api-secret
SYNC_API_KEY=your-manual-sync-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

**Defaults** in `ProductSyncEngine`:
```typescript
defaultMarkup: 30              // 30% profit margin
syncInterval: 60 * 60 * 1000   // 1 hour
batchSize: 50                  // Products per search page
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Alibaba API credentials not configured" | Missing env vars | Check `.env.local` for API keys |
| Products imported but not syncing | `product_syncs` record failed | Check Supabase for duplicate constraints |
| Sync engine not starting | Already running or error in `executeSync()` | Check logs for exceptions |
| Prices not updating | `last_synced_at` not progressing | Verify sync job status in DB |
| Stock quantity = 0 | `minOrder` from Alibaba is very large | Increase default stock logic or adjust in Alibaba admin |

