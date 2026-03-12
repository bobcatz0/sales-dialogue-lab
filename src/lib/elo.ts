/**
 * ELO rating system for sales practice sessions.
 * Users start at 1000. Gain/lose based on session score vs expected performance.
 * 
 * Rank tiers are percentile-based — thresholds are computed from the
 * distribution of all placed users. When fewer than 20 placed users exist,
 * static fallbacks are used.
 */

const K_FACTOR = 32;

/** Percentile targets for each rank (cumulative from bottom). */
export const RANK_PERCENTILES = [
  { name: "Rookie",          percentile: 0 },
  { name: "Prospector",      percentile: 20 },
  { name: "Closer",          percentile: 50 },
  { name: "Operator",        percentile: 75 },
  { name: "Rainmaker",       percentile: 90 },
  { name: "Sales Architect", percentile: 97 },
] as const;

/** Static fallback thresholds used when population is small. */
export const DEFAULT_RANK_THRESHOLDS = [
  { name: "Rookie",          min: 0 },
  { name: "Prospector",      min: 900 },
  { name: "Closer",          min: 1100 },
  { name: "Operator",        min: 1300 },
  { name: "Rainmaker",       min: 1500 },
  { name: "Sales Architect", min: 1800 },
] as const;

export interface RankThreshold {
  name: string;
  min: number;
}

// ── Dynamic threshold cache ──────────────────────────────────────────
let _thresholds: RankThreshold[] = [...DEFAULT_RANK_THRESHOLDS];

/** Replace cached thresholds (called by useRankThresholds). */
export function setRankThresholds(thresholds: RankThreshold[]) {
  if (thresholds.length === RANK_PERCENTILES.length) {
    _thresholds = thresholds;
  }
}

/** Get the current cached thresholds. */
export function getRankThresholds(): readonly RankThreshold[] {
  return _thresholds;
}

// Keep backward compat alias
export const ELO_RANKS = _thresholds;

export type RankTier = (typeof RANK_PERCENTILES)[number]["name"];

export function getEloRank(elo: number): RankTier {
  const t = _thresholds;
  for (let i = t.length - 1; i >= 0; i--) {
    if (elo >= t[i].min) return t[i].name as RankTier;
  }
  return "Rookie";
}

/**
 * Calculate ELO change after a session.
 * sessionScore: 0-100 score from the AI evaluator
 * currentElo: user's current ELO rating
 * Returns the delta (can be negative).
 */
export function calculateEloDelta(sessionScore: number, currentElo: number): number {
  // Normalize session score to 0-1
  const actual = sessionScore / 100;

  // Expected performance based on ELO (higher ELO = higher expectations)
  // At 1000 ELO, expected ~0.5; at 1500, expected ~0.73
  const expected = 1 / (1 + Math.pow(10, (1200 - currentElo) / 400));

  const delta = Math.round(K_FACTOR * (actual - expected));
  return delta;
}
