-- Expert challenges: created by verified evaluators
CREATE TABLE public.expert_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  expert_name text NOT NULL,
  expert_role text NOT NULL,
  title text NOT NULL,
  description text,
  scenario_env text NOT NULL,
  scenario_role text NOT NULL,
  expert_score integer NOT NULL CHECK (expert_score >= 0 AND expert_score <= 100),
  difficulty text NOT NULL DEFAULT 'intermediate',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expert_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active challenges
CREATE POLICY "Anyone can read expert challenges"
  ON public.expert_challenges FOR SELECT
  TO authenticated
  USING (true);

-- Only evaluators can create challenges
CREATE POLICY "Evaluators can create expert challenges"
  ON public.expert_challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = creator_id
    AND public.has_role(auth.uid(), 'evaluator')
  );

-- Evaluators can update own challenges
CREATE POLICY "Evaluators can update own challenges"
  ON public.expert_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id AND public.has_role(auth.uid(), 'evaluator'))
  WITH CHECK (auth.uid() = creator_id AND public.has_role(auth.uid(), 'evaluator'));

-- Expert challenge attempts: user submissions
CREATE TABLE public.expert_challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.expert_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  beat_expert boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expert_challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Anyone can read attempts (for leaderboard)
CREATE POLICY "Anyone can read challenge attempts"
  ON public.expert_challenge_attempts FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert own attempts
CREATE POLICY "Users can insert own attempts"
  ON public.expert_challenge_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);