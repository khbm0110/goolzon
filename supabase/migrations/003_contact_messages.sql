-- Backs the new /contact page — simple inbox table so submissions are
-- durable and queryable, without needing a full admin inbox UI yet.
-- (Query it directly in Supabase for now: select * from
-- contact_messages order by created_at desc;)
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- No one can read messages through the public API — only the
-- service-role/admin client (used by /api/contact to insert, and by
-- you directly in the Supabase SQL editor) bypasses RLS.
create policy "no public select on contact_messages"
  on public.contact_messages for select
  using (false);
