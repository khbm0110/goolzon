-- The live database was created before `agent_id` was added to the
-- pending_articles definition in schema.sql, so it drifted out of sync
-- with the code (autopilot-import started failing with:
-- "Could not find the 'agent_id' column of 'pending_articles' in the
-- schema cache"). schema.sql itself already has this column for any
-- fresh install — this migration just brings an existing database
-- (like the current production one) up to date. Safe to re-run.

alter table public.pending_articles
  add column if not exists agent_id text references public.ai_agents(id) on delete set null;
