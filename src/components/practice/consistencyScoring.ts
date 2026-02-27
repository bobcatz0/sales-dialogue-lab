import type { SessionRecord } from "./types";

const CONSISTENCY_KEY = "salescalls_consistency";
const STREAK_KEY = "salescalls_streak";

export interface ConsistencyData {
  score: number;
  currentStreak: number;
  bestStreak: number;
  lastSessionDate: string | null; // ISO date string (date only, no time)
  totalSessions: number;
  weeklyPoints: number;
  weekStart: string; // ISO date of Monday
  sessionsThisWeek: number;
}

// Difficulty tier bonuses per role
const DIFFICULTY_TIER: Record<string, number> = {
  "hiring-manager": 0,
  "b2b-prospect": 0,
  "follow-up": 10,
  "neutral": 0,
  "skeptical-buyer": 25,
  "decision-maker": 25,
  "gatekeeper": 40,
  "technical-evaluator": 40,
  "champion": 25,
};

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round(Math.abs(da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24));
}

export function loadConsistency(): ConsistencyData {
  try {
    const raw = localStorage.getItem(CONSISTENCY_KEY);
    if (raw) {
      const data = JSON.parse(raw) as ConsistencyData;
      // Reset weekly if new week
      const currentMonday = getMonday();
      if (data.weekStart !== currentMonday) {
        data.weeklyPoints = 0;
        data.sessionsThisWeek = 0;
        data.weekStart = currentMonday;
      }
      return data;
    }
  } catch { /* ignore */ }
  return {
    score: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastSessionDate: null,
    totalSessions: 0,
    weeklyPoints: 0,
    weekStart: getMonday(),
    sessionsThisWeek: 0,
  };
}

function saveConsistency(data: ConsistencyData) {
  localStorage.setItem(CONSISTENCY_KEY, JSON.stringify(data));
}

export interface SessionMeta {
  roleId: string;
  sessionScore: number;
  userMessageCount: number;
  durationSeconds: number;
  recentScores: number[]; // last 5 session scores before this one
}

export function processSession(meta: SessionMeta): { points: number; data: ConsistencyData } {
  const data = loadConsistency();
  const today = getToday();

  // Anti-spam check
  if (meta.durationSeconds < 90 || meta.userMessageCount < 6) {
    return { points: 0, data };
  }

  // Base points
  let points = 10;

  // Streak logic
  if (data.lastSessionDate) {
    const gap = daysBetween(data.lastSessionDate, today);
    if (data.lastSessionDate === today) {
      // Same day — streak unchanged, no extra streak bonus beyond existing
    } else if (gap === 1) {
      data.currentStreak += 1;
    } else {
      data.currentStreak = 1; // reset
    }
  } else {
    data.currentStreak = 1;
  }

  // Streak bonus: +5 per streak day, cap 50
  const streakBonus = Math.min(data.currentStreak * 5, 50);
  points += streakBonus;

  // Difficulty tier bonus
  const tierBonus = DIFFICULTY_TIER[meta.roleId] ?? 0;
  points += tierBonus;

  // Improvement bonus (0-30)
  if (meta.recentScores.length >= 2) {
    const recentAvg = meta.recentScores.reduce((a, b) => a + b, 0) / meta.recentScores.length;
    const improvement = meta.sessionScore - recentAvg;
    const improvementBonus = Math.max(0, Math.min(30, Math.round(improvement * 0.6)));
    points += improvementBonus;
  }

  // Update data
  data.score = Math.min(1000, data.score + points);
  data.bestStreak = Math.max(data.bestStreak, data.currentStreak);
  data.lastSessionDate = today;
  data.totalSessions += 1;
  data.weeklyPoints += points;
  data.sessionsThisWeek += 1;

  saveConsistency(data);
  return { points, data };
}

export function resetConsistency() {
  localStorage.removeItem(CONSISTENCY_KEY);
}

// Helper to compute user profile stats from session history
export function computeProfileStats(sessions: SessionRecord[]) {
  const last10 = sessions.slice(0, 10);
  const avgScore = last10.length > 0
    ? Math.round(last10.reduce((s, r) => s + r.score, 0) / last10.length)
    : 0;

  // Most-practiced persona
  const counts: Record<string, number> = {};
  sessions.forEach((s) => { counts[s.roleId] = (counts[s.roleId] || 0) + 1; });
  const mostPracticed = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Improvement trend
  const recent5 = sessions.slice(0, 5);
  const prev5 = sessions.slice(5, 10);
  const recentAvg = recent5.length > 0 ? recent5.reduce((s, r) => s + r.score, 0) / recent5.length : 0;
  const prevAvg = prev5.length > 0 ? prev5.reduce((s, r) => s + r.score, 0) / prev5.length : 0;
  const trend = prev5.length > 0 ? (recentAvg > prevAvg ? "up" : recentAvg < prevAvg ? "down" : "flat") : "flat";

  return { avgScore, mostPracticed, trend };
}
