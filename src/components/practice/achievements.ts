/**
 * Achievements / Badges system — all local storage.
 */

const BADGES_KEY = "salescalls_badges";
const ALIAS_KEY = "salescalls_alias";

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: "shield" | "target" | "zap" | "flame" | "award" | "star" | "trophy" | "cpu";
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  // Skill badges
  { id: "gatekeeper-survivor", label: "Gatekeeper Survivor", description: "Completed a Gatekeeper session", icon: "shield" },
  { id: "evaluator-passed", label: "Evaluator Passed", description: "Scored 70+ vs Technical Evaluator", icon: "cpu" },
  { id: "champion-equipped", label: "Champion Equipped", description: "Completed a Champion session", icon: "trophy" },
  { id: "level3-pressure", label: "Level 3 Pressure", description: "Reached Peak Difficulty Level 3", icon: "zap" },
  // Consistency badges
  { id: "streak-3", label: "3-Day Streak", description: "Practiced 3 days in a row", icon: "flame" },
  { id: "streak-7", label: "7-Day Streak", description: "Practiced 7 days in a row", icon: "flame" },
  { id: "sessions-15", label: "15 Sessions", description: "Completed 15 valid sessions", icon: "target" },
  { id: "sessions-50", label: "50 Sessions", description: "Completed 50 valid sessions", icon: "star" },
];

export function loadEarnedBadges(): string[] {
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBadges(ids: string[]) {
  localStorage.setItem(BADGES_KEY, JSON.stringify(ids));
}

/**
 * Evaluate which badges should be newly awarded after a valid session.
 * Returns array of newly earned badge ids.
 */
export function evaluateBadges(opts: {
  roleId: string;
  sessionScore: number;
  peakDifficulty: number;
  currentStreak: number;
  totalValidSessions: number;
  isValidSession: boolean;
}): string[] {
  if (!opts.isValidSession) return [];

  const earned = loadEarnedBadges();
  const newBadges: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (!earned.includes(id) && condition) newBadges.push(id);
  };

  // Skill badges
  check("gatekeeper-survivor", opts.roleId === "gatekeeper");
  check("evaluator-passed", opts.roleId === "technical-evaluator" && opts.sessionScore >= 70);
  check("champion-equipped", opts.roleId === "champion");
  check("level3-pressure", opts.peakDifficulty >= 3);

  // Consistency badges
  check("streak-3", opts.currentStreak >= 3);
  check("streak-7", opts.currentStreak >= 7);
  check("sessions-15", opts.totalValidSessions >= 15);
  check("sessions-50", opts.totalValidSessions >= 50);

  if (newBadges.length > 0) {
    saveBadges([...earned, ...newBadges]);
  }

  return newBadges;
}

// --- Alias ---

export function loadAlias(): string | null {
  return localStorage.getItem(ALIAS_KEY);
}

export function saveAlias(alias: string) {
  localStorage.setItem(ALIAS_KEY, alias);
}

export function generateAlias(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Closer#${num}`;
}
