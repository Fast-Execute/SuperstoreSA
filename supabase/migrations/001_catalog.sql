create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name text not null,
  description text not null default '',
  category text not null,
  supplier_id text not null,
  supplier_product_id text not null,
  supplier_cost numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  duties numeric(12,2) not null default 0,
  payment_fees numeric(12,2) not null default 0,
  operating_cost numeric(12,2) not null default 0,
  target_margin numeric(5,4) not null default 0.30,
  retail_price numeric(12,2) not null default 0,
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  images jsonb not null default '[]'::jsonb,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, supplier_product_id)
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_supplier_idx on public.products(supplier_id);

alter table public.products enable row level security;
create policy "public can read active products" on public.products for select using (status = 'active');


create or replace function public.set_products_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

 drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_products_updated_at();
