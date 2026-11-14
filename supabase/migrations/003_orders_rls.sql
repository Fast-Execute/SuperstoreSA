-- Order tables hold customer names, phone numbers, emails and addresses.
-- Enable row level security with NO policies, so the public (anon) key cannot read or write them.
-- The server uses the service-role key, which bypasses RLS, for checkout and admin order access.

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_supplier_links enable row level security;
