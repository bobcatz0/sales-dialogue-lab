/**
 * SDR Interview Track — structured 3-round progression for SDR candidates.
 */

const TRACK_STORAGE_KEY = "salescalls_sdr_track";

export interface SDRRound {
  id: "behavioral" | "cold-call-sim" | "objection-drill";
  number: 1 | 2 | 3;
  title: string;
  description: string;
  /** The persona id to use for this round */
  personaId: string;
  /** Environment prompt addendum specific to this round */
  promptAddendum: string;
}

export interface SDRTrackProgress {
  rounds: {
    [roundId: string]: {
      completed: boolean;
      score: number;
      peakDifficulty: number;
      date: string;
    };
  };
  trackCompleted: boolean;
  completedDate?: string;
}

export const SDR_ROUNDS: SDRRound[] = [
  {
    id: "behavioral",
    number: 1,
    title: "Round 1 — Behavioral Fit",
    description: "Motivation, resilience, rejection handling. Scored on clarity and ownership.",
    personaId: "sdr-behavioral",
    promptAddendum: `SDR TRACK — ROUND 1: BEHAVIORAL FIT
Focus questions on: motivation for sales, resilience under pressure, handling rejection, ownership of outcomes.
Scoring emphasis: Clarity (40%), Ownership language (30%), Specific examples (30%).
Probe on vague answers aggressively. Require real examples with outcomes. If the candidate says "I worked hard" without specifics, push back: "What did that look like day-to-day?"`,
  },
  {
    id: "cold-call-sim",
    number: 2,
    title: "Round 2 — Cold Call Simulation",
    description: "Live prospecting call with gatekeeper pressure. Must earn permission and ask for next step.",
    personaId: "sdr-coldcall",
    promptAddendum: `SDR TRACK — ROUND 2: COLD CALL SIMULATION
This is a simulated cold call to a mid-market company. The candidate must:
1. Open with a clear, concise reason for calling (first 10 seconds matters).
2. Earn permission to continue the conversation.
3. Ask at least one discovery question.
4. Propose a specific next step before the call ends.
Gatekeeper pressure is ACTIVE. If the opening is weak, push back immediately. If no next step is proposed, the call should feel unresolved.`,
  },
  {
    id: "objection-drill",
    number: 3,
    title: "Round 3 — Objection Handling Drill",
    description: "Rapid objections on budget, competitors, and timing. Must respond concisely under pressure.",
    personaId: "sdr-objections",
    promptAddendum: `SDR TRACK — ROUND 3: OBJECTION HANDLING DRILL
Fire rapid objections at the candidate. Rotate through these:
- "We already use [competitor]."
- "Just send me an email."
- "We don't have budget for this."
- "Now's not a good time."
- "I'm not the right person."
- "How is this different from what we have?"
Ask 4-6 objections total. After each response, move to the next objection quickly — don't let the candidate relax. If responses are vague or overly long, interrupt: "Shorter. What's the one reason I should care?"
Scoring emphasis: Conciseness (35%), Composure (25%), Specificity (25%), Recovery speed (15%).`,
  },
];

export function loadSDRTrackProgress(): SDRTrackProgress {
  try {
    const raw = localStorage.getItem(TRACK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { rounds: {}, trackCompleted: false };
}

function saveSDRTrackProgress(progress: SDRTrackProgress) {
  localStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(progress));
}

export function completeSDRRound(
  roundId: string,
  score: number,
  peakDifficulty: number
): SDRTrackProgress {
  const progress = loadSDRTrackProgress();
  progress.rounds[roundId] = {
    completed: true,
    score,
    peakDifficulty,
    date: new Date().toISOString(),
  };

  // Check track completion: all 3 rounds done, avg 70+, at least one Level 3
  const allRounds = SDR_ROUNDS.map((r) => progress.rounds[r.id]);
  const allCompleted = allRounds.every((r) => r?.completed);

  if (allCompleted) {
    const avgScore = allRounds.reduce((sum, r) => sum + (r?.score || 0), 0) / allRounds.length;
    const hasLevel3 = allRounds.some((r) => (r?.peakDifficulty || 0) >= 3);

    if (avgScore >= 70 && hasLevel3) {
      progress.trackCompleted = true;
      progress.completedDate = new Date().toISOString();
    }
  }

  saveSDRTrackProgress(progress);
  return progress;
}

export function getSDRTrackSummary(progress: SDRTrackProgress): {
  completedCount: number;
  totalRounds: number;
  averageScore: number;
  hasLevel3: boolean;
  isComplete: boolean;
} {
  const rounds = SDR_ROUNDS.map((r) => progress.rounds[r.id]).filter((r) => r?.completed);
  const avgScore = rounds.length > 0
    ? Math.round(rounds.reduce((s, r) => s + (r?.score || 0), 0) / rounds.length)
    : 0;

  return {
    completedCount: rounds.length,
    totalRounds: SDR_ROUNDS.length,
    averageScore: avgScore,
    hasLevel3: rounds.some((r) => (r?.peakDifficulty || 0) >= 3),
    isComplete: progress.trackCompleted,
  };
}
