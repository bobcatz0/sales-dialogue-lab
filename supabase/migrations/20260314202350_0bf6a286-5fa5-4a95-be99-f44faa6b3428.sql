
-- Seasons table
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seasons" ON public.seasons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can read seasons" ON public.seasons
  FOR SELECT TO anon USING (true);

-- Season results table (records final standings per user per season)
CREATE TABLE public.season_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  final_elo integer NOT NULL,
  final_rank text NOT NULL,
  leaderboard_position integer NOT NULL DEFAULT 0,
  badge_awarded text,
  total_sessions integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id)
);

ALTER TABLE public.season_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read season results" ON public.season_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can read season results" ON public.season_results
  FOR SELECT TO anon USING (true);

-- Insert the current season (Season 1: Jan-Apr 2026)
INSERT INTO public.seasons (name, starts_at, ends_at, status) VALUES
  ('Season 1 — 2026', '2026-01-01T00:00:00Z', '2026-04-30T23:59:59Z', 'active'),
  ('Season 2 — 2026', '2026-05-01T00:00:00Z', '2026-08-31T23:59:59Z', 'upcoming'),
  ('Season 3 — 2026', '2026-09-01T00:00:00Z', '2026-12-31T23:59:59Z', 'upcoming');
