
CREATE OR REPLACE FUNCTION public.recalculate_clan_elo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.clans c SET
    clan_elo = COALESCE((
      SELECT ROUND(AVG(top.elo))::integer
      FROM (
        SELECT p.elo
        FROM public.clan_members cm
        JOIN public.profiles p ON p.id = cm.user_id
        WHERE cm.clan_id = c.id
        ORDER BY p.elo DESC
        LIMIT 5
      ) top
    ), 1000),
    total_members = (
      SELECT COUNT(*) FROM public.clan_members cm WHERE cm.clan_id = c.id
    ),
    updated_at = now()
  WHERE c.id = COALESCE(NEW.clan_id, OLD.clan_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;
