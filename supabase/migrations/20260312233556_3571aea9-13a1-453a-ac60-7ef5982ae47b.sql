
CREATE TABLE public.scorecards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  score integer NOT NULL,
  rank text NOT NULL,
  percentile integer NOT NULL DEFAULT 50,
  scenario_title text NOT NULL,
  framework_id text,
  rubric_scores jsonb DEFAULT '[]'::jsonb,
  strengths jsonb DEFAULT '[]'::jsonb,
  improvements jsonb DEFAULT '[]'::jsonb,
  best_moment text,
  elo integer,
  elo_delta integer,
  alias text,
  display_name text NOT NULL DEFAULT 'Anonymous',
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public read access (shared links work for everyone, even unauthenticated)
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scorecards" ON public.scorecards
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can insert own scorecards" ON public.scorecards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scorecards_created_at ON public.scorecards (created_at DESC);
