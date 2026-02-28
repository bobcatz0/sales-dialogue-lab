/**
 * Controlled External Validation Mode.
 * Manages validation toggle, first-session tagging, exit questions, and friction markers.
 */

const VALIDATION_KEY = "salescalls_validation_mode";
const FIRST_SESSION_KEY = "salescalls_first_session_tag";
const EXIT_RESPONSES_KEY = "salescalls_exit_responses";
const FRICTION_MARKERS_KEY = "salescalls_friction_markers";

// --- Validation Mode Toggle ---

export function isValidationMode(): boolean {
  try {
    const val = localStorage.getItem(VALIDATION_KEY);
    // Default to true for v1 validation-ready release
    if (val === null) return true;
    return val === "true";
  } catch {
    return true;
  }
}

export function setValidationMode(enabled: boolean) {
  localStorage.setItem(VALIDATION_KEY, enabled ? "true" : "false");
}

// --- First-Session Tag ---

export interface FirstSessionTag {
  firstTime: boolean;
  score: number;
  weaknessCategory: string;
  retried: boolean;
  timestamp: string;
}

export function getFirstSessionTag(): FirstSessionTag | null {
  try {
    const raw = localStorage.getItem(FIRST_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function tagFirstSession(score: number, weaknessCategory: string) {
  if (getFirstSessionTag()) return; // already tagged
  const tag: FirstSessionTag = {
    firstTime: true,
    score,
    weaknessCategory,
    retried: false,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(FIRST_SESSION_KEY, JSON.stringify(tag));
}

export function markFirstSessionRetried() {
  const tag = getFirstSessionTag();
  if (!tag) return;
  tag.retried = true;
  localStorage.setItem(FIRST_SESSION_KEY, JSON.stringify(tag));
}

export function isFirstCompletedSession(): boolean {
  return !getFirstSessionTag();
}

// --- Exit Question Responses ---

export interface ExitResponse {
  response: "yes" | "maybe" | "no";
  timestamp: string;
  sessionScore: number;
}

export function saveExitResponse(response: "yes" | "maybe" | "no", sessionScore: number) {
  try {
    const raw = localStorage.getItem(EXIT_RESPONSES_KEY);
    const data: ExitResponse[] = raw ? JSON.parse(raw) : [];
    data.push({ response, timestamp: new Date().toISOString(), sessionScore });
    localStorage.setItem(EXIT_RESPONSES_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function hasAnsweredExitQuestion(): boolean {
  try {
    const raw = localStorage.getItem(EXIT_RESPONSES_KEY);
    return raw ? JSON.parse(raw).length > 0 : false;
  } catch {
    return false;
  }
}

// --- Friction Markers ---

export interface FrictionMarkers {
  abandonPoints: { stage: string; timestamp: string }[];
  resumeSkips: number;
  finalRoundAvoids: number;
}

function loadFrictionMarkers(): FrictionMarkers {
  try {
    const raw = localStorage.getItem(FRICTION_MARKERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { abandonPoints: [], resumeSkips: 0, finalRoundAvoids: 0 };
}

function saveFrictionMarkers(data: FrictionMarkers) {
  localStorage.setItem(FRICTION_MARKERS_KEY, JSON.stringify(data));
}

export function trackAbandonPoint(stage: "env-selection" | "persona-selection" | "mid-session" | "pre-feedback") {
  const data = loadFrictionMarkers();
  data.abandonPoints.push({ stage, timestamp: new Date().toISOString() });
  localStorage.setItem(FRICTION_MARKERS_KEY, JSON.stringify(data));
}

export function trackFinalRoundAvoid() {
  const data = loadFrictionMarkers();
  data.finalRoundAvoids += 1;
  saveFrictionMarkers(data);
}

export function trackValidationResumeSkip() {
  const data = loadFrictionMarkers();
  data.resumeSkips += 1;
  saveFrictionMarkers(data);
}

// --- Hidden Environments in Validation Mode ---

export const VALIDATION_HIDDEN_ENVS = ["enterprise"] as const;
