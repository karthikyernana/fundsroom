-- Enable Row-Level Security on all public tables.
-- The backend connects as the table owner (which bypasses RLS), so this
-- blocks anonymous/direct PostgREST access without affecting app behavior.
-- See Supabase security advisory: rls_disabled_in_public.

alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.customer_notes enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.challans enable row level security;
alter table public.challan_items enable row level security;
