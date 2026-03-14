/**
 * Daily Challenge system — one challenge per calendar day, local storage.
 */

import type { EnvironmentId } from "./environments";

const CHALLENGE_KEY = "salescalls_daily_challenge";
const COMPLETED_KEY = "salescalls_daily_completed";

export type SkillFocus =
  | "Objection Handling"
  | "Call Opening"
  | "Securing Next Step"
  | "Clarity Under Pressure"
  | "Executive Framing"
  | "Permission-Based Language"
  | "Storytelling";

export interface SuccessCondition {
  label: string;
  /** Evaluate after session ends */
  check: (opts: {
    score: number;
    peakDifficulty: number;
    userMessageCount: number;
    durationSeconds: number;
    hardCloseWin: boolean;
  }) => boolean;
}

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  environmentId: EnvironmentId;
  personaId: string;
  skillFocus: SkillFocus;
  successLabel: string;
  /** Serialisable key for the success condition */
  conditionKey: string;
}

interface StoredChallenge {
  challenge: DailyChallenge;
  completed: boolean;
}

// ---------- Challenge templates ----------

interface ChallengeTemplate {
  environmentId: EnvironmentId;
  personaId: string;
  skillFocus: SkillFocus;
  successLabel: string;
  conditionKey: string;
}

const TEMPLATES: ChallengeTemplate[] = [
  // Cold Call
  {
    environmentId: "cold-call",
    personaId: "gatekeeper",
    skillFocus: "Call Opening",
    successLabel: "Earn permission in under 3 turns",
    conditionKey: "score_60",
  },
  {
    environmentId: "cold-call",
    personaId: "gatekeeper",
    skillFocus: "Clarity Under Pressure",
    successLabel: "Score 65+",
    conditionKey: "score_65",
  },
  {
    environmentId: "cold-call",
    personaId: "b2b-prospect",
    skillFocus: "Securing Next Step",
    successLabel: "Ask for a next step and score 60+",
    conditionKey: "score_60",
  },
  {
    environmentId: "cold-call",
    personaId: "b2b-prospect",
    skillFocus: "Permission-Based Language",
    successLabel: "Score 70+",
    conditionKey: "score_70",
  },
  // Interview
  {
    environmentId: "interview",
    personaId: "hiring-manager",
    skillFocus: "Storytelling",
    successLabel: "Score 70+",
    conditionKey: "score_70",
  },
  {
    environmentId: "interview",
    personaId: "hiring-manager",
    skillFocus: "Clarity Under Pressure",
    successLabel: "Reach difficulty Level 2",
    conditionKey: "difficulty_2",
  },
  // Enterprise
  {
    environmentId: "enterprise",
    personaId: "technical-evaluator",
    skillFocus: "Objection Handling",
    successLabel: "Score 65+ against evaluator",
    conditionKey: "score_65",
  },
  {
    environmentId: "enterprise",
    personaId: "technical-evaluator",
    skillFocus: "Executive Framing",
    successLabel: "Reach difficulty Level 3",
    conditionKey: "difficulty_3",
  },
  {
    environmentId: "enterprise",
    personaId: "champion",
    skillFocus: "Securing Next Step",
    successLabel: "Land a hard close win",
    conditionKey: "hard_close",
  },
  {
    environmentId: "enterprise",
    personaId: "champion",
    skillFocus: "Objection Handling",
    successLabel: "Score 70+",
    conditionKey: "score_70",
  },
];

// ---------- Deterministic daily pick ----------

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Simple date-based hash to pick a template index */
function dateSeed(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateForDate(date: string): DailyChallenge {
  const idx = dateSeed(date) % TEMPLATES.length;
  const t = TEMPLATES[idx];
  return { date, ...t };
}

// ---------- Public API ----------

export function getTodayChallenge(): StoredChallenge {
  const today = getToday();
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY);
    if (raw) {
      const stored: StoredChallenge = JSON.parse(raw);
      if (stored.challenge.date === today) return stored;
    }
  } catch { /* ignore */ }

  // Generate new
  const challenge = generateForDate(today);
  const stored: StoredChallenge = { challenge, completed: false };
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(stored));
  return stored;
}

export function isChallengeCompleted(): boolean {
  return getTodayChallenge().completed;
}

export function checkChallengeCondition(
  conditionKey: string,
  opts: {
    score: number;
    peakDifficulty: number;
    userMessageCount: number;
    durationSeconds: number;
    hardCloseWin: boolean;
  }
): boolean {
  switch (conditionKey) {
    case "score_60": return opts.score >= 60;
    case "score_65": return opts.score >= 65;
    case "score_70": return opts.score >= 70;
    case "difficulty_2": return opts.peakDifficulty >= 2;
    case "difficulty_3": return opts.peakDifficulty >= 3;
    case "hard_close": return opts.hardCloseWin;
    default: return false;
  }
}

export function markChallengeCompleted(): void {
  const stored = getTodayChallenge();
  stored.completed = true;
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(stored));
}

export const CHALLENGE_BONUS_POINTS = 25;

/** ELO bonus for daily challenge top finishers */
export const DAILY_ELO_BONUSES: Record<number, number> = { 1: 30, 2: 20, 3: 10 };
