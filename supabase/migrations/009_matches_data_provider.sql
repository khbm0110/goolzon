-- Adds football-data.org as a second fixtures provider alongside
-- API-Football. Needed because API-Football's free plan doesn't
-- include the current season at all ("Free plans do not have access
-- to this season, try from 2022 to 2024" — confirmed live from this
-- project's own cron logs, which is why matches stayed empty from day
-- one despite tracked_leagues being configured correctly).
-- football-data.org's free plan DOES cover the current season, for a
-- fixed set of major European competitions — see
-- lib/services/footballData.ts:FOOTBALL_DATA_COMPETITION_CODES for
-- exactly which. Arab leagues and anything else outside that list
-- still goes through API-Football and will keep failing until that
-- plan is upgraded.
--
-- The two providers use different team/fixture id schemes, so this
-- column is how sync-finished-matches and sync-lineups know which API
-- a given match's ids actually belong to.
alter table public.matches add column if not exists data_provider text not null default 'api_football'
  check (data_provider in ('api_football', 'football_data'));
