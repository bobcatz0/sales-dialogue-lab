import type { SessionRecord } from "./types";

const STORAGE_KEY = "salescalls_session_history";

export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: SessionRecord): SessionRecord[] {
  const history = loadHistory();
  history.unshift(session);
  // Keep last 50 sessions
  const trimmed = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
