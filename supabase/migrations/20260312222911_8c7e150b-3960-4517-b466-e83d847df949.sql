
-- Create clan_role enum
CREATE TYPE public.clan_role AS ENUM ('leader', 'officer', 'member');

-- Create clan_join_type enum
CREATE TYPE public.clan_join_type AS ENUM ('public', 'invite_only');

-- Clans table
CREATE TABLE public.clans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  join_type public.clan_join_type NOT NULL DEFAULT 'public',
  created_by UUID NOT NULL,
  clan_elo INTEGER NOT NULL DEFAULT 1000,
  total_members INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clan members table
CREATE TABLE public.clan_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.clan_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (clan_id, user_id)
);

-- Clan invites table
CREATE TABLE public.clan_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (clan_id, invited_user_id)
);

-- Clan bans table
CREATE TABLE public.clan_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (clan_id, user_id)
);

-- Enable RLS
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_bans ENABLE ROW LEVEL SECURITY;

-- Clans RLS: anyone authenticated can read
CREATE POLICY "Anyone can read clans" ON public.clans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create clans" ON public.clans FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Clan leaders can update clan" ON public.clans FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = clans.id AND user_id = auth.uid() AND role = 'leader'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = clans.id AND user_id = auth.uid() AND role = 'leader'));

-- Clan members RLS
CREATE POLICY "Anyone can read clan members" ON public.clan_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join public clans" ON public.clan_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leaders and officers can manage members" ON public.clan_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_members.clan_id AND cm.user_id = auth.uid() AND cm.role IN ('leader', 'officer'))
    OR auth.uid() = user_id);
CREATE POLICY "Leaders can update member roles" ON public.clan_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_members.clan_id AND cm.user_id = auth.uid() AND cm.role = 'leader'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_members.clan_id AND cm.user_id = auth.uid() AND cm.role = 'leader'));

-- Clan invites RLS
CREATE POLICY "Users can read own invites" ON public.clan_invites FOR SELECT TO authenticated
  USING (invited_user_id = auth.uid() OR invited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_invites.clan_id AND cm.user_id = auth.uid() AND cm.role IN ('leader', 'officer')));
CREATE POLICY "Leaders and officers can invite" ON public.clan_invites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = invited_by AND EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_invites.clan_id AND cm.user_id = auth.uid() AND cm.role IN ('leader', 'officer')));
CREATE POLICY "Invited users can update invite status" ON public.clan_invites FOR UPDATE TO authenticated
  USING (invited_user_id = auth.uid()) WITH CHECK (invited_user_id = auth.uid());
CREATE POLICY "Leaders can delete invites" ON public.clan_invites FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_invites.clan_id AND cm.user_id = auth.uid() AND cm.role IN ('leader', 'officer')));

-- Clan bans RLS
CREATE POLICY "Clan staff can read bans" ON public.clan_bans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_bans.clan_id AND cm.user_id = auth.uid() AND cm.role IN ('leader', 'officer')));
CREATE POLICY "Leaders can ban" ON public.clan_bans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = banned_by AND EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_bans.clan_id AND cm.user_id = auth.uid() AND cm.role = 'leader'));
CREATE POLICY "Leaders can unban" ON public.clan_bans FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_bans.clan_id AND cm.user_id = auth.uid() AND cm.role = 'leader'));

-- Function to recalculate clan ELO from member profiles
CREATE OR REPLACE FUNCTION public.recalculate_clan_elo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.clans c SET
    clan_elo = COALESCE((
      SELECT ROUND(AVG(p.elo))::integer
      FROM public.clan_members cm
      JOIN public.profiles p ON p.id = cm.user_id
      WHERE cm.clan_id = c.id
    ), 1000),
    total_members = (
      SELECT COUNT(*) FROM public.clan_members cm WHERE cm.clan_id = c.id
    ),
    updated_at = now()
  WHERE c.id = COALESCE(NEW.clan_id, OLD.clan_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to recalculate clan ELO when members change
CREATE TRIGGER recalculate_clan_elo_on_member_change
  AFTER INSERT OR DELETE ON public.clan_members
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_clan_elo();
