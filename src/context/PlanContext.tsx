import { createContext, useContext, useState, type ReactNode } from "react";
import {
  loadPlan,
  savePlan,
  canUseFeature,
  getPlanFeatures,
  hasReachedDailyLimit,
  getRemainingAttempts,
  incrementDailyAttempts,
  type PlanTier,
  type PlanFeatures,
} from "@/lib/planGating";

interface PlanContextValue {
  plan: PlanTier;
  features: PlanFeatures;
  /** Check if a feature is available on the current plan. */
  canUse: (feature: keyof PlanFeatures) => boolean;
  /** True if the user has hit today's session limit (always false for paid plans). */
  isAtDailyLimit: boolean;
  remainingAttempts: number;
  /** Consume one daily attempt. Returns false if already at limit. */
  consumeAttempt: () => boolean;
  /** Simulated upgrade — sets plan in localStorage and updates context. */
  upgradeTo: (tier: PlanTier) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanTier>(loadPlan);

  const features = getPlanFeatures(plan);
  const isAtDailyLimit = hasReachedDailyLimit(plan);
  const remainingAttempts = getRemainingAttempts(plan);

  function canUse(feature: keyof PlanFeatures): boolean {
    return canUseFeature(feature, plan);
  }

  function consumeAttempt(): boolean {
    if (hasReachedDailyLimit(plan)) return false;
    incrementDailyAttempts();
    return true;
  }

  function upgradeTo(tier: PlanTier) {
    savePlan(tier);
    setPlan(tier);
  }

  return (
    <PlanContext.Provider value={{ plan, features, canUse, isAtDailyLimit, remainingAttempts, consumeAttempt, upgradeTo }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within <PlanProvider>");
  return ctx;
}
