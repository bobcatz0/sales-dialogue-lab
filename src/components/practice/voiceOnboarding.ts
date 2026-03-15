/**
 * Voice mode onboarding state — persisted to localStorage.
 * Tracks whether the user has seen the onboarding modal and
 * how many voice sessions they have started.
 */

const VOICE_ONBOARDING_KEY = "salescalls_voice_onboarding";

interface VoiceOnboardingData {
  hasSeenModal: boolean;
  voiceSessionCount: number;
}

function load(): VoiceOnboardingData {
  try {
    const raw = localStorage.getItem(VOICE_ONBOARDING_KEY);
    if (raw) return JSON.parse(raw) as VoiceOnboardingData;
  } catch { /* ignore */ }
  return { hasSeenModal: false, voiceSessionCount: 0 };
}

function save(data: VoiceOnboardingData): void {
  try {
    localStorage.setItem(VOICE_ONBOARDING_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

/** True after the user has dismissed the Voice Mode onboarding modal. */
export function hasSeenVoiceOnboarding(): boolean {
  return load().hasSeenModal;
}

/** Mark the onboarding modal as seen. */
export function setSeenVoiceOnboarding(): void {
  const data = load();
  data.hasSeenModal = true;
  save(data);
}

/** Number of voice sessions the user has started. */
export function getVoiceSessionCount(): number {
  return load().voiceSessionCount;
}

/** Call when a voice session successfully starts. */
export function incrementVoiceSessionCount(): void {
  const data = load();
  data.voiceSessionCount += 1;
  save(data);
}

// ---------------------------------------------------------------------------
// Voice score persistence — per-role voice score history
// ---------------------------------------------------------------------------

const VOICE_SCORES_KEY = "salescalls_voice_scores";

type VoiceScoreRecord = Record<string, number[]>; // roleId → scores (oldest first)

function loadVoiceScores(): VoiceScoreRecord {
  try {
    const raw = localStorage.getItem(VOICE_SCORES_KEY);
    if (raw) return JSON.parse(raw) as VoiceScoreRecord;
  } catch { /* ignore */ }
  return {};
}

function saveVoiceScores(scores: VoiceScoreRecord): void {
  try {
    localStorage.setItem(VOICE_SCORES_KEY, JSON.stringify(scores));
  } catch { /* ignore */ }
}

/**
 * Returns the highest voice score the user achieved for this role
 * BEFORE the current session (i.e., excluding the score about to be recorded).
 * Returns null if there is no prior history.
 */
export function getVoicePreviousBest(roleId: string): number | null {
  const scores = loadVoiceScores();
  const list = scores[roleId];
  if (!list || list.length === 0) return null;
  return Math.max(...list);
}

/**
 * Persist a completed voice session score for a role.
 * Keeps the last 20 scores per role to bound storage size.
 */
export function recordVoiceScore(roleId: string, score: number): void {
  const scores = loadVoiceScores();
  if (!scores[roleId]) scores[roleId] = [];
  scores[roleId].push(score);
  if (scores[roleId].length > 20) scores[roleId] = scores[roleId].slice(-20);
  saveVoiceScores(scores);
}

// ---------------------------------------------------------------------------
// Starter scenario list
// ---------------------------------------------------------------------------

/**
 * The 3 introductory voice scenarios shown to first-time voice users.
 * Other voice roles are hidden until after session 1.
 */
export const VOICE_STARTER_ROLE_IDS = [
  "voice-cold-opener",
  "voice-send-email",
  "voice-vendor-objection",
] as const;
