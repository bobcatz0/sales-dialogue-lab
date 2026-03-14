
-- Team challenges table
CREATE TABLE public.team_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  scenario_env text NOT NULL,
  scenario_role text NOT NULL,
  custom_prompt text,
  deadline timestamp with time zone NOT NULL,
  invite_code text NOT NULL DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE(invite_code)
);

ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read own challenges" ON public.team_challenges
  FOR SELECT TO authenticated
  USING (manager_id = auth.uid());

CREATE POLICY "Managers can create challenges" ON public.team_challenges
  FOR INSERT TO authenticated
  WITH CHECK (manager_id = auth.uid() AND public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update own challenges" ON public.team_challenges
  FOR UPDATE TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Team challenge members table
CREATE TABLE public.team_challenge_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.team_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  score integer,
  completed_at timestamp with time zone,
  scorecard_id uuid REFERENCES public.scorecards(id),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.team_challenge_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read challenge members" ON public.team_challenge_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_challenges tc
    WHERE tc.id = team_challenge_members.challenge_id AND tc.manager_id = auth.uid()
  ));

CREATE POLICY "Users can read own membership" ON public.team_challenge_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join challenges" ON public.team_challenge_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own submission" ON public.team_challenge_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Members can read challenges they belong to (uses security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_team_challenge_member(_user_id uuid, _challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_challenge_members
    WHERE user_id = _user_id AND challenge_id = _challenge_id
  )
$$;

CREATE POLICY "Members can read joined challenges" ON public.team_challenges
  FOR SELECT TO authenticated
  USING (public.is_team_challenge_member(auth.uid(), id));
