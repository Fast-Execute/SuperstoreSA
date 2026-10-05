# Supabase Schema

This schema is the built-in data model for the Alibaba product import and dropshipping flow.

## Core tables

### 1) `products`

```sql
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  price NUMERIC(10,2) DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 0,
  alibaba_original_price NUMERIC(10,2),
  alibaba_rating NUMERIC(4,2),
  alibaba_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Purpose:
- Holds the retail product shown in the storefront.
- Stores the Alibaba supplier cost and sync metadata.

### 2) `product_syncs`

```sql
CREATE TABLE IF NOT EXISTS product_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alibaba_product_id TEXT NOT NULL,
  local_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  markup_percent NUMERIC(5,2) DEFAULT 30,
  last_synced_at TIMESTAMP,
  sync_frequency TEXT CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (alibaba_product_id, local_product_id)
);
```

Purpose:
- Keeps the relationship between local product and the supplier product.
- Allows background syncs to update price and stock based on Alibaba.

### 3) `sync_jobs`

```sql
CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  products_processed INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);
```

Purpose:
- Records each sync run and whether it completed successfully.

### 4) `order_fulfillments`

```sql
CREATE TABLE IF NOT EXISTS order_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_order_id TEXT NOT NULL,
  alibaba_order_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  alibaba_product_id TEXT,
  quantity INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  tracking_number TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Purpose:
- Stores the result of each supplier order placement.
- Maps a local order line to a Alibaba supplier order record.

## Recommended production additions

For a production-ready storefront, add these tables:

### `orders`

```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  status TEXT CHECK (status IN ('pending', 'paid', 'processing', 'fulfilled', 'cancelled')) DEFAULT 'pending',
  subtotal NUMERIC(10,2) DEFAULT 0,
  shipping_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_province TEXT,
  shipping_country TEXT,
  shipping_zip TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### `order_items`

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  supplier_cost NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT now()
);
```

### `suppliers`

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('1688', 'AliExpress', 'Other')) DEFAULT '1688',
  api_key TEXT,
  api_secret TEXT,
  api_base_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);
```

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_product_syncs_status ON product_syncs(status);
CREATE INDEX IF NOT EXISTS idx_product_syncs_alibaba ON product_syncs(alibaba_product_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillment_local_order ON order_fulfillments(local_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
```

## Relationship map

```text
products ──< product_syncs >── alibaba product
orders ──< order_items >── products
orders ──< order_fulfillments >── alibaba supplier orders
```

## Notes

The migration already in this repo is a good starter. For production, the missing layer is the storefront order table (`orders`) and the `order_items` table, because supplier-order creation is only reliable when local checkout state is explicitly modeled.

