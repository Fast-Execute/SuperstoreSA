-- Alibaba dropshipping schema
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

CREATE INDEX IF NOT EXISTS idx_product_syncs_status ON product_syncs(status);
CREATE INDEX IF NOT EXISTS idx_product_syncs_alibaba ON product_syncs(alibaba_product_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillment_local_order ON order_fulfillments(local_order_id);
