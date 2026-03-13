/**
 * Achievements / Badges system — all local storage.
 */

const BADGES_KEY = "salescalls_badges";
const ALIAS_KEY = "salescalls_alias";

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: "shield" | "target" | "zap" | "flame" | "award" | "star" | "trophy" | "cpu" | "swords";
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  // Skill milestones
  { id: "gatekeeper-survivor", label: "Gatekeeper Cleared", description: "Completed a Gatekeeper scenario", icon: "shield" },
  { id: "evaluator-passed", label: "Evaluator Passed", description: "Scored 70+ against Technical Evaluator", icon: "cpu" },
  { id: "champion-equipped", label: "Champion Equipped", description: "Completed an Internal Champion session", icon: "trophy" },
  { id: "level3-pressure", label: "High-Pressure Certified", description: "Reached high-pressure interaction level", icon: "zap" },
  { id: "sdr-interview-ready", label: "SDR Interview Ready", description: "Completed the SDR Interview Track", icon: "award" },
  // Consistency milestones
  { id: "streak-3", label: "3-Day Consistency", description: "Practiced 3 consecutive days", icon: "flame" },
  { id: "streak-7", label: "Weekly Warrior", description: "Practiced 7 consecutive days", icon: "flame" },
  { id: "streak-14", label: "Two-Week Titan", description: "Practiced 14 consecutive days", icon: "flame" },
  { id: "streak-30", label: "30-Day Legend", description: "Practiced 30 consecutive days — elite discipline", icon: "trophy" },
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
  check("streak-14", opts.currentStreak >= 14);
  check("streak-30", opts.currentStreak >= 30);
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
