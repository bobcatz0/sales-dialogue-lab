
-- Table to store weekly challenge badges earned by winning clan members
CREATE TABLE public.weekly_challenge_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  clan_name text NOT NULL,
  week_start date NOT NULL,
  badge_type text NOT NULL DEFAULT 'weekly_champion',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_challenge_badges ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read badges (they're public achievements)
CREATE POLICY "Anyone can read badges"
ON public.weekly_challenge_badges FOR SELECT TO authenticated
USING (true);

-- Only service role inserts (via edge function), no user insert policy needed
