import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mic, BarChart2, Users, ClipboardList, X, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/context/PlanContext";
import type { PlanTier } from "@/lib/planGating";

// ─── Tier definitions ─────────────────────────────────────────────────────────

const TIERS: {
  tier: PlanTier;
  label: string;
  price: string;
  icon: React.ElementType;
  highlights: string[];
  cta: string;
  accent: string;
}[] = [
  {
    tier: "free",
    label: "Free",
    price: "$0",
    icon: Zap,
    highlights: [
      "Daily challenge",
      "Leaderboard",
      "2 text scenarios",
      "3 attempts / day",
    ],
    cta: "Current plan",
    accent: "text-muted-foreground border-border",
  },
  {
    tier: "pro",
    label: "Pro",
    price: "$12/mo",
    icon: Mic,
    highlights: [
      "Unlimited attempts",
      "Voice mode",
      "Advanced feedback",
      "All text + voice scenarios",
    ],
    cta: "Upgrade to Pro",
    accent: "text-primary border-primary/40",
  },
  {
    tier: "team",
    label: "Team",
    price: "$49/mo",
    icon: Users,
    highlights: [
      "Everything in Pro",
      "Manager dashboard",
      "Team leaderboard",
      "Team challenges + analytics",
    ],
    cta: "Upgrade to Team",
    accent: "text-amber-400 border-amber-400/40",
  },
  {
    tier: "recruiter",
    label: "Recruiter",
    price: "$79/mo",
    icon: ClipboardList,
    highlights: [
      "Everything in Pro",
      "Assessment links",
      "Candidate reports",
      "Recruiter dashboard",
    ],
    cta: "Upgrade to Recruiter",
    accent: "text-purple-400 border-purple-400/40",
  },
];

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

export function UpgradeModal({
  open,
  onClose,
  highlightTier = "pro",
  reason,
}: {
  open: boolean;
  onClose: () => void;
  highlightTier?: PlanTier;
  reason?: string;
}) {
  const { plan, upgradeTo } = usePlan();

  function handleUpgrade(tier: PlanTier) {
    if (tier === "free") return;
    upgradeTo(tier);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed inset-x-4 top-[10vh] z-50 max-w-2xl mx-auto card-elevated p-6 space-y-5 overflow-y-auto max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Unlock More
                </h2>
                {reason && (
                  <p className="text-sm text-muted-foreground mt-1">{reason}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Note: real payment coming */}
            <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                Payment processing coming soon. Selecting a paid plan here activates it for this session for preview purposes.
              </p>
            </div>

            {/* Tier cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIERS.map(({ tier, label, price, icon: Icon, highlights, cta, accent }) => {
                const isCurrentPlan = plan === tier;
                const isHighlighted = tier === highlightTier && !isCurrentPlan;
                return (
                  <div
                    key={tier}
                    className={`rounded-xl border p-4 space-y-3 transition-colors ${
                      isHighlighted
                        ? "border-primary/50 bg-primary/5"
                        : isCurrentPlan
                        ? "border-border bg-muted/20 opacity-60"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${accent.split(" ")[0]}`} />
                        <span className={`text-sm font-bold ${accent.split(" ")[0]}`}>{label}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">{price}</span>
                    </div>
                    <ul className="space-y-1">
                      {highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="sm"
                      variant={isHighlighted ? "default" : "outline"}
                      className="w-full h-8 text-xs"
                      disabled={isCurrentPlan}
                      onClick={() => handleUpgrade(tier)}
                    >
                      {isCurrentPlan ? "Current plan" : cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Inline gate wrapper ──────────────────────────────────────────────────────

/**
 * Renders children if the user's plan satisfies `requiredTier`.
 * Otherwise renders an upgrade teaser block in place of the content.
 */
export function PlanGate({
  requiredTier = "pro",
  reason,
  teaserLabel,
  children,
}: {
  requiredTier?: PlanTier;
  reason?: string;
  teaserLabel?: string;
  children: React.ReactNode;
}) {
  const { plan } = usePlan();
  const [showModal, setShowModal] = useState(false);

  const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, team: 2, recruiter: 3 };
  const hasAccess = TIER_RANK[plan] >= TIER_RANK[requiredTier];

  if (hasAccess) return <>{children}</>;

  return (
    <>
      <div
        className="rounded-xl border border-dashed border-primary/20 bg-primary/5 px-4 py-5 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-colors"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {teaserLabel ?? `${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} feature`}
            </p>
            {reason && <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>}
          </div>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs border-primary/30 text-primary hover:bg-primary/10">
          Unlock
        </Button>
      </div>
      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        highlightTier={requiredTier}
        reason={reason}
      />
    </>
  );
}

// ─── Small plan badge ─────────────────────────────────────────────────────────

export function PlanBadge({ tier }: { tier: PlanTier }) {
  const colors: Record<PlanTier, string> = {
    free: "bg-muted/50 text-muted-foreground border-border",
    pro: "bg-primary/10 text-primary border-primary/30",
    team: "bg-amber-500/10 text-amber-400 border-amber-400/30",
    recruiter: "bg-purple-500/10 text-purple-400 border-purple-400/30",
  };
  return (
    <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide ${colors[tier]}`}>
      {tier}
    </span>
  );
}

// ─── Attempt limit banner ─────────────────────────────────────────────────────

export function AttemptLimitBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-2.5">
        <BarChart2 className="h-4 w-4 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Daily limit reached</p>
          <p className="text-xs text-muted-foreground">Free plan: 3 sessions per day. Upgrade for unlimited access.</p>
        </div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs border-amber-400/40 text-amber-400 hover:bg-amber-400/10" onClick={onUpgrade}>
        Upgrade
      </Button>
    </motion.div>
  );
}
