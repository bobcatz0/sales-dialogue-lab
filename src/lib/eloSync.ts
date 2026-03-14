import { supabase } from "@/integrations/supabase/client";
import { calculateEloDelta, getEloRank, ELO_RANKS } from "./elo";
import type { RankTier } from "./elo";
import { publishActivityEvent } from "./activityEvents";

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
  /** Current daily practice streak */
  currentStreak: number;
  /** Longest streak ever */
  longestStreak: number;
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
    .select("elo, total_sessions, weekly_elo_gain, week_start, current_streak, longest_streak, last_session_date")
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
  const weeklyGain = isNewWeek ? Math.max(0, delta) : ((profile.weekly_elo_gain as number) ?? 0) + Math.max(0, delta);

  // Streak tracking
  const todayStr = new Date().toISOString().slice(0, 10);
  const lastDate = (profile as any).last_session_date as string | null;
  let currentStreak = ((profile as any).current_streak as number) ?? 0;
  let longestStreak = ((profile as any).longest_streak as number) ?? 0;

  if (lastDate === todayStr) {
    // Already practiced today — no streak change
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (lastDate === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  await Promise.all([
    supabase
      .from("profiles")
      .update({
        elo: newElo,
        total_sessions: newTotalSessions,
        weekly_elo_gain: weeklyGain,
        week_start: currentWeekStart.toISOString(),
        updated_at: new Date().toISOString(),
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_session_date: todayStr,
      } as any)
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

  // Publish activity events (fire-and-forget)
  if (newRank !== oldRank && newElo > oldElo) {
    publishActivityEvent({
      eventType: "rank_up",
      title: `promoted to ${newRank}`,
      description: `ELO ${newElo}`,
      metadata: { oldRank, newRank, elo: newElo },
    });
  } else if (delta > 0) {
    publishActivityEvent({
      eventType: "elo_gain",
      title: `gained ${delta} ELO`,
      description: `Now at ${newElo} ELO`,
      metadata: { delta, elo: newElo },
    });
  }

  if (sessionScore >= 90) {
    publishActivityEvent({
      eventType: "high_score",
      title: `scored ${sessionScore} in a session`,
      metadata: { score: sessionScore },
    });
  }

  // Streak milestone events
  if (lastDate !== todayStr && [3, 7, 14, 30].includes(currentStreak)) {
    const streakLabels: Record<number, string> = { 3: "3-Day Consistency", 7: "Weekly Warrior", 14: "Two-Week Titan", 30: "30-Day Legend" };
    publishActivityEvent({
      eventType: "streak_milestone",
      title: `reached ${streakLabels[currentStreak]} streak`,
      description: `${currentStreak} consecutive days of practice`,
      metadata: { streak: currentStreak },
    });
  }

  if (placementComplete) {
    publishActivityEvent({
      eventType: "personal_best",
      title: `completed placement as ${newRank}`,
      description: `Calibrated at ${newElo} ELO`,
      metadata: { rank: newRank, elo: newElo },
    });
  }

  return {
    newElo,
    oldElo,
    delta,
    newRank,
    oldRank,
    rankedUp: newRank !== oldRank && newElo > oldElo,
    placementComplete,
    totalSessions: newTotalSessions,
    currentStreak,
    longestStreak,
  };
}
