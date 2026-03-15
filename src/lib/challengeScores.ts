/**
 * Per-challenge score history.
 *
 * Keyed by "{date}:{personaId}" so each calendar-day challenge has its own
 * independent attempt log. Stored in localStorage.
 */

const SCORES_KEY = "salescalls_challenge_scores";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChallengeAttempt {
  timestamp: string;   // ISO
  score: number;       // 0–100
  conditionMet: boolean;
}

export interface ChallengeScoreRecord {
  challengeKey: string;
  attempts: ChallengeAttempt[]; // chronological, oldest first
  bestScore: number;
  avgScore: number;
}

/** Passed to FeedbackPanel and homepage when a challenge session ends. */
export interface ChallengeResult {
  currentScore: number;
  previousScore: number | null;  // score of the attempt before this one
  bestScore: number | null;      // best across all previous attempts (excl. current)
  percentile: number | null;     // 0–100 among all attempts incl. current; null if only 1 attempt
  attemptNumber: number;         // 1-based
  isPersonalBest: boolean;
  replayAvailable: boolean;
  /** currentScore − previousScore; null on first attempt */
  delta: number | null;
  /** currentScore − bestScore (negative = below best); null on first attempt */
  bestDelta: number | null;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

type ScoreStore = Record<string, ChallengeScoreRecord>;

function load(): ScoreStore {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(store: ScoreStore): void {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(store));
  } catch { /* ignore */ }
}

// ─── Key ─────────────────────────────────────────────────────────────────────

export function makeChallengeKey(date: string, personaId: string): string {
  return `${date}:${personaId}`;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getChallengeRecord(key: string): ChallengeScoreRecord | null {
  return load()[key] ?? null;
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Appends an attempt to the challenge's score history and recomputes
 * aggregate stats. Returns the updated record.
 */
export function recordChallengeAttempt(
  key: string,
  score: number,
  conditionMet: boolean,
): ChallengeScoreRecord {
  const store = load();
  const existing = store[key];

  const attempt: ChallengeAttempt = {
    timestamp: new Date().toISOString(),
    score,
    conditionMet,
  };

  const attempts = existing ? [...existing.attempts, attempt] : [attempt];
  const scores = attempts.map((a) => a.score);
  const bestScore = Math.max(...scores);
  const avgScore = Math.round(scores.reduce((s, x) => s + x, 0) / scores.length);

  const record: ChallengeScoreRecord = { challengeKey: key, attempts, bestScore, avgScore };
  store[key] = record;
  save(store);
  return record;
}

// ─── Compute result for display ───────────────────────────────────────────────

/**
 * Build a ChallengeResult after the current session score is known.
 * Call AFTER recordChallengeAttempt so the current attempt is already saved.
 */
export function computeChallengeResult(
  key: string,
  currentScore: number,
): ChallengeResult {
  const record = getChallengeRecord(key);

  if (!record || record.attempts.length === 0) {
    // Shouldn't happen since we always record first, but handle gracefully
    return {
      currentScore,
      previousScore: null,
      bestScore: null,
      percentile: null,
      attemptNumber: 1,
      isPersonalBest: true,
      replayAvailable: true,
      delta: null,
      bestDelta: null,
    };
  }

  const { attempts } = record;
  const attemptNumber = attempts.length;

  // "previous" = the attempt before this one (second-to-last)
  const previousScore = attemptNumber >= 2 ? attempts[attemptNumber - 2].score : null;

  // "best before this attempt" = max of all prior attempts (exclude current)
  const priorScores = attempts.slice(0, -1).map((a) => a.score);
  const bestBefore = priorScores.length > 0 ? Math.max(...priorScores) : null;

  // Percentile among all attempts (including this one): fraction below current
  const allScores = attempts.map((a) => a.score);
  const percentile =
    allScores.length >= 2
      ? Math.round(
          (allScores.filter((s) => s < currentScore).length / allScores.length) * 100,
        )
      : null;

  const isPersonalBest = bestBefore === null || currentScore > bestBefore;

  return {
    currentScore,
    previousScore,
    bestScore: bestBefore,
    percentile,
    attemptNumber,
    isPersonalBest,
    replayAvailable: true,
    delta: previousScore !== null ? currentScore - previousScore : null,
    bestDelta: bestBefore !== null ? currentScore - bestBefore : null,
  };
}
