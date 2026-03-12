
-- Activity events table for the live feed
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- 'rank_up', 'high_score', 'elo_gain', 'clan_join', 'personal_best'
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast feed queries
CREATE INDEX idx_activity_events_created_at ON public.activity_events(created_at DESC);

-- RLS
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Anyone can read activity events"
  ON public.activity_events FOR SELECT TO authenticated
  USING (true);

-- Users can insert own events
CREATE POLICY "Users can insert own activity events"
  ON public.activity_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
