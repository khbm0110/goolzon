-- Improvements after first automation test run:
--   1) keywords: relevance filter so an agent only processes RSS items
--      that actually match its topic (Arab leagues agent was importing
--      generic world-football news — kits, mascots, etc).
--   2) byline: a real pen name instead of exposing "تحرير آلي (Groq)".
--   3) pending_articles.author: denormalized at import time so
--      autopilot-publish doesn't need to re-join ai_agents later.
--   4) min_words: minimum article length enforced in the prompt.

alter table public.ai_agents
  add column if not exists keywords text[] not null default '{}',
  add column if not exists byline text not null default 'فريق التحرير الرياضي',
  add column if not exists min_words int not null default 250;

alter table public.pending_articles
  add column if not exists author text;

-- Seed relevant keywords + byline for the existing Arab-leagues agent.
-- Matching happens against the ENGLISH source RSS title/description, so
-- keywords are in English (club/league/country names + common transliterations).
update public.ai_agents
set keywords = array[
      'saudi', 'pro league', 'roshn', 'al hilal', 'al-hilal', 'al nassr', 'al-nassr',
      'al ittihad', 'al-ittihad', 'al ahli', 'al-ahli saudi', 'al shabab', 'al ettifaq',
      'uae', 'emirates', 'al ain', 'al wasl', 'al jazira',
      'qatar', 'al sadd', 'al duhail', 'qsl',
      'kuwait', 'oman', 'bahrain',
      'egypt', 'egyptian', 'al ahly', 'zamalek',
      'algeria', 'algerian', 'tunisia', 'tunisian', 'morocco', 'moroccan', 'wydad', 'raja casablanca',
      'jordan', 'jordanian', 'iraq', 'iraqi', 'lebanon', 'lebanese', 'libya', 'sudan', 'yemen', 'palestine', 'palestinian',
      'afc champions league', 'arab cup', 'gulf cup', 'asian cup'
    ],
    byline = 'فريق تحرير غولزون',
    min_words = 250
where id = 'arab-leagues';
