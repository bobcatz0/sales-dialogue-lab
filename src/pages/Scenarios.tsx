import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Building2, ShieldAlert, Users, Cpu, RotateCcw, ArrowRight, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import { loadConsistency } from "@/components/practice/consistencyScoring";
import { getRank } from "@/components/practice/progression";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RankName = "Rookie" | "Starter" | "Closer" | "Operator" | "Rainmaker";

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  whatYouPractice: string[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  requiredRank: RankName;
  unlockCondition: string;
  icon: React.ElementType;
  color: string;
  lockedColor: string;
  env: string;
  role: string;
  duration: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SCENARIOS: Scenario[] = [
  {
    id: "cold-call-gatekeeper",
    title: "Cold Call",
    subtitle: "Get past the gatekeeper",
    description: "An assistant picks up. You have 30 seconds to earn a transfer to the decision maker.",
    whatYouPractice: ["Opening clarity", "Permission-based language", "Handling brush-offs"],
    difficultyLevel: 1,
    requiredRank: "Rookie",
    unlockCondition: "Available from day one",
    icon: Phone,
    color: "text-blue-400",
    lockedColor: "text-muted-foreground/40",
    env: "cold-call",
    role: "gatekeeper",
    duration: "~3 min",
  },
  {
    id: "discovery-call",
    title: "Discovery Call",
    subtitle: "Uncover pain, qualify the deal",
    description: "A guarded B2B prospect who won't volunteer information. You need to ask the right questions.",
    whatYouPractice: ["Open-ended questioning", "Active listening", "Qualifying budget and timeline"],
    difficultyLevel: 2,
    requiredRank: "Rookie",
    unlockCondition: "Available from day one",
    icon: Users,
    color: "text-green-400",
    lockedColor: "text-muted-foreground/40",
    env: "cold-call",
    role: "b2b-prospect",
    duration: "~5 min",
  },
  {
    id: "objection-handling",
    title: "Objection Gauntlet",
    subtitle: "Turn no into yes",
    description: "A skeptical buyer hits you with price, timing, and competitor objections back to back.",
    whatYouPractice: ["Acknowledging without conceding", "Reframing value", "Staying calm under pressure"],
    difficultyLevel: 3,
    requiredRank: "Starter",
    unlockCondition: "Reach Starter rank (100 ELO)",
    icon: ShieldAlert,
    color: "text-orange-400",
    lockedColor: "text-muted-foreground/40",
    env: "enterprise",
    role: "skeptical-buyer",
    duration: "~5 min",
  },
  {
    id: "executive-pitch",
    title: "Executive Pitch",
    subtitle: "Win over the C-suite",
    description: "A time-constrained decision maker. Lead with outcomes, not features, or lose the room.",
    whatYouPractice: ["Business case framing", "Concise ROI delivery", "Handling executive-level pushback"],
    difficultyLevel: 3,
    requiredRank: "Starter",
    unlockCondition: "Reach Starter rank (100 ELO)",
    icon: Building2,
    color: "text-purple-400",
    lockedColor: "text-muted-foreground/40",
    env: "enterprise",
    role: "decision-maker",
    duration: "~5 min",
  },
  {
    id: "technical-eval",
    title: "Technical Evaluation",
    subtitle: "Navigate the technical buyer",
    description: "A skeptical technical evaluator probing your product's depth, integrations, and security.",
    whatYouPractice: ["Technical credibility", "Specificity over buzzwords", "Handling deep product questions"],
    difficultyLevel: 4,
    requiredRank: "Closer",
    unlockCondition: "Reach Closer rank (250 ELO)",
    icon: Cpu,
    color: "text-cyan-400",
    lockedColor: "text-muted-foreground/40",
    env: "enterprise",
    role: "technical-evaluator",
    duration: "~6 min",
  },
  {
    id: "champion-enablement",
    title: "Champion Enablement",
    subtitle: "Arm your internal advocate",
    description: "An internal champion who wants to help but needs the right ammunition to sell your deal internally.",
    whatYouPractice: ["Internal selling language", "Building a business case together", "Handling internal objections"],
    difficultyLevel: 5,
    requiredRank: "Operator",
    unlockCondition: "Reach Operator rank (500 ELO)",
    icon: RotateCcw,
    color: "text-pink-400",
    lockedColor: "text-muted-foreground/40",
    env: "enterprise",
    role: "champion",
    duration: "~6 min",
  },
];

// ---------------------------------------------------------------------------
// Rank helpers
// ---------------------------------------------------------------------------

const RANK_ORDER: RankName[] = ["Rookie", "Starter", "Closer", "Operator", "Rainmaker"];

const RANK_STYLES: Record<RankName, { badge: string; dot: string }> = {
  Rookie:     { badge: "bg-muted/50 text-muted-foreground border-border",                  dot: "bg-muted-foreground/60" },
  Starter:    { badge: "bg-green-500/10 text-green-400 border-green-500/20",               dot: "bg-green-400" },
  Closer:     { badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",                  dot: "bg-blue-400" },
  Operator:   { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",               dot: "bg-amber-400" },
  Rainmaker:  { badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",            dot: "bg-purple-400" },
};

function rankIndex(rank: RankName): number {
  return RANK_ORDER.indexOf(rank);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DifficultyPips({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center gap-0.5" title={`Difficulty ${level}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
            i < level ? "bg-foreground/70" : "bg-foreground/15"
          }`}
        />
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: RankName }) {
  const styles = RANK_STYLES[rank];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {rank}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Scenarios = () => {
  const [currentRank] = useState<RankName>(() => {
    const score = loadConsistency().score;
    return getRank(score) as RankName;
  });

  const currentRankIdx = rankIndex(currentRank);

  // Unlocked first, then locked; preserve original order within each group
  const sorted = [
    ...SCENARIOS.filter((s) => rankIndex(s.requiredRank) <= currentRankIdx),
    ...SCENARIOS.filter((s) => rankIndex(s.requiredRank) > currentRankIdx),
  ];

  const unlockedCount = sorted.filter((s) => rankIndex(s.requiredRank) <= currentRankIdx).length;
  const lockedCount = SCENARIOS.length - unlockedCount;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Zap className="h-3 w-3" />
            {unlockedCount} unlocked · {lockedCount} locked
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Choose Your{" "}
            <span className="text-gradient">Scenario</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Each scenario puts you in a real sales situation with a different buyer personality. Practice, get scored, repeat.
          </p>

          {/* Current rank badge */}
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Your rank:</span>
            <RankBadge rank={currentRank} />
            {lockedCount > 0 && (
              <span className="text-xs text-muted-foreground/60">
                · Keep playing to unlock {lockedCount} more
              </span>
            )}
          </div>
        </motion.div>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {sorted.map((scenario, i) => {
            const Icon = scenario.icon;
            const isLocked = rankIndex(scenario.requiredRank) > currentRankIdx;
            const reqStyles = RANK_STYLES[scenario.requiredRank];

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`card-elevated p-5 flex flex-col gap-4 transition-all duration-200 relative overflow-hidden ${
                  isLocked
                    ? "opacity-60 border-border/50"
                    : "hover:border-primary/30 group"
                }`}
              >
                {/* Lock stripe */}
                {isLocked && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
                )}

                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 ${isLocked ? scenario.lockedColor : scenario.color}`}>
                    {isLocked ? <Lock className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <DifficultyPips level={scenario.difficultyLevel} />
                    {!isLocked ? (
                      <RankBadge rank={scenario.requiredRank} />
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${reqStyles.badge}`}>
                        <Lock className="h-2.5 w-2.5" />
                        {scenario.requiredRank}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className={`font-heading text-base font-bold leading-tight ${isLocked ? "text-foreground/50" : "text-foreground"}`}>
                    {scenario.title}
                  </h3>
                  <p className={`text-xs mt-0.5 font-medium ${isLocked ? "text-muted-foreground/40" : "text-primary"}`}>
                    {scenario.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className={`text-sm leading-relaxed flex-1 ${isLocked ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                  {scenario.description}
                </p>

                {/* What you practice */}
                <div className="space-y-1">
                  {scenario.whatYouPractice.map((skill) => (
                    <div key={skill} className={`flex items-center gap-2 text-xs ${isLocked ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                      <div className={`h-1 w-1 rounded-full shrink-0 ${isLocked ? "bg-muted-foreground/20" : "bg-primary/60"}`} />
                      {skill}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground/60">{scenario.duration}</span>
                  {isLocked ? (
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md border ${reqStyles.badge}`}>
                      <Lock className="h-2.5 w-2.5" />
                      {scenario.unlockCondition}
                    </div>
                  ) : (
                    <Button
                      variant="hero"
                      size="sm"
                      className="h-8 text-xs gap-1.5 group-hover:gap-2 transition-all"
                      asChild
                    >
                      <a href={`/practice?env=${scenario.env}&role=${scenario.role}`}>
                        Start <ArrowRight className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            Want structured interview prep?{" "}
            <a href="/practice" className="text-primary hover:underline">
              Try the full practice environment →
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Scenarios;
