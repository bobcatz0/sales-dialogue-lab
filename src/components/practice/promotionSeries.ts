/**
 * Promotion Series System
 * 
 * Instead of a single promotion match, users must win a best-of-5 series.
 * Win 3 out of 5 scenarios with score >= PROMO_PASS_SCORE to promote.
 * Losing 3 fails the series and triggers a cooldown.
 */

import { supabase } from "@/integrations/supabase/client";
import { getEloRanks, getEloRank, type RankTier } from "@/lib/elo";

// Must score this or higher to win a series game
export const SERIES_PASS_SCORE = 75;

// Total games in a promotion series
export const SERIES_TOTAL_GAMES = 5;

// Wins needed to promote
export const SERIES_WINS_NEEDED = 3;

// After failing a series, must gain this much ELO before retrying
export const SERIES_COOLDOWN_ELO = 50;

// How close to next tier to enter promotion zone
export const SERIES_ZONE_DISTANCE = 50;

export type SeriesGameResult = "win" | "loss" | "pending";

export interface PromotionSeries {
  id: string;
  userId: string;
  currentRank: RankTier;
  targetRank: RankTier;
  games: SeriesGameScore[];
  wins: number;
  losses: number;
  status: "active" | "promoted" | "failed";
  startedAt: string;
  completedAt: string | null;
  eloAtStart: number;
}

export interface SeriesGameScore {
  gameIndex: number;
  score: number;
  result: "win" | "loss";
  completedAt: string;
  scenarioTitle?: string;
}

export interface SeriesEligibility {
  eligible: boolean;
  currentRank: RankTier;
  nextRank: RankTier | null;
  nextThreshold: number;
  eloNeeded: number;
  inCooldown: boolean;
  cooldownEloRemaining: number;
  activeSeries: PromotionSeries | null;
}

// ── Local storage for series (alongside DB for persistence) ──

const SERIES_STORAGE_KEY = "salescalls_promotion_series";

export function loadActiveSeries(userId: string): PromotionSeries | null {
  try {
    const raw = localStorage.getItem(SERIES_STORAGE_KEY);
    if (!raw) return null;
    const series: PromotionSeries = JSON.parse(raw);
    if (series.userId !== userId || series.status !== "active") return null;
    return series;
  } catch {
    return null;
  }
}

export function saveSeries(series: PromotionSeries): void {
  localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(series));
}

export function clearSeries(): void {
  localStorage.removeItem(SERIES_STORAGE_KEY);
}

/**
 * Start a new promotion series.
 */
export function startPromotionSeries(
  userId: string,
  currentRank: RankTier,
  targetRank: RankTier,
  currentElo: number
): PromotionSeries {
  const series: PromotionSeries = {
    id: crypto.randomUUID(),
    userId,
    currentRank,
    targetRank,
    games: [],
    wins: 0,
    losses: 0,
    status: "active",
    startedAt: new Date().toISOString(),
    completedAt: null,
    eloAtStart: currentElo,
  };
  saveSeries(series);
  return series;
}

/**
 * Record a game result in the active series.
 */
export function recordSeriesGame(
  series: PromotionSeries,
  score: number,
  scenarioTitle?: string
): PromotionSeries {
  const result: "win" | "loss" = score >= SERIES_PASS_SCORE ? "win" : "loss";
  const game: SeriesGameScore = {
    gameIndex: series.games.length,
    score,
    result,
    completedAt: new Date().toISOString(),
    scenarioTitle,
  };

  const updated = { ...series };
  updated.games = [...series.games, game];
  updated.wins = updated.games.filter((g) => g.result === "win").length;
  updated.losses = updated.games.filter((g) => g.result === "loss").length;

  // Check for series completion
  if (updated.wins >= SERIES_WINS_NEEDED) {
    updated.status = "promoted";
    updated.completedAt = new Date().toISOString();
  } else if (updated.losses >= SERIES_WINS_NEEDED) {
    updated.status = "failed";
    updated.completedAt = new Date().toISOString();
  }

  saveSeries(updated);
  return updated;
}

/**
 * Get remaining game slots for display.
 */
