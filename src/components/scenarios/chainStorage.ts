import type { ChainProgress, StageResult } from "./types";

const CHAIN_STORAGE_KEY = "salescalls_chain_progress";

export function loadChainProgress(): Record<string, ChainProgress> {
  try {
    const raw = localStorage.getItem(CHAIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getChainProgress(chainId: string): ChainProgress | null {
  const all = loadChainProgress();
  return all[chainId] ?? null;
}

export function saveStageResult(chainId: string, totalStages: number, result: StageResult): ChainProgress {
  const all = loadChainProgress();
  const existing = all[chainId] ?? {
    chainId,
    stageResults: [],
    currentStageIndex: 0,
    completed: false,
    averageScore: null,
  };

  // Replace existing result for same stage or append
  const idx = existing.stageResults.findIndex((r) => r.stageId === result.stageId);
  if (idx >= 0) {
    existing.stageResults[idx] = result;
  } else {
    existing.stageResults.push(result);
  }

  existing.currentStageIndex = Math.min(existing.stageResults.length, totalStages - 1);
  existing.completed = existing.stageResults.length >= totalStages;
  existing.averageScore =
    existing.stageResults.length > 0
      ? Math.round(existing.stageResults.reduce((s, r) => s + r.score, 0) / existing.stageResults.length)
      : null;

  all[chainId] = existing;
  localStorage.setItem(CHAIN_STORAGE_KEY, JSON.stringify(all));
  return existing;
}

export function resetChainProgress(chainId: string): void {
  const all = loadChainProgress();
  delete all[chainId];
  localStorage.setItem(CHAIN_STORAGE_KEY, JSON.stringify(all));
}
