-- CRITICAL SECURITY FIX — privilege escalation.
--
-- The "update own profile" policy had no WITH CHECK clause. Postgres
-- defaults an UPDATE policy's WITH CHECK to the same expression as
-- USING when none is given — which only restricts WHO can update a
-- row (auth.uid() = id), never WHICH COLUMNS/VALUES they set. Any
-- authenticated user could therefore:
--   PATCH /rest/v1/profiles?id=eq.<their-own-uuid>
--   { "role": "admin" }
-- and instantly self-promote to admin — is_admin() reads exactly this
-- column, and it gates every admin-only RLS policy plus the /admin
-- route check in middleware.ts. The same gap let a banned user simply
-- set status='active' to un-ban themselves.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (
  public.is_admin()
  or (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and status = (select p.status from public.profiles p where p.id = auth.uid())
  )
);
