
CREATE POLICY "Clan members can read clanmates elo history"
ON public.elo_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clan_members my
    JOIN public.clan_members their ON my.clan_id = their.clan_id
    WHERE my.user_id = auth.uid()
    AND their.user_id = elo_history.user_id
  )
);