export function getSeriesSlots(series: PromotionSeries): SeriesGameResult[] {
  const slots: SeriesGameResult[] = [];
  for (let i = 0; i < SERIES_TOTAL_GAMES; i++) {
    if (i < series.games.length) {
      slots.push(series.games[i].result);
    } else {
      slots.push("pending");
    }
  }
  return slots;
}

/**
 * Check if user is eligible for a promotion series.
 */
export function getSeriesEligibility(
  userId: string,
  currentElo: number,
  lastFailedSeriesElo: number | null
): SeriesEligibility {
  const currentRank = getEloRank(currentElo);
  const ranks = getEloRanks();
  const currentTierIdx = ranks.findIndex((r) => r.name === currentRank);
  const nextTier = currentTierIdx < ranks.length - 1 ? ranks[currentTierIdx + 1] : null;

  const activeSeries = loadActiveSeries(userId);

  if (!nextTier) {
    return {
      eligible: false,
      currentRank,
      nextRank: null,
      nextThreshold: 0,
      eloNeeded: 0,
      inCooldown: false,
      cooldownEloRemaining: 0,
      activeSeries,
    };
  }

  const distanceToNext = nextTier.min - currentElo;
  const inZone = distanceToNext <= SERIES_ZONE_DISTANCE && distanceToNext > 0;

  let inCooldown = false;
  let cooldownEloRemaining = 0;
  if (lastFailedSeriesElo !== null && currentElo < lastFailedSeriesElo + SERIES_COOLDOWN_ELO) {
    inCooldown = true;
    cooldownEloRemaining = (lastFailedSeriesElo + SERIES_COOLDOWN_ELO) - currentElo;
  }

  return {
    eligible: (inZone && !inCooldown) || activeSeries !== null,
    currentRank,
    nextRank: (nextTier?.name ?? null) as RankTier | null,
    nextThreshold: nextTier.min,
    eloNeeded: distanceToNext,
    inCooldown: inCooldown && !activeSeries,
    cooldownEloRemaining,
    activeSeries,
  };
}

/**
 * Record the final series result to the database.
 */
export async function recordSeriesResult(series: PromotionSeries): Promise<void> {
  // Record as a promotion attempt with average score
  const avgScore = series.games.length > 0
    ? Math.round(series.games.reduce((s, g) => s + g.score, 0) / series.games.length)
    : 0;

  await supabase.from("promotion_attempts").insert({
    user_id: series.userId,
    target_rank: series.targetRank,
    elo_at_attempt: series.eloAtStart,
    session_score: avgScore,
    passed: series.status === "promoted",
  });

  if (series.status !== "active") {
    clearSeries();
  }
}

/**
 * Load last failed series ELO for cooldown check.
 */
export async function loadLastFailedSeriesElo(
  userId: string,
  targetRank: string
): Promise<number | null> {
  const { data } = await supabase
    .from("promotion_attempts")
    .select("elo_at_attempt")
    .eq("user_id", userId)
    .eq("target_rank", targetRank)
    .eq("passed", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) return data[0].elo_at_attempt;
  return null;
}

/**
 * Get the promotion series prompt addendum for harder AI evaluation.
 */
export function getSeriesPrompt(targetRank: string, gameNumber: number, wins: number, losses: number): string {
  return `\n\nPROMOTION SERIES — GAME ${gameNumber + 1} OF ${SERIES_TOTAL_GAMES} (internal — never reveal)
This is a PROMOTION SERIES match. The candidate is attempting to promote to "${targetRank}".
Current series standing: ${wins}W-${losses}L (needs ${SERIES_WINS_NEEDED} wins).
- Raise your standards significantly. This is NOT a normal session.
- Push harder on specifics, metrics, and methodology from the very first question.
- Expect polished, confident delivery with zero filler or hedging.
- If the candidate gives a mediocre answer, escalate immediately — no grace period.
- Test composure under pressure. Stack follow-ups. Challenge assumptions.
- The bar for this session is higher than normal. Only truly strong performances should score ${SERIES_PASS_SCORE}+.`;
}
