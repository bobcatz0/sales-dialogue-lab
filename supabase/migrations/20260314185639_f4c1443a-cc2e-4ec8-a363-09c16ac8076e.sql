
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id text NOT NULL,
  final_score integer NOT NULL,
  certification_level text NOT NULL,
  stage_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_name text NOT NULL DEFAULT 'Anonymous',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read certifications"
  ON public.certifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own certifications"
  ON public.certifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certifications"
  ON public.certifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
