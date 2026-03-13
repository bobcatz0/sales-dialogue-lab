/**
 * Promotion Series — triggered when a player enters the top threshold zone
 * of a rank. Best of 3: win 2 to rank up, lose 2 and the promotion fails.
 */

import { getRank } from "./progression";
import { adjustConsistencyScore } from "./consistencyScoring";

const PROMO_KEY = "salescalls_promo_series";

// Points before the next rank threshold that trigger a promo series
const PROMO_ZONE_MARGIN = 20;

// Session AI score required to count as a series win
const WIN_SCORE_THRESHOLD = 65;

// Points awarded to push score over the threshold on a series win
const WIN_BOOST = 5;

// Points docked on a series failure (floor = threshold - PROMO_ZONE_MARGIN)
const FAIL_PENALTY = 18;

export type PromoStatus = "idle" | "active" | "won" | "failed";

export interface PromoSeriesState {
  status: PromoStatus;
  fromRank: string;
  toRank: string;
  wins: number;
  losses: number;
}

const DEFAULT_STATE: PromoSeriesState = {
  status: "idle",
  fromRank: "",
  toRank: "",
  wins: 0,
  losses: 0,
};

// Rank order and thresholds (must stay in sync with progression.ts)
const RANK_ORDER = ["Rookie", "Starter", "Closer", "Operator", "Rainmaker"] as const;
const RANK_THRESHOLDS: Record<string, number> = {
  Starter: 100,
  Closer: 250,
  Operator: 500,
  Rainmaker: 800,
};

function getNextRank(rank: string): string | null {
  const idx = RANK_ORDER.indexOf(rank as typeof RANK_ORDER[number]);
  return idx >= 0 && idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
}

function getNextThreshold(rank: string): number | null {
  const next = getNextRank(rank);
  return next ? RANK_THRESHOLDS[next] ?? null : null;
}

function isInPromoZone(consistencyScore: number, rank: string): boolean {
  const threshold = getNextThreshold(rank);
  if (threshold === null) return false;
  return consistencyScore >= threshold - PROMO_ZONE_MARGIN;
}

export function loadPromoSeries(): PromoSeriesState {
  try {
    const raw = localStorage.getItem(PROMO_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE };
}

function savePromoSeries(state: PromoSeriesState) {
  localStorage.setItem(PROMO_KEY, JSON.stringify(state));
}

export function clearPromoSeries() {
  savePromoSeries({ ...DEFAULT_STATE });
}

/**
 * Called after each valid session. Takes the consistency score BEFORE and AFTER
 * the session's points were added, plus the AI session score (0-100).
 * Returns the new PromoSeriesState (also persisted to localStorage).
 * May mutate the consistency score (bonus on win, penalty on failure).
 */
export function processPromoSession(opts: {
  scoreBefore: number;
  scoreAfter: number;
  sessionScore: number;
  isValidSession: boolean;
}): PromoSeriesState {
  if (!opts.isValidSession) return loadPromoSeries();

  const state = loadPromoSeries();
  const rankBefore = getRank(opts.scoreBefore);
  const rankAfter = getRank(opts.scoreAfter);

  // --- Natural rank up (score crossed threshold without series) ---
  if (rankBefore !== rankAfter && state.status !== "active") {
    // Clear any stale state, celebrate natural rank-up
    const natural: PromoSeriesState = {
      status: "won",
      fromRank: rankBefore,
      toRank: rankAfter,
      wins: 1,
      losses: 0,
    };
    savePromoSeries(natural);
    return natural;
  }

  // --- Reset stale won/failed state at start of new session processing ---
  // (won/failed are transient: shown once, then cleared by next processPromoSession)
  if (state.status === "won" || state.status === "failed") {
    const rank = rankAfter;
    const nextRank = getNextRank(rank);
    if (isInPromoZone(opts.scoreAfter, rank) && nextRank) {
      // Re-enter promotion zone after reset
      const reentry: PromoSeriesState = {
        status: "active",
        fromRank: rank,
        toRank: nextRank,
        wins: 0,
        losses: 0,
      };
      savePromoSeries(reentry);
      return reentry;
    }
    savePromoSeries({ ...DEFAULT_STATE });
    return { ...DEFAULT_STATE };
  }

  const rank = rankAfter;
  const nextRank = getNextRank(rank);

  // --- Enter promo zone for the first time ---
  if (state.status === "idle" && isInPromoZone(opts.scoreAfter, rank) && nextRank) {
    const entry: PromoSeriesState = {
      status: "active",
      fromRank: rank,
      toRank: nextRank,
      wins: 0,
      losses: 0,
    };
    savePromoSeries(entry);
    return entry;
  }

  // --- Process active series ---
  if (state.status === "active") {
    const isWin = opts.sessionScore >= WIN_SCORE_THRESHOLD;
    const wins = state.wins + (isWin ? 1 : 0);
    const losses = state.losses + (isWin ? 0 : 1);
    const threshold = getNextThreshold(state.fromRank);

    if (wins >= 2) {
      // Series won — boost score over the rank threshold
      if (threshold !== null) {
        adjustConsistencyScore(WIN_BOOST, threshold + 1);
      }
      const won: PromoSeriesState = { ...state, status: "won", wins, losses };
      savePromoSeries(won);
      return won;
    }

    if (losses >= 2) {
      // Series failed — dock points (floor = threshold - PROMO_ZONE_MARGIN)
      const floor = threshold !== null ? threshold - PROMO_ZONE_MARGIN : 0;
      adjustConsistencyScore(-FAIL_PENALTY, floor);
      const failed: PromoSeriesState = { ...state, status: "failed", wins, losses };
      savePromoSeries(failed);
      return failed;
    }

    const ongoing: PromoSeriesState = { ...state, wins, losses };
    savePromoSeries(ongoing);
    return ongoing;
  }

  return state;
}
