-- Web Push subscriptions (see lib/services/webPush.ts) — the missing
-- half of "follow a league/club": following one saved a preference,
-- but nothing ever told the user anything happened until they came
-- back and checked manually. This table plus the two triggers wired
-- into autopilot-publish (breaking news) and sync-finished-matches
-- (goal/full-time alerts for followed clubs/leagues) close that loop.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id);
