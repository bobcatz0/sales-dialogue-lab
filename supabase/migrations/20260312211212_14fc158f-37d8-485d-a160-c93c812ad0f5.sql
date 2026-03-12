
CREATE TABLE public.elo_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  elo integer NOT NULL,
  delta integer NOT NULL,
  session_score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own elo history"
  ON public.elo_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own elo history"
  ON public.elo_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_elo_history_user_date ON public.elo_history (user_id, created_at DESC);
