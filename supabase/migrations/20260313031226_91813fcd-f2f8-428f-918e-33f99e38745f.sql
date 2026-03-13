
-- Tournament status enum
CREATE TYPE public.tournament_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

-- Main tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scenario_role TEXT NOT NULL,
  scenario_env TEXT NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 64,
  current_round INTEGER NOT NULL DEFAULT 0,
  total_rounds INTEGER NOT NULL DEFAULT 6,
  status public.tournament_status NOT NULL DEFAULT 'upcoming',
  created_by UUID NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tournaments"
  ON public.tournaments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tournaments"
  ON public.tournaments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seed INTEGER,
  eliminated_in_round INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read participants"
  ON public.tournament_participants FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join tournaments"
  ON public.tournament_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage participants"
  ON public.tournament_participants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tournament matches
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  player_a_id UUID,
  player_b_id UUID,
  player_a_score INTEGER,
  player_b_score INTEGER,
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read matches"
  ON public.tournament_matches FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Players can update own scores"
  ON public.tournament_matches FOR UPDATE TO authenticated
  USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

CREATE POLICY "Admins can manage matches"
  ON public.tournament_matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
