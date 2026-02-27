/**
 * Friction & engagement tracking for soft launch analytics.
 * All data stored locally — no external calls.
 */

const TRACKING_KEY = "salescalls_tracking";

export interface TrackingData {
  interviewStatus: "interviewing" | "preparing" | "exploring" | null;
  earlyResets: number;
  sessionAbandons: number; // started but never ended
  resumeSkips: number; // started interview mode without resume
  helpfulResponses: { sessionIndex: number; response: string; timestamp: string }[];
  wouldRunAgain: { response: string; timestamp: string }[];
  completedSessions: number;
}

function loadTracking(): TrackingData {
  try {
    const raw = localStorage.getItem(TRACKING_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    interviewStatus: null,
    earlyResets: 0,
    sessionAbandons: 0,
    resumeSkips: 0,
    helpfulResponses: [],
    wouldRunAgain: [],
    completedSessions: 0,
  };
}

function saveTracking(data: TrackingData) {
  localStorage.setItem(TRACKING_KEY, JSON.stringify(data));
}

export function getInterviewStatus(): string | null {
  return loadTracking().interviewStatus;
}

export function setInterviewStatus(status: "interviewing" | "preparing" | "exploring") {
  const data = loadTracking();
  data.interviewStatus = status;
  saveTracking(data);
}

export function trackEarlyReset() {
  const data = loadTracking();
  data.earlyResets += 1;
  saveTracking(data);
}

export function trackSessionAbandon() {
  const data = loadTracking();
  data.sessionAbandons += 1;
  saveTracking(data);
}

export function trackResumeSkip() {
  const data = loadTracking();
  data.resumeSkips += 1;
  saveTracking(data);
}

export function trackSessionCompleted() {
  const data = loadTracking();
  data.completedSessions += 1;
  saveTracking(data);
  return data.completedSessions;
}

export function trackHelpfulResponse(response: string) {
  const data = loadTracking();
  data.helpfulResponses.push({
    sessionIndex: data.completedSessions,
    response,
    timestamp: new Date().toISOString(),
  });
  saveTracking(data);
}

export function trackWouldRunAgain(response: string) {
  const data = loadTracking();
  data.wouldRunAgain.push({
    response,
    timestamp: new Date().toISOString(),
  });
  saveTracking(data);
}

export function getCompletedSessionCount(): number {
  return loadTracking().completedSessions;
}

export function hasSeenOnboarding(): boolean {
  return loadTracking().interviewStatus !== null;
}
