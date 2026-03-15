// ─── Plan Tier Definitions ────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "team" | "recruiter";

export interface PlanFeatures {
  voiceMode: boolean;
  advancedFeedback: boolean;
  unlimitedAttempts: boolean;
  premiumScenarios: boolean;
  teamDashboard: boolean;
  teamLeaderboard: boolean;
  teamChallenges: boolean;
  analytics: boolean;
  assessmentLinks: boolean;
  candidateReports: boolean;
  recruiterDashboard: boolean;
  /** 0 = unlimited */
  dailyAttemptLimit: number;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    voiceMode: false,
    advancedFeedback: false,
    unlimitedAttempts: false,
    premiumScenarios: false,
    teamDashboard: false,
    teamLeaderboard: false,
    teamChallenges: false,
    analytics: false,
    assessmentLinks: false,
    candidateReports: false,
    recruiterDashboard: false,
    dailyAttemptLimit: 3,
  },
  pro: {
    voiceMode: true,
    advancedFeedback: true,
    unlimitedAttempts: true,
    premiumScenarios: true,
    teamDashboard: false,
    teamLeaderboard: false,
    teamChallenges: false,
    analytics: false,
    assessmentLinks: false,
    candidateReports: false,
    recruiterDashboard: false,
    dailyAttemptLimit: 0,
  },
  team: {
    voiceMode: true,
    advancedFeedback: true,
    unlimitedAttempts: true,
    premiumScenarios: true,
    teamDashboard: true,
    teamLeaderboard: true,
    teamChallenges: true,
    analytics: true,
    assessmentLinks: false,
    candidateReports: false,
    recruiterDashboard: false,
    dailyAttemptLimit: 0,
  },
  recruiter: {
    voiceMode: true,
    advancedFeedback: true,
    unlimitedAttempts: true,
    premiumScenarios: true,
    teamDashboard: false,
    teamLeaderboard: false,
    teamChallenges: false,
    analytics: true,
    assessmentLinks: true,
    candidateReports: true,
    recruiterDashboard: true,
    dailyAttemptLimit: 0,
  },
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  recruiter: "Recruiter",
};

/**
 * Scenario role IDs available on the Free plan.
 * All others require Pro or above.
 */
export const FREE_SCENARIO_ROLE_IDS: ReadonlySet<string> = new Set([
  "gatekeeper",
  "b2b-prospect",
]);

// ─── Storage ─────────────────────────────────────────────────────────────────

const PLAN_KEY = "salescalls_plan";
const DAILY_ATTEMPTS_KEY = "salescalls_daily_attempts";

export function loadPlan(): PlanTier {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (raw && raw in PLAN_FEATURES) return raw as PlanTier;
  } catch { /* ignore */ }
  return "free";
}

export function savePlan(tier: PlanTier) {
  localStorage.setItem(PLAN_KEY, tier);
}

export function getPlanFeatures(tier?: PlanTier): PlanFeatures {
  return PLAN_FEATURES[tier ?? loadPlan()];
}

export function canUseFeature(feature: keyof PlanFeatures, tier?: PlanTier): boolean {
  const val = getPlanFeatures(tier)[feature];
  if (typeof val === "boolean") return val;
  return (val as number) === 0; // dailyAttemptLimit 0 = unlimited = "can use"
}

// ─── Daily Attempt Tracking ───────────────────────────────────────────────────

interface DailyAttempts {
  date: string;
  count: number;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadDailyAttempts(): DailyAttempts {
  try {
    const raw = localStorage.getItem(DAILY_ATTEMPTS_KEY);
    if (raw) {
      const data = JSON.parse(raw) as DailyAttempts;
      if (data.date === getToday()) return data;
    }
  } catch { /* ignore */ }
  return { date: getToday(), count: 0 };
}

export function incrementDailyAttempts(): number {
  const data = loadDailyAttempts();
  data.count += 1;
  localStorage.setItem(DAILY_ATTEMPTS_KEY, JSON.stringify(data));
  return data.count;
}

export function hasReachedDailyLimit(tier?: PlanTier): boolean {
  const features = getPlanFeatures(tier);
  if (features.dailyAttemptLimit === 0) return false;
  return loadDailyAttempts().count >= features.dailyAttemptLimit;
}

export function getRemainingAttempts(tier?: PlanTier): number {
  const features = getPlanFeatures(tier);
  if (features.dailyAttemptLimit === 0) return Infinity;
  return Math.max(0, features.dailyAttemptLimit - loadDailyAttempts().count);
}
