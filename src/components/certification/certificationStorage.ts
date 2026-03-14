import type { CertificationAttempt, StageScore } from "./certificationData";

const CERT_STORAGE_KEY = "salescalls_certification_attempt";

export function loadCertificationAttempt(userId: string): CertificationAttempt | null {
  try {
    const raw = localStorage.getItem(CERT_STORAGE_KEY);
    if (!raw) return null;
    const attempt: CertificationAttempt = JSON.parse(raw);
    if (attempt.userId !== userId || attempt.status === "completed" || attempt.status === "failed") return null;
    return attempt;
  } catch {
    return null;
  }
}

export function saveCertificationAttempt(attempt: CertificationAttempt): void {
  localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(attempt));
}

export function clearCertificationAttempt(): void {
  localStorage.removeItem(CERT_STORAGE_KEY);
}

export function startCertificationAttempt(userId: string, trackId: string): CertificationAttempt {
  const attempt: CertificationAttempt = {
    id: crypto.randomUUID(),
    trackId,
    userId,
    stageScores: [],
    currentStageIndex: 0,
    status: "in_progress",
    finalScore: null,
    certificationLevel: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  saveCertificationAttempt(attempt);
  return attempt;
}

export function recordCertificationStageScore(
  attempt: CertificationAttempt,
  stageScore: StageScore,
  totalStages: number
): CertificationAttempt {
  const updated = { ...attempt };
  const idx = updated.stageScores.findIndex((s) => s.stageId === stageScore.stageId);
  if (idx >= 0) {
    updated.stageScores[idx] = stageScore;
  } else {
    updated.stageScores.push(stageScore);
  }
  updated.currentStageIndex = Math.min(updated.stageScores.length, totalStages - 1);

  if (updated.stageScores.length >= totalStages) {
    updated.status = "completed";
    updated.completedAt = new Date().toISOString();
  }

  saveCertificationAttempt(updated);
  return updated;
}
