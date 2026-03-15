import type { VoiceSessionRecord, VoiceRankingData } from "./types";

const VOICE_HISTORY_KEY = "salescalls_voice_history";
const VOICE_RANKING_KEY = "salescalls_voice_ranking";

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export function loadVoiceHistory(): VoiceSessionRecord[] {
  try {
    const raw = localStorage.getItem(VOICE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVoiceSession(session: VoiceSessionRecord): VoiceSessionRecord[] {
  const history = loadVoiceHistory();
  history.unshift(session);
  const trimmed = history.slice(0, 50);
  localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function loadVoiceRanking(): VoiceRankingData {
  try {
    const raw = localStorage.getItem(VOICE_RANKING_KEY);
    if (raw) {
      const data = JSON.parse(raw) as VoiceRankingData;
      const currentMonday = getMonday();
      if (data.weekStart !== currentMonday) {
        data.weeklyVoiceSessions = 0;
        data.weeklyVoicePoints = 0;
        data.weekStart = currentMonday;
      }
      return data;
    }
  } catch { /* ignore */ }
  return {
    bestVoiceScore: 0,
    totalVoiceSessions: 0,
    weeklyVoiceSessions: 0,
    weeklyVoicePoints: 0,
    weekStart: getMonday(),
    strongestSkill: null,
  };
}

function saveVoiceRanking(data: VoiceRankingData) {
  localStorage.setItem(VOICE_RANKING_KEY, JSON.stringify(data));
}

export interface VoiceSessionMeta {
  roleId: string;
  roleTitle: string;
  voiceScore: number;
  voiceRank: string;
  strongestSkill: string;
  weakestSkill: string;
}

/**
 * Process a completed voice session, updating ranking data and history.
 * Returns the voice points awarded and updated ranking data.
 */
export function processVoiceSession(meta: VoiceSessionMeta): {
  voicePoints: number;
  ranking: VoiceRankingData;
  session: VoiceSessionRecord;
} {
  const ranking = loadVoiceRanking();

  // Voice points: base 10 + bonus for strong scores
  let voicePoints = 10;
  if (meta.voiceScore >= 75) voicePoints += 20;
  else if (meta.voiceScore >= 60) voicePoints += 10;

  // Track best voice score
  ranking.bestVoiceScore = Math.max(ranking.bestVoiceScore, meta.voiceScore);
  ranking.totalVoiceSessions += 1;
  ranking.weeklyVoiceSessions += 1;
  ranking.weeklyVoicePoints += voicePoints;

  // Update strongest skill via history frequency
  const history = loadVoiceHistory();
  const skillCounts: Record<string, number> = {};
  history.slice(0, 19).forEach((s) => {
    skillCounts[s.strongestSkill] = (skillCounts[s.strongestSkill] || 0) + 1;
  });
  skillCounts[meta.strongestSkill] = (skillCounts[meta.strongestSkill] || 0) + 1;
  const topSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0];
  ranking.strongestSkill = topSkill ? topSkill[0] : meta.strongestSkill;

  saveVoiceRanking(ranking);

  const session: VoiceSessionRecord = {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    roleId: meta.roleId,
    roleTitle: meta.roleTitle,
    voiceScore: meta.voiceScore,
    voiceRank: meta.voiceRank,
    strongestSkill: meta.strongestSkill,
    weakestSkill: meta.weakestSkill,
    date: new Date().toISOString(),
  };

  saveVoiceSession(session);

  return { voicePoints, ranking, session };
}

/**
 * Compute voice-specific profile stats from session history.
 */
export function computeVoiceProfileStats(sessions: VoiceSessionRecord[]) {
  const last10 = sessions.slice(0, 10);
  const avgVoiceScore = last10.length > 0
    ? Math.round(last10.reduce((s, r) => s + r.voiceScore, 0) / last10.length)
    : 0;

  // Improvement trend
  const recent5 = sessions.slice(0, 5);
  const prev5 = sessions.slice(5, 10);
  const recentAvg = recent5.length > 0 ? recent5.reduce((s, r) => s + r.voiceScore, 0) / recent5.length : 0;
  const prevAvg = prev5.length > 0 ? prev5.reduce((s, r) => s + r.voiceScore, 0) / prev5.length : 0;
  const trend = prev5.length > 0 ? (recentAvg > prevAvg ? "up" : recentAvg < prevAvg ? "down" : "flat") : "flat";

  return { avgVoiceScore, trend };
}
