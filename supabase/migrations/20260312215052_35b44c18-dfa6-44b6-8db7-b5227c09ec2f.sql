CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  scenario_env text NOT NULL,
  scenario_role text NOT NULL,
  creator_score integer NOT NULL,
  challenger_id uuid,
  challenger_score integer,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read challenges"
  ON public.challenges FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own challenges"
  ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update challenges they are part of"
  ON public.challenges FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = challenger_id)
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = challenger_id);