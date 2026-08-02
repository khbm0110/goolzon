-- Storage bucket for AI-generated article header images (see
-- lib/services/ai/imageGen.ts + lib/services/imageStorage.ts, used by
-- the autopilot cron routes: autopilot-import, agent-trends, and the
-- match-analysis path in lib/data/matchAnalysis.ts). Every other image
-- in this project is an admin-pasted external URL — this is the one
-- case where the app itself produces image bytes that need somewhere
-- to live.
--
-- Public read (so <Image> on the public site can load them directly by
-- URL, same as any other pasted image link); writes only via the
-- service-role client (createAdminClient()), same pattern as
-- pending_articles/contact_messages — no public insert policy needed.
insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

drop policy if exists "public read article-images" on storage.objects;
create policy "public read article-images"
  on storage.objects for select
  using (bucket_id = 'article-images');
