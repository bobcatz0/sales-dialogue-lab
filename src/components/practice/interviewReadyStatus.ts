/**
 * Interview Ready status — earned credibility signal for strong Final Round performers.
 * Persisted in localStorage with decay logic.
 */

const STATUS_KEY = "salescalls_interview_ready";

export interface InterviewReadyStatus {
  granted: boolean;
  grantedDate: string; // ISO
  score: number;
  alias: string | null;
  revokedReason?: "score_drop" | "expired";
}

function load(): InterviewReadyStatus | null {
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InterviewReadyStatus;
  } catch {
    return null;
  }
}

function save(status: InterviewReadyStatus) {
  localStorage.setItem(STATUS_KEY, JSON.stringify(status));
}

/**
 * Check if Interview Ready status is currently valid.
 * Revokes if 30 days have passed.
 */
export function getInterviewReadyStatus(): InterviewReadyStatus | null {
  const status = load();
  if (!status || !status.granted) return null;

  // Check 30-day expiry
  const grantedDate = new Date(status.grantedDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - grantedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 30) {
    const revoked: InterviewReadyStatus = {
      ...status,
      granted: false,
      revokedReason: "expired",
    };
    save(revoked);
    return null;
  }

  return status;
}

/**
 * Grant Interview Ready status after qualifying Final Round session.
 */
export function grantInterviewReady(score: number, alias: string | null) {
  const status: InterviewReadyStatus = {
    granted: true,
    grantedDate: new Date().toISOString(),
    score,
    alias,
  };
  save(status);
}

/**
 * Check if a new session score should revoke status.
 * Called after any session completion.
 */
export function checkStatusRevocation(newScore: number): boolean {
  const status = load();
  if (!status || !status.granted) return false;

  if (newScore < 70) {
    const revoked: InterviewReadyStatus = {
      ...status,
      granted: false,
      revokedReason: "score_drop",
    };
    save(revoked);
    return true;
  }

  return false;
}

/**
 * Qualify check — should Interview Ready be granted?
 */
export function qualifiesForInterviewReady(opts: {
  isFinalRound: boolean;
  score: number;
  hasCriticalWeakness: boolean;
}): boolean {
  return opts.isFinalRound && opts.score >= 85 && !opts.hasCriticalWeakness;
}
