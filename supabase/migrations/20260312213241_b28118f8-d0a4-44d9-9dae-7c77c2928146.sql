CREATE TABLE public.promotion_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_rank text NOT NULL,
  elo_at_attempt integer NOT NULL,
  session_score integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own promotion attempts"
  ON public.promotion_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own promotion attempts"
  ON public.promotion_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);