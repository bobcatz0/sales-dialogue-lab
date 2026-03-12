
-- Create clan_messages table
CREATE TABLE public.clan_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;

-- Use a security definer function to check clan membership (avoids recursion with clan_members)
CREATE OR REPLACE FUNCTION public.is_clan_member(_user_id uuid, _clan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clan_members
    WHERE user_id = _user_id AND clan_id = _clan_id
  )
$$;

-- Members can read messages in their clan
CREATE POLICY "Clan members can read messages"
ON public.clan_messages FOR SELECT TO authenticated
USING (public.is_clan_member(auth.uid(), clan_id));

-- Members can send messages to their clan
CREATE POLICY "Clan members can send messages"
ON public.clan_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_clan_member(auth.uid(), clan_id));

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.clan_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_messages;
