import { supabase } from "@/integrations/supabase/client";
import { calculateEloDelta, getEloRank, ELO_RANKS } from "./elo";
import type { RankTier } from "./elo";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0));
  return monday;
}

export const PLACEMENT_SESSIONS_REQUIRED = 3;

export interface EloSyncResult {
  newElo: number;
  oldElo: number;
  delta: number;
  newRank: RankTier;
  oldRank: RankTier;
  rankedUp: boolean;
  /** True if this session completed the placement phase */
  placementComplete: boolean;
  /** How many sessions completed total (including this one) */
  totalSessions: number;
}

/**
 * After a session, update the user's ELO in the database and log history.
 * During placement (first 3 sessions), uses a higher K-factor for faster calibration.
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
  const isPlacement = profile.total_sessions < PLACEMENT_SESSIONS_REQUIRED;
  
  // During placement, use amplified delta for faster calibration
  let delta: number;
  if (isPlacement) {
    // Placement: map score directly to ELO range
    // Score 0-100 → target ELO 600-1400
    // Average the target with current ELO, weighted toward performance
    const targetElo = 600 + (sessionScore / 100) * 800;
    const sessionCount = profile.total_sessions + 1;
    // Progressive blending: each session gets equal weight
    const blendedElo = Math.round(
      (oldElo * (sessionCount - 1) + targetElo) / sessionCount
    );
    delta = blendedElo - oldElo;
  } else {
    delta = calculateEloDelta(sessionScore, oldElo);
  }
  
  const newElo = Math.max(0, oldElo + delta);
  const newRank = getEloRank(newElo);
  const newTotalSessions = profile.total_sessions + 1;
  const placementComplete = isPlacement && newTotalSessions >= PLACEMENT_SESSIONS_REQUIRED;

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
        total_sessions: newTotalSessions,
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
    placementComplete,
    totalSessions: newTotalSessions,
  };
}
