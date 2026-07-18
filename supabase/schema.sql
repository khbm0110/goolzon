-- ============================================================================
-- goolzon — Supabase schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- Mirrors exactly the data shapes used by lib/data/provider.ts and
-- lib/auth/provider.ts, so the app's TypeScript types match 1:1.
-- ============================================================================

-- ---------- PROFILES (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text unique not null,
  email text not null,
  avatar text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'banned')),
  join_date timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- ARTICLES ----------
create table public.articles (
  id text primary key,
  title text not null,
  summary text,
  content text not null,
  category text not null,
  image_url text,
  is_breaking boolean not null default false,
  views integer not null default 0,
  author text,
  video_embed_id text,
  date timestamptz not null default now()
);

-- ---------- MATCHES & STANDINGS ----------
create table public.matches (
  id text primary key,
  home_team text not null,
  home_logo text,
  away_team text not null,
  away_logo text,
  score_home integer,
  score_away integer,
  time text,
  status text not null default 'UPCOMING' check (status in ('UPCOMING', 'LIVE', 'FINISHED')),
  league text,
  country text,
  date timestamptz,
  round text,
  venue text,
  -- Links this match to a live API-Football fixture. Nullable — only
  -- populated for matches that came from (or were matched against) the
  -- live API-Football feed. Used by the polling cron to know which
  -- fixture to re-check, and which two teams' players to refresh the
  -- moment the fixture status flips to FINISHED.
  api_fixture_id integer,
  home_team_api_id integer,
  away_team_api_id integer
);

create index if not exists idx_matches_live_with_fixture
  on public.matches (api_fixture_id)
  where status = 'LIVE' and api_fixture_id is not null;

create table public.match_details (
  match_id text primary key references public.matches(id) on delete cascade,
  stats jsonb,   -- { possession, shotsHome, shotsAway, shotsOnTargetHome, shotsOnTargetAway, cornersHome, cornersAway }
  lineups jsonb, -- { home: string[], away: string[] }
  events jsonb,  -- [{ time, team, type, player }]
  summary text
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  rank integer not null,
  team text not null,
  logo text,
  played integer default 0,
  won integer default 0,
  drawn integer default 0,
  lost integer default 0,
  gf integer default 0,
  ga integer default 0,
  gd integer default 0,
  points integer default 0,
  league text not null
);

-- ---------- CLUBS, PLAYERS, TROPHIES ----------
create table public.clubs (
  id text primary key,
  name text not null,
  english_name text,
  logo text,
  cover_image text,
  founded integer,
  stadium text,
  coach text,
  nickname text,
  colors jsonb,   -- { primary, secondary, text }
  social jsonb,   -- { twitter, instagram }
  fan_count integer default 0,
  country text,
  history_text text
);

create table public.players (
  id text not null,
  club_id text not null references public.clubs(id) on delete cascade,
  name text not null,
  english_name text,
  age integer,
  birth_date date,
  birth_place text,
  height_cm integer,
  weight_kg integer,
  preferred_foot text check (preferred_foot in ('LEFT', 'RIGHT', 'BOTH')),
  number integer,
  position text,
  rating integer,
  nationality text,
  image text,
  market_value bigint,
  stats jsonb,        -- { pac, sho, pas, dri, def, phy }
  season_stats jsonb, -- { matches, goals, assists, rating, minutes, yellowCards, redCards, shots, shotsOnTarget, passAccuracy, cleanSheets, saves, tackles }
  primary key (club_id, id)
);

create table public.trophies (
  id uuid primary key default gen_random_uuid(),
  club_id text not null references public.clubs(id) on delete cascade,
  name text not null,
  count integer not null default 0
);

create table public.player_transfers (
  id uuid primary key default gen_random_uuid(),
  club_id text not null,
  player_id text not null,
  season text not null,
  from_club text not null,
  to_club text not null,
  type text not null check (type in ('permanent', 'loan', 'free')),
  foreign key (club_id, player_id) references public.players(club_id, id) on delete cascade
);

create table public.player_injuries (
  id uuid primary key default gen_random_uuid(),
  club_id text not null,
  player_id text not null,
  injury_date date not null,
  type text not null,
  status text not null check (status in ('active', 'recovered')),
  expected_return date,
  foreign key (club_id, player_id) references public.players(club_id, id) on delete cascade
);

create table public.player_awards (
  id uuid primary key default gen_random_uuid(),
  club_id text not null,
  player_id text not null,
  title text not null,
  season text not null,
  foreign key (club_id, player_id) references public.players(club_id, id) on delete cascade
);

create table public.coach_career (
  id uuid primary key default gen_random_uuid(),
  club_id text not null references public.clubs(id) on delete cascade,
  coach_club text not null,
  from_year text not null,
  to_year text,
  achievement text
);

-- ---------- COMMENTS ----------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id text not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  text text not null,
  likes integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'reported', 'hidden')),
  created_at timestamptz not null default now()
);

