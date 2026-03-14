
CREATE TABLE public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_env text NOT NULL,
  scenario_role text NOT NULL,
  scenario_prompt text NOT NULL,
  creator_id uuid NOT NULL,
  creator_response text,
  creator_score integer,
  creator_feedback text,
  challenger_id uuid,
  challenger_response text,
  challenger_score integer,
  challenger_feedback text,
  winner_id uuid,
  creator_elo_delta integer DEFAULT 0,
  challenger_elo_delta integer DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting',
  response_mode text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read battles they're part of or waiting ones
CREATE POLICY "Users can read own battles or open battles"
  ON public.battles FOR SELECT TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = challenger_id OR status = 'waiting');

-- Users can create battles
CREATE POLICY "Users can create battles"
  ON public.battles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Users can update battles they're part of
CREATE POLICY "Users can update battles they participate in"
  ON public.battles FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = challenger_id)
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = challenger_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
