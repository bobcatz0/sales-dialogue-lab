import { supabase } from "@/integrations/supabase/client";
import { calculateEloDelta, getEloRank } from "./elo";
import type { RankTier } from "./elo";

export interface EloSyncResult {
  newElo: number;
  oldElo: number;
  delta: number;
  newRank: RankTier;
  oldRank: RankTier;
  rankedUp: boolean;
}

/**
 * After a session, update the user's ELO in the database and log history.
 * Returns ELO details including rank change info, or null if not logged in.
 */
export async function syncEloAfterSession(sessionScore: number): Promise<EloSyncResult | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("elo, total_sessions, weekly_elo_gain, week_start")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const oldElo = profile.elo;
  const oldRank = getEloRank(oldElo);
  const delta = calculateEloDelta(sessionScore, oldElo);
  const newElo = Math.max(0, oldElo + delta);
  const newRank = getEloRank(newElo);

  // Weekly tracking: reset if new week
  const currentWeekStart = getWeekStart();
  const profileWeekStart = profile.week_start ? new Date(profile.week_start) : new Date(0);
  const isNewWeek = currentWeekStart.getTime() > profileWeekStart.getTime();
  const weeklyGain = isNewWeek ? Math.max(0, delta) : (profile.weekly_elo_gain ?? 0) + Math.max(0, delta);

  await Promise.all([
    supabase
      .from("profiles")
      .update({
        elo: newElo,
        total_sessions: profile.total_sessions + 1,
        weekly_elo_gain: weeklyGain,
        week_start: currentWeekStart.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id),
    supabase
      .from("elo_history")
      .insert({
        user_id: user.id,
        elo: newElo,
        delta,
        session_score: sessionScore,
      }),
  ]);

  return {
    newElo,
    oldElo,
    delta,
    newRank,
    oldRank,
    rankedUp: newRank !== oldRank && newElo > oldElo,
  };
}
