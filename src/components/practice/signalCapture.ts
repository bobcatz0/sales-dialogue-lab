/**
 * Feedback Signal Capture — Validation Phase Only.
 * Collects structured session signals for manual realism review.
 * No auto-adjustments. All data stored locally.
 */

const SIGNAL_KEY = "salescalls_validation_signals";

export interface SessionSignal {
  id: string;
  timestamp: string;
  tag: "External Validation Session";
  // Key session metrics
  levelReached: number;
  weakSpotTriggers: number;
  recoverySuccessRate: number; // 0-1
  finalScore: number;
  finalRoundAttempted: boolean;
  interviewReadyAchieved: boolean;
  // Environment & persona
  environmentId: string;
  roleId: string;
  // Skill scores
  skillBreakdown?: { name: string; score: number }[];
  // Verbal readiness (if present)
  verbalReadinessScore?: number;
  // Duration & messages
  durationSeconds: number;
  userMessageCount: number;
  // Resume used
  resumeProvided: boolean;
  // Evaluator style
  evaluatorStyle?: string;
}

export interface DropOffSignal {
  timestamp: string;
  type: "session-exit" | "resume-skip" | "final-round-avoid";
  context?: string;
}

export interface FeedbackSignal {
  timestamp: string;
  response: "yes" | "maybe" | "no";
  finalScore: number;
  highestLevel: number;
  weaknessCategory: string;
}

export interface ValidationSignalStore {
  sessions: SessionSignal[];
  dropOffs: DropOffSignal[];
  feedbackResponses: FeedbackSignal[];
}

function loadSignals(): ValidationSignalStore {
  try {
    const raw = localStorage.getItem(SIGNAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { sessions: [], dropOffs: [], feedbackResponses: [] };
}

function saveSignals(data: ValidationSignalStore) {
  try {
    localStorage.setItem(SIGNAL_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// --- Session Signal Capture ---

export function captureSessionSignal(signal: Omit<SessionSignal, "id" | "timestamp" | "tag">) {
  const store = loadSignals();
  store.sessions.push({
    ...signal,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    tag: "External Validation Session",
  });
  saveSignals(store);
}

// --- Drop-Off Tracking ---

export function captureDropOff(type: DropOffSignal["type"], context?: string) {
  const store = loadSignals();
  store.dropOffs.push({
    timestamp: new Date().toISOString(),
    type,
    context,
  });
  saveSignals(store);
}

// --- Feedback Signal ---

export function captureFeedbackSignal(
  response: "yes" | "maybe" | "no",
  finalScore: number,
  highestLevel: number,
  weaknessCategory: string
) {
  const store = loadSignals();
  store.feedbackResponses.push({
    timestamp: new Date().toISOString(),
    response,
    finalScore,
    highestLevel,
    weaknessCategory,
  });
  saveSignals(store);
}

// --- Read (for debug/export) ---

export function getValidationSignals(): ValidationSignalStore {
  return loadSignals();
}

export function getSignalSummary(): {
  totalSessions: number;
  avgScore: number;
  avgLevel: number;
  recoveryRate: number;
  finalRoundRate: number;
  interviewReadyRate: number;
  dropOffCount: number;
  resumeSkipRate: number;
} {
  const store = loadSignals();
  const s = store.sessions;
  const total = s.length;
  if (total === 0) {
    return {
      totalSessions: 0, avgScore: 0, avgLevel: 0, recoveryRate: 0,
      finalRoundRate: 0, interviewReadyRate: 0, dropOffCount: 0, resumeSkipRate: 0,
    };
  }
  return {
    totalSessions: total,
    avgScore: Math.round(s.reduce((a, x) => a + x.finalScore, 0) / total),
    avgLevel: +(s.reduce((a, x) => a + x.levelReached, 0) / total).toFixed(1),
    recoveryRate: +(s.reduce((a, x) => a + x.recoverySuccessRate, 0) / total).toFixed(2),
    finalRoundRate: +(s.filter(x => x.finalRoundAttempted).length / total).toFixed(2),
    interviewReadyRate: +(s.filter(x => x.interviewReadyAchieved).length / total).toFixed(2),
    dropOffCount: store.dropOffs.length,
    resumeSkipRate: +(store.dropOffs.filter(d => d.type === "resume-skip").length / total).toFixed(2),
  };
}
