
-- Table to store weekly head-to-head clan rivalries
CREATE TABLE public.clan_rivalries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_a_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  clan_b_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  clan_a_score integer NOT NULL DEFAULT 0,
  clan_b_score integer NOT NULL DEFAULT 0,
  clan_a_sessions integer NOT NULL DEFAULT 0,
  clan_b_sessions integer NOT NULL DEFAULT 0,
  winner_clan_id uuid REFERENCES public.clans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clan_a_id, week_start),
  UNIQUE(clan_b_id, week_start)
);

-- Enable RLS
ALTER TABLE public.clan_rivalries ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read rivalries
CREATE POLICY "Anyone can read rivalries"
  ON public.clan_rivalries FOR SELECT
  TO authenticated
  USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_rivalries;
