
-- Flash challenges table
CREATE TABLE public.flash_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  scenario_env text NOT NULL,
  scenario_role text NOT NULL,
  bonus_elo integer NOT NULL DEFAULT 15,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flash challenge scores
CREATE TABLE public.flash_challenge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.flash_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL,
  display_name text NOT NULL DEFAULT 'Anonymous',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- RLS
ALTER TABLE public.flash_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_challenge_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read active flash challenges
CREATE POLICY "Anyone can read flash challenges"
  ON public.flash_challenges FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can read flash challenge scores
CREATE POLICY "Anyone can read flash challenge scores"
  ON public.flash_challenge_scores FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert own scores
CREATE POLICY "Users can insert own flash scores"
  ON public.flash_challenge_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own scores (for best score)
CREATE POLICY "Users can update own flash scores"
  ON public.flash_challenge_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
