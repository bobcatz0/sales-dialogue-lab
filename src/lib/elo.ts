/**
 * ELO rating system for sales practice sessions.
 * Users start at 1000. Gain/lose based on session score vs expected performance.
 */

const K_FACTOR = 32;

export const ELO_RANKS = [
  { name: "Rookie", min: 0 },
  { name: "Prospector", min: 900 },
  { name: "Closer", min: 1100 },
  { name: "Operator", min: 1300 },
  { name: "Rainmaker", min: 1500 },
  { name: "Sales Architect", min: 1800 },
] as const;

export type RankTier = (typeof ELO_RANKS)[number]["name"];

export function getEloRank(elo: number): RankTier {
  for (let i = ELO_RANKS.length - 1; i >= 0; i--) {
    if (elo >= ELO_RANKS[i].min) return ELO_RANKS[i].name;
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
