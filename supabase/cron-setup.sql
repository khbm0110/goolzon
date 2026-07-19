-- ============================================================================
-- Supabase Cron setup — real per-minute scheduling, free, no external
-- service needed. Run this ONCE in the Supabase SQL Editor after
-- replacing the two placeholders below.
--
-- Why this instead of vercel.json: Vercel's Hobby plan only allows
-- cron schedules that fire once a day. pg_cron (built into every
-- Supabase project, including free ones) has no such limit — it can
-- call any URL every minute. Your existing Next.js routes
-- (/api/cron/...) don't change at all; Supabase's database just
-- becomes the thing that pings them on schedule instead of Vercel.
-- ============================================================================

-- 1) Enable the two extensions this needs (safe to re-run).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 2) Replace these two values first:
--    - YOUR_SITE_URL   → your real deployed domain, e.g. https://goolzon.vercel.app
--    - YOUR_CRON_SECRET → the exact same value you set for CRON_SECRET in
--      Vercel's environment variables
--
-- (Optional but more secure: store the secret in Supabase Vault instead
-- of inline here — see https://supabase.com/docs/guides/database/vault
-- — then reference it with vault.decrypted_secrets instead of the
-- plain header below. Inline is fine for a personal project; anyone
-- who could read this from the SQL Editor already has full DB access.)

-- Unschedule any previous version of these jobs first, so re-running
-- this file after editing the URL/secret doesn't create duplicates.
select cron.unschedule(jobid) from cron.job where jobname = 'goolzon-import-fixtures';
select cron.unschedule(jobid) from cron.job where jobname = 'goolzon-sync-finished-matches';
select cron.unschedule(jobid) from cron.job where jobname = 'goolzon-sync-lineups';
select cron.unschedule(jobid) from cron.job where jobname = 'goolzon-autopilot-import';
select cron.unschedule(jobid) from cron.job where jobname = 'goolzon-autopilot-publish';
select cron.unschedule(jobid) from cron.job where jobname = 'goolzon-agent-trends';

-- Fetch today's fixtures for every tracked league — once a day is
-- plenty for this one (fixtures don't change minute to minute).
select cron.schedule(
  'goolzon-import-fixtures',
  '0 2 * * *',
  $$
  select net.http_post(
    url := 'YOUR_SITE_URL/api/cron/import-fixtures',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);

-- Check every LIVE match for a final whistle — every 2 minutes. This
-- is the one that makes "player stats update instantly after the
-- match" actually instant instead of once-a-day.
select cron.schedule(
  'goolzon-sync-finished-matches',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'YOUR_SITE_URL/api/cron/sync-finished-matches',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);

-- Real per-match lineups (starting XI + substitutes) — published
-- 20-40 minutes before kickoff, so checking every couple minutes
-- catches them right when they go live.
select cron.schedule(
  'goolzon-sync-lineups',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'YOUR_SITE_URL/api/cron/sync-lineups',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);

-- RSS agents (وكيل الدوريات العربية) — every 15 minutes is a
-- reasonable balance between freshness and AI-provider quota usage.
select cron.schedule(
  'goolzon-autopilot-import',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'YOUR_SITE_URL/api/cron/autopilot-import',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);

-- Auto-publish anything whose review window has elapsed — every
-- minute, so a 3-minute review window is an actual 3 minutes.
select cron.schedule(
  'goolzon-autopilot-publish',
  '* * * * *',
  $$
  select net.http_post(
    url := 'YOUR_SITE_URL/api/cron/autopilot-publish',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);

-- وكيل الترند — trending topics don't need to be checked more than a
-- few times a day.
select cron.schedule(
  'goolzon-agent-trends',
  '0 6,12,18 * * *',
  $$
  select net.http_post(
    url := 'YOUR_SITE_URL/api/cron/agent-trends',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);

-- 3) Verify everything is scheduled:
select jobname, schedule, active from cron.job where jobname like 'goolzon-%';

-- To pause one later without deleting it:
--   select cron.alter_job((select jobid from cron.job where jobname = 'goolzon-autopilot-import'), active := false);
-- To see recent run results/errors:
--   select * from cron.job_run_details where jobid in (select jobid from cron.job where jobname like 'goolzon-%') order by start_time desc limit 20;
