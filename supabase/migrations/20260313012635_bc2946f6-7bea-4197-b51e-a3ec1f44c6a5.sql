
-- Table to track "Beat the Pro" attempts
CREATE TABLE public.pro_challenge_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scorecard_id UUID NOT NULL REFERENCES public.scorecards(id) ON DELETE CASCADE,
  user_score INTEGER NOT NULL,
  pro_score INTEGER NOT NULL,
  beat_pro BOOLEAN NOT NULL DEFAULT false,
  bonus_elo INTEGER NOT NULL DEFAULT 0,
  scenario_env TEXT NOT NULL,
  scenario_role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pro_challenge_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pro challenge attempts"
  ON public.pro_challenge_attempts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own pro challenge attempts"
  ON public.pro_challenge_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
