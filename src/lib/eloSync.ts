import { supabase } from "@/integrations/supabase/client";
import { calculateEloDelta } from "./elo";

/**
 * After a session, update the user's ELO in the database.
 * Returns the new ELO or null if user is not logged in.
 */
export async function syncEloAfterSession(sessionScore: number): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("elo, total_sessions")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const delta = calculateEloDelta(sessionScore, profile.elo);
  const newElo = Math.max(0, profile.elo + delta);

  await supabase
    .from("profiles")
    .update({
      elo: newElo,
      total_sessions: profile.total_sessions + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return newElo;
}
