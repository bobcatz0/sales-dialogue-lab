/**
 * Drill completion tracking — persists which drills users complete
 * and surfaces improvement trends.
 */

import type { DrillCategory } from "./drillData";

const DRILL_TRACKING_KEY = "salescalls_drill_tracking";

export interface DrillRecord {
  category: DrillCategory;
  date: string; // ISO
}

export interface DrillTrackingData {
  completions: DrillRecord[];
}

function load(): DrillTrackingData {
  try {
    const raw = localStorage.getItem(DRILL_TRACKING_KEY);
    if (!raw) return { completions: [] };
    return JSON.parse(raw) as DrillTrackingData;
  } catch {
    return { completions: [] };
  }
}

function save(data: DrillTrackingData) {
  localStorage.setItem(DRILL_TRACKING_KEY, JSON.stringify(data));
}

export function trackDrillCompletion(category: DrillCategory) {
  const data = load();
  data.completions.push({ category, date: new Date().toISOString() });
  // Keep last 100
  if (data.completions.length > 100) {
    data.completions = data.completions.slice(-100);
  }
  save(data);
}

export interface DrillCategoryStat {
  category: DrillCategory;
  count: number;
}

export function getDrillStats(): {
  totalDrills: number;
  byCategory: DrillCategoryStat[];
  mostPracticed: DrillCategory | null;
  recentFocus: DrillCategory | null;
} {
  const data = load();
  const completions = data.completions;

  if (completions.length === 0) {
    return { totalDrills: 0, byCategory: [], mostPracticed: null, recentFocus: null };
  }

  // Count by category
  const counts: Record<string, number> = {};
  for (const r of completions) {
    counts[r.category] = (counts[r.category] || 0) + 1;
  }

  const byCategory: DrillCategoryStat[] = Object.entries(counts)
    .map(([category, count]) => ({ category: category as DrillCategory, count }))
    .sort((a, b) => b.count - a.count);

  const mostPracticed = byCategory[0]?.category ?? null;

  // Recent focus = most common in last 5 drills
  const recent = completions.slice(-5);
  const recentCounts: Record<string, number> = {};
  for (const r of recent) {
    recentCounts[r.category] = (recentCounts[r.category] || 0) + 1;
  }
  const recentFocus = Object.entries(recentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as DrillCategory | undefined ?? null;

  return {
    totalDrills: completions.length,
    byCategory,
    mostPracticed,
    recentFocus,
  };
}
