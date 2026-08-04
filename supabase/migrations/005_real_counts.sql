-- Two real counts that were previously fake:
--
-- 1) article views: nothing anywhere ever incremented `articles.views` —
--    every article stayed frozen at 0 forever (see app/article/[id]/page.tsx).
--    This RPC does an atomic increment so concurrent readers can't race
--    each other into losing a count.
--
-- 2) club follower count: ClubDashboardClient.tsx displayed a variable
--    literally named `simulatedFanCount` — the admin-typed `fan_count`
--    field (defaulting to a hardcoded 50000 if unset), then ±1'd locally
--    in the viewer's own browser on click, never persisted or shared.
--    The REAL number of followers already exists in `followed_teams`,
--    but RLS on that table restricts each user to only their own rows
--    ("own follows teams" policy), so a plain client-side count query
--    always returns 0 or 1. A `security definer` RPC that returns only
--    the aggregate count (never the rows) is the standard safe way
--    around that — it doesn't leak who follows, just how many.
--
-- Both are called with the public anon/authenticated Supabase client —
-- no service-role key needed anywhere for either of these.

create or replace function public.increment_article_views(target_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles set views = views + 1 where id = target_id;
$$;

grant execute on function public.increment_article_views(text) to anon, authenticated;

create or replace function public.get_team_follower_count(target_team text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.followed_teams where team_name = target_team;
$$;

grant execute on function public.get_team_follower_count(text) to anon, authenticated;