-- ---------- USER: FOLLOWS, FAVORITES, ACTIVITY ----------
create table public.followed_teams (
  user_id uuid references public.profiles(id) on delete cascade,
  team_name text not null,
  primary key (user_id, team_name)
);

create table public.followed_leagues (
  user_id uuid references public.profiles(id) on delete cascade,
  league text not null,
  primary key (user_id, league)
);

create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  article_id text references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table public.dream_squads (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  squad jsonb not null default '{}'::jsonb
);

-- ---------- PREDICTIONS & LEADERBOARD ----------
create table public.predictions (
  match_id text references public.matches(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  predicted_home integer not null,
  predicted_away integer not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

-- ---------- POLLS ----------
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  votes integer not null default 0
);

create table public.poll_votes (
  poll_id uuid references public.polls(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  option_id uuid references public.poll_options(id) on delete cascade,
  primary key (poll_id, user_id)
);

-- ---------- ADMIN: SPONSORS, SEO, FEATURE FLAGS ----------
create table public.sponsors (
  id text primary key,
  name text not null,
  logo text,
  url text,
  active boolean not null default true
);

create table public.seo_settings (
  id int primary key default 1,
  site_title text,
  meta_description text,
  meta_keywords text,
  og_image_url text,
  constraint single_row check (id = 1)
);

create table public.feature_flags (
  id int primary key default 1,
  matches boolean not null default true,
  clubs boolean not null default true,
  videos boolean not null default true,
  analysis boolean not null default true,
  autopilot boolean not null default false,
  user_system boolean not null default true,
  constraint single_row check (id = 1)
);

create table public.ad_slots (
  id text primary key,
  placement text not null,
  label text not null,
  network text not null default 'adsense',
  code text not null default '',
  enabled boolean not null default false,
  pages text[] not null default array['all'],
  start_date date,
  end_date date,
  updated_at timestamptz not null default now()
);

create table public.ads_global_settings (
  id int primary key default 1,
  master_enabled boolean not null default true,
  ads_txt_content text not null default '',
  constraint single_row check (id = 1)
);

-- Which API-Football leagues the automatic fixture importer pulls from.
-- Admin-managed (searched + added from the API-Football /leagues
-- endpoint) rather than hardcoded, since league ids AND the "current
-- season" id both vary and shift every year.
create table public.tracked_leagues (
  id text primary key, -- 'af-{league_api_id}-{season}'
  league_api_id integer not null,
  season integer not null,
  name text not null,
  country text,
  logo text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Article automation ("الأتمتة"): which AI provider is active, the
-- RSS sources to poll, and how long a rewritten draft waits before it
-- auto-publishes if nobody reviews it. Admin-only in both directions —
-- this is internal operational config, not something the public site
-- needs to read.
create table public.autopilot_settings (
  id int primary key default 1,
  enabled boolean not null default false,
  active_provider text not null default 'gemini',
  review_window_minutes int not null default 3,
  rss_sources jsonb not null default '[]', -- [{ "name": "...", "url": "..." }]
  constraint single_row check (id = 1)
);

-- The review queue: every RSS item that's been fetched + rewritten by
-- an AI provider sits here until an admin approves/rejects it, or the
-- review window elapses and /api/cron/autopilot-publish promotes it to
-- a real `articles` row automatically.
create table public.pending_articles (
  id text primary key, -- 'af-rss-{hash of source url}'
  title text not null,
  summary text,
  content text not null,
  category text not null default 'SAUDI',
  image_url text,
  source_url text not null,
  source_name text,
  ai_provider text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED')),
  published_article_id text references public.articles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pending_articles_status_created
  on public.pending_articles (status, created_at)
  where status = 'PENDING';

insert into public.seo_settings (id) values (1);
insert into public.feature_flags (id) values (1);
insert into public.ads_global_settings (id) values (1);
insert into public.autopilot_settings (id) values (1);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.matches enable row level security;
alter table public.match_details enable row level security;
alter table public.standings enable row level security;
alter table public.clubs enable row level security;
alter table public.players enable row level security;
alter table public.trophies enable row level security;
alter table public.player_transfers enable row level security;
alter table public.player_injuries enable row level security;
alter table public.player_awards enable row level security;
alter table public.coach_career enable row level security;
alter table public.comments enable row level security;
alter table public.followed_teams enable row level security;
alter table public.followed_leagues enable row level security;
alter table public.favorites enable row level security;
alter table public.activity_log enable row level security;
alter table public.dream_squads enable row level security;
alter table public.predictions enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.sponsors enable row level security;
alter table public.seo_settings enable row level security;
alter table public.feature_flags enable row level security;
alter table public.ad_slots enable row level security;
alter table public.ads_global_settings enable row level security;
alter table public.tracked_leagues enable row level security;
alter table public.autopilot_settings enable row level security;
alter table public.pending_articles enable row level security;

-- Helper: is the current user an admin?
create function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- Atomically increments a poll option's vote count (called after a
-- poll_votes insert succeeds, so double-voting is prevented by the
-- poll_votes primary key rather than this function).
create function public.increment_poll_vote(option_id_input uuid)
returns void as $$
  update public.poll_options set votes = votes + 1 where id = option_id_input;
$$ language sql security definer;

-- Public read-only content: anyone (even logged out) can read.
create policy "public read" on public.articles for select using (true);
create policy "public read" on public.matches for select using (true);
create policy "public read" on public.match_details for select using (true);
create policy "public read" on public.standings for select using (true);
create policy "public read" on public.clubs for select using (true);
create policy "public read" on public.players for select using (true);
create policy "public read" on public.trophies for select using (true);
create policy "public read" on public.player_transfers for select using (true);
create policy "public read" on public.player_injuries for select using (true);
create policy "public read" on public.player_awards for select using (true);
create policy "public read" on public.coach_career for select using (true);
create policy "public read" on public.sponsors for select using (true);
create policy "public read" on public.seo_settings for select using (true);
create policy "public read" on public.feature_flags for select using (true);
create policy "public read enabled ad slots" on public.ad_slots for select using (enabled = true or public.is_admin());
create policy "public read ads settings" on public.ads_global_settings for select using (true);
create policy "public read tracked leagues" on public.tracked_leagues for select using (true);
create policy "public read visible comments" on public.comments for select using (status = 'visible' or public.is_admin());
create policy "public read polls" on public.polls for select using (true);
create policy "public read poll options" on public.poll_options for select using (true);
create policy "public read standings write via admin only" on public.standings for all using (public.is_admin());

-- Admin-only writes on content tables.
create policy "admin write" on public.articles for insert with check (public.is_admin());
create policy "admin update" on public.articles for update using (public.is_admin());
create policy "admin delete" on public.articles for delete using (public.is_admin());
create policy "admin write" on public.clubs for insert with check (public.is_admin());
create policy "admin update" on public.clubs for update using (public.is_admin());
create policy "admin delete" on public.clubs for delete using (public.is_admin());
create policy "admin all" on public.players for insert with check (public.is_admin());
create policy "admin all update" on public.players for update using (public.is_admin());
create policy "admin all delete" on public.players for delete using (public.is_admin());
create policy "admin all" on public.sponsors for insert with check (public.is_admin());
create policy "admin all update" on public.sponsors for update using (public.is_admin());
create policy "admin all delete" on public.sponsors for delete using (public.is_admin());
create policy "admin update seo" on public.seo_settings for update using (public.is_admin());
create policy "admin update flags" on public.feature_flags for update using (public.is_admin());
create policy "admin all" on public.ad_slots for insert with check (public.is_admin());
create policy "admin all update" on public.ad_slots for update using (public.is_admin());
create policy "admin all delete" on public.ad_slots for delete using (public.is_admin());
create policy "admin update ads settings" on public.ads_global_settings for update using (public.is_admin());
create policy "admin manage tracked leagues insert" on public.tracked_leagues for insert with check (public.is_admin());
create policy "admin manage tracked leagues update" on public.tracked_leagues for update using (public.is_admin());
create policy "admin manage tracked leagues delete" on public.tracked_leagues for delete using (public.is_admin());
create policy "admin only read autopilot settings" on public.autopilot_settings for select using (public.is_admin());
create policy "admin only update autopilot settings" on public.autopilot_settings for update using (public.is_admin());
create policy "admin only read pending articles" on public.pending_articles for select using (public.is_admin());
create policy "admin only update pending articles" on public.pending_articles for update using (public.is_admin());
create policy "admin only delete pending articles" on public.pending_articles for delete using (public.is_admin());

-- Profiles: users read/update their own; admins read & update all (ban etc).
create policy "read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "update own profile" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- Comments: logged-in users create their own; owner or admin can update (e.g. report/hide).
create policy "insert own comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "update own or admin" on public.comments for update using (auth.uid() = user_id or public.is_admin());
create policy "delete own or admin" on public.comments for delete using (auth.uid() = user_id or public.is_admin());

-- Personal data: strictly owner-only.
create policy "own follows teams" on public.followed_teams for all using (auth.uid() = user_id);
create policy "own follows leagues" on public.followed_leagues for all using (auth.uid() = user_id);
create policy "own favorites" on public.favorites for all using (auth.uid() = user_id);
create policy "own activity" on public.activity_log for all using (auth.uid() = user_id);
create policy "own dream squad" on public.dream_squads for all using (auth.uid() = user_id);
create policy "own predictions read" on public.predictions for select using (true); -- needed for leaderboard aggregation
create policy "own predictions write" on public.predictions for insert with check (auth.uid() = user_id);
create policy "own predictions update" on public.predictions for update using (auth.uid() = user_id);

-- Poll votes: users can insert their own vote once (unique constraint via PK).
create policy "insert own vote" on public.poll_votes for insert with check (auth.uid() = user_id);
create policy "read own vote" on public.poll_votes for select using (auth.uid() = user_id or public.is_admin());
