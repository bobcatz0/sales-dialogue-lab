
-- Add invite_code and referral_points to clans
ALTER TABLE public.clans
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  ADD COLUMN IF NOT EXISTS referral_points integer NOT NULL DEFAULT 0;

-- Track referrals
CREATE TABLE public.clan_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL,
  referred_by uuid NOT NULL,
  points_awarded integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clan_id, referred_user_id)
);

ALTER TABLE public.clan_referrals ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read referrals for their clan
CREATE POLICY "Clan members can read referrals"
ON public.clan_referrals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clan_members cm
    WHERE cm.clan_id = clan_referrals.clan_id
    AND cm.user_id = auth.uid()
  )
);

-- System inserts referrals (user joining via link)
CREATE POLICY "Users can insert own referral"
ON public.clan_referrals FOR INSERT TO authenticated
WITH CHECK (referred_user_id = auth.uid());

-- Function to award referral points
CREATE OR REPLACE FUNCTION public.award_referral_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.clans
  SET referral_points = referral_points + NEW.points_awarded,
      updated_at = now()
  WHERE id = NEW.clan_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_insert
AFTER INSERT ON public.clan_referrals
FOR EACH ROW
EXECUTE FUNCTION public.award_referral_points();
