
-- Store finalized weekly challenge results
CREATE TABLE public.clan_weekly_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  clan_name text NOT NULL,
  week_start date NOT NULL,
  total_score integer NOT NULL DEFAULT 0,
  total_sessions integer NOT NULL DEFAULT 0,
  rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clan_id, week_start)
);

ALTER TABLE public.clan_weekly_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly results"
ON public.clan_weekly_results FOR SELECT TO authenticated
USING (true);

-- Only edge function (service role) inserts results, no user insert policy needed
