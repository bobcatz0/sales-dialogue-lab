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

/**
 * The 3 introductory voice scenarios shown to first-time voice users.
 * Other voice roles are hidden until after session 1.
 */
export const VOICE_STARTER_ROLE_IDS = [
  "voice-cold-opener",
  "voice-send-email",
  "voice-vendor-objection",
] as const;
