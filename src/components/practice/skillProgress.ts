// Skill Progress System — localStorage-based tracking

export interface SkillProgressData {
  objectionHandling: number;
  discoveryQuestions: number;
  communicationClarity: number;
  confidence: number;
  structuredResponses: number;
}

export interface StreakData {
  currentStreak: number;
  lastSessionDate: string; // ISO date string (YYYY-MM-DD)
}

export interface ProgressState {
  skills: SkillProgressData;
  totalSessions: number;
  streak: StreakData;
}

const STORAGE_KEY = "salescalls_skill_progress";

const DEFAULT_STATE: ProgressState = {
  skills: {
    objectionHandling: 0,
    discoveryQuestions: 0,
    communicationClarity: 0,
    confidence: 0,
    structuredResponses: 0,
  },
  totalSessions: 0,
  streak: { currentStreak: 0, lastSessionDate: "" },
};

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, skills: { ...DEFAULT_STATE.skills }, streak: { ...DEFAULT_STATE.streak } };
    return JSON.parse(raw) as ProgressState;
  } catch {
    return { ...DEFAULT_STATE, skills: { ...DEFAULT_STATE.skills }, streak: { ...DEFAULT_STATE.streak } };
  }
}

function saveProgress(state: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Map feedback skill names to our categories
const SKILL_MAP: Record<string, keyof SkillProgressData> = {
  "objection handling": "objectionHandling",
  "objections": "objectionHandling",
  "discovery": "discoveryQuestions",
  "discovery questions": "discoveryQuestions",
  "questioning": "discoveryQuestions",
  "clarity": "communicationClarity",
  "communication": "communicationClarity",
  "communication clarity": "communicationClarity",
  "articulation": "communicationClarity",
  "confidence": "confidence",
  "composure": "confidence",
  "poise": "confidence",
  "structure": "structuredResponses",
  "structured responses": "structuredResponses",
  "organization": "structuredResponses",
  "conciseness": "structuredResponses",
};

function mapSkillName(name: string): keyof SkillProgressData | null {
  const lower = name.toLowerCase().trim();
  if (SKILL_MAP[lower]) return SKILL_MAP[lower];
  // Partial match
  for (const [key, val] of Object.entries(SKILL_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

// Exponential moving average — weight new scores but keep history
function blend(current: number, newScore: number, sessions: number): number {
  if (sessions <= 1) return newScore;
  const weight = Math.min(0.4, 1 / sessions + 0.15);
  return Math.round(current * (1 - weight) + newScore * weight);
}

export function updateProgress(
  feedbackSkills: { name: string; score: number }[],
  overallScore: number
): ProgressState {
  const state = loadProgress();
  state.totalSessions += 1;

  // Update skills from feedback breakdown
  const matched = new Set<keyof SkillProgressData>();
  for (const s of feedbackSkills) {
    const key = mapSkillName(s.name);
    if (key) {
      state.skills[key] = blend(state.skills[key], s.score, state.totalSessions);
      matched.add(key);
    }
  }

  // For unmatched skills, blend with overall score at lower weight
  for (const key of Object.keys(state.skills) as (keyof SkillProgressData)[]) {
    if (!matched.has(key) && state.skills[key] === 0 && state.totalSessions === 1) {
      // First session — seed unmatched with a conservative estimate
      state.skills[key] = Math.round(overallScore * 0.85);
    }
  }

  // Update streak
  const t = today();
  const y = yesterday();
  if (state.streak.lastSessionDate === t) {
    // Already practiced today, no change
  } else if (state.streak.lastSessionDate === y) {
    state.streak.currentStreak += 1;
    state.streak.lastSessionDate = t;
  } else {
    state.streak.currentStreak = 1;
    state.streak.lastSessionDate = t;
  }

  saveProgress(state);
  return state;
}

// Level system
export interface SkillLevel {
  level: number;
  title: string;
  nextLevelAt: number | null; // null if max
}

const LEVEL_TIERS = [
  { min: 0, level: 1, title: "Beginner" },
  { min: 40, level: 2, title: "Learner" },
  { min: 60, level: 3, title: "Sales Explorer" },
  { min: 75, level: 4, title: "Deal Navigator" },
  { min: 90, level: 5, title: "Closer" },
];

export function getSkillLevel(score: number): SkillLevel {
  let current = LEVEL_TIERS[0];
  for (const tier of LEVEL_TIERS) {
    if (score >= tier.min) current = tier;
  }
  const nextTier = LEVEL_TIERS.find((t) => t.min > score);
  return {
    level: current.level,
    title: current.title,
    nextLevelAt: nextTier ? nextTier.min : null,
  };
}

export const SKILL_LABELS: Record<keyof SkillProgressData, string> = {
  objectionHandling: "Objection Handling",
  discoveryQuestions: "Discovery Questions",
  communicationClarity: "Communication Clarity",
  confidence: "Confidence & Composure",
  structuredResponses: "Structured Responses",
};
