/**
 * Progression system — unlock personas based on milestones.
 * Stored in localStorage. No login required.
 */

import { loadConsistency } from "./consistencyScoring";

const PROGRESSION_KEY = "salescalls_progression";

export interface ProgressionData {
  completedValidSessions: number;
  highestSessionScore: number;
  reachedPeakDifficulty3: boolean; // completed a session at peak difficulty 3
  unlockedPersonas: string[]; // ids that have been unlocked (beyond defaults)
}

// Default unlocked personas
const DEFAULT_UNLOCKED = ["hiring-manager", "b2b-prospect"];

// Persona unlock rules
const UNLOCK_RULES: { id: string; label: string; description: string; check: (p: ProgressionData) => boolean }[] = [
  {
    id: "gatekeeper",
    label: "Gatekeeper",
    description: "Executive assistant who filters aggressively. Earn permission or get cut.",
    check: (p) => p.completedValidSessions >= 3,
  },
  {
    id: "technical-evaluator",
    label: "Technical Evaluator",
    description: "Asks how things actually work. Vague answers lose credibility fast.",
    check: (p) => p.highestSessionScore >= 65,
  },
  {
    id: "champion",
    label: "Internal Champion",
    description: "Friendly but needs help selling internally. Equip them or lose the deal.",
    check: (p) => p.reachedPeakDifficulty3,
  },
];

export function loadProgression(): ProgressionData {
  try {
    const raw = localStorage.getItem(PROGRESSION_KEY);
    if (raw) return JSON.parse(raw) as ProgressionData;
  } catch { /* ignore */ }
  return {
    completedValidSessions: 0,
    highestSessionScore: 0,
    reachedPeakDifficulty3: false,
    unlockedPersonas: [],
  };
}

function saveProgression(data: ProgressionData) {
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(data));
}

export function getAllUnlockedIds(data: ProgressionData): string[] {
  return [...DEFAULT_UNLOCKED, ...data.unlockedPersonas];
}

export function isPersonaUnlocked(personaId: string, data: ProgressionData): boolean {
  return DEFAULT_UNLOCKED.includes(personaId) || data.unlockedPersonas.includes(personaId);
}

export function getRank(consistencyScore: number): string {
  if (consistencyScore >= 800) return "Rainmaker";
  if (consistencyScore >= 500) return "Operator";
  if (consistencyScore >= 250) return "Closer";
  if (consistencyScore >= 100) return "Starter";
  return "Rookie";
}

export function getRankThresholds() {
  return [
    { name: "Rookie", min: 0 },
    { name: "Starter", min: 100 },
    { name: "Closer", min: 250 },
    { name: "Operator", min: 500 },
    { name: "Rainmaker", min: 800 },
  ];
}

/**
 * Called after a valid session ends. Updates progression data and returns
 * any newly unlocked persona ids.
 */
export function updateProgression(opts: {
  sessionScore: number;
  peakDifficulty: number;
  isValidSession: boolean; // passed anti-spam checks
}): { newUnlocks: { id: string; label: string; description: string }[]; data: ProgressionData } {
  const data = loadProgression();

  if (!opts.isValidSession) {
    return { newUnlocks: [], data };
  }

  data.completedValidSessions += 1;
  data.highestSessionScore = Math.max(data.highestSessionScore, opts.sessionScore);
  if (opts.peakDifficulty >= 3) {
    data.reachedPeakDifficulty3 = true;
  }

  // Check for new unlocks
  const newUnlocks: { id: string; label: string; description: string }[] = [];
  for (const rule of UNLOCK_RULES) {
    if (!data.unlockedPersonas.includes(rule.id) && rule.check(data)) {
      data.unlockedPersonas.push(rule.id);
      newUnlocks.push({ id: rule.id, label: rule.label, description: rule.description });
    }
  }

  saveProgression(data);
  return { newUnlocks, data };
}

export function getUnlockHint(personaId: string, data: ProgressionData): string | null {
  const rule = UNLOCK_RULES.find((r) => r.id === personaId);
  if (!rule || data.unlockedPersonas.includes(personaId)) return null;
  switch (personaId) {
    case "gatekeeper":
      return `Complete ${Math.max(0, 3 - data.completedValidSessions)} more valid session(s) to unlock`;
    case "technical-evaluator":
      return `Achieve a session score of 65+ to unlock (best: ${data.highestSessionScore})`;
    case "champion":
      return `Reach Peak Difficulty Level 3 in a session to unlock`;
    default:
      return null;
  }
}
