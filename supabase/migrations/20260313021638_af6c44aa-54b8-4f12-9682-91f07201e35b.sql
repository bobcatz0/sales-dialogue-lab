
-- Skill progression system: tracks XP per skill per user
CREATE TABLE public.user_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name)
);

-- Enable RLS
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- Users can read their own skills
CREATE POLICY "Users can read own skills"
  ON public.user_skills
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own skills
CREATE POLICY "Users can insert own skills"
  ON public.user_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own skills
CREATE POLICY "Users can update own skills"
  ON public.user_skills
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read others' skills (for leaderboard/profile views)
CREATE POLICY "Authenticated can read all skills"
  ON public.user_skills
  FOR SELECT
  TO authenticated
  USING (true);
