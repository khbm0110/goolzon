-- Security hardening — see Supabase security advisor output.
--
-- 1) REAL VULNERABILITY (not just a lint warning): increment_poll_vote
--    was a public RPC with no check tying it to an actual vote —
--    anyone, unauthenticated, could call it directly and inflate any
--    poll option's count arbitrarily, completely independent of the
--    real (properly-protected) poll_votes table. Fixed by counting
--    real rows on read instead of trusting a manually-incremented
--    counter, same pattern as get_team_follower_count.
create or replace function public.get_poll_votes_by_poll(target_poll_id uuid)
returns table(option_id uuid, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select po.id as option_id, count(pv.option_id) as votes
  from public.poll_options po
  left join public.poll_votes pv on pv.option_id = po.id
  where po.poll_id = target_poll_id
  group by po.id;
$$;

grant execute on function public.get_poll_votes_by_poll(uuid) to anon, authenticated;

drop function if exists public.increment_poll_vote(uuid);

-- Dead column now that votes are counted live from poll_votes instead
-- of trusted/incremented here.
alter table public.poll_options drop column if exists votes;

-- 2) search_path hardening: SECURITY DEFINER functions without a
--    pinned search_path are vulnerable to search_path hijacking.
alter function public.handle_new_user() set search_path = public;
alter function public.is_admin() set search_path = public;

-- 3) handle_new_user is a trigger function (fires on auth.users
--    insert) and was never meant to be called directly by a client —
--    revoking EXECUTE doesn't affect the trigger itself (Postgres
--    fires it regardless of role grants), it just closes off the
--    unintended direct /rest/v1/rpc/handle_new_user path. Must revoke
--    from PUBLIC specifically — Postgres grants EXECUTE to PUBLIC by
--    default on function creation, and anon/authenticated implicitly
--    inherit anything granted to PUBLIC, so revoking from just those
--    two roles is not enough on its own.
revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to service_role;

-- Not fixed here — do this manually in the dashboard:
-- Authentication → Policies → enable "Leaked password protection"
-- (checks new passwords against HaveIBeenPwned). Not a SQL setting.
