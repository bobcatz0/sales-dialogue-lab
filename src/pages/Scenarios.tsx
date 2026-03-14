import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone, Building2, ShieldAlert, Users, Cpu, RotateCcw, ArrowRight, Zap,
  Briefcase, Mic, Trophy, Crown, Target, Swords, TrendingUp, Lock, Flame, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import { loadHistory } from "@/components/practice/sessionStorage";
import type { SessionRecord } from "@/components/practice/types";
import { getEloRank, getRankThresholds, type RankTier } from "@/lib/elo";
import { useAuth } from "@/hooks/useAuth";
import { SCENARIO_CHAINS } from "@/components/scenarios/chainData";
import ScenarioChainCard from "@/components/scenarios/ScenarioChainCard";
import { loadChainProgress, resetChainProgress } from "@/components/scenarios/chainStorage";
import type { ChainProgress } from "@/components/scenarios/types";
import { PromotionSeriesBanner, SeriesResultModal } from "@/components/practice/PromotionSeriesUI";
import {
  getSeriesEligibility,
  loadLastFailedSeriesElo,
  startPromotionSeries,
  type SeriesEligibility,
  type PromotionSeries,
} from "@/components/practice/promotionSeries";
import FlashChallengeBanner from "@/components/scenarios/FlashChallengeBanner";

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  goal: string;
  evaluationCriteria: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: React.ElementType;
  env: string;
  role: string;
  duration: string;
  comingSoon?: boolean;
  framework?: { id: string; label: string };
  requiredRank?: RankTier;
}

const RANK_ORDER: RankTier[] = ["Rookie", "Prospector", "Closer", "Operator", "Rainmaker", "Sales Architect"];

function isRankSufficient(userRank: RankTier, requiredRank: RankTier): boolean {
  return RANK_ORDER.indexOf(userRank) >= RANK_ORDER.indexOf(requiredRank);
}

const SCENARIOS: Scenario[] = [
  {
    id: "cold-call-gatekeeper",
    title: "Cold Call Gatekeeper",
    subtitle: "Get past the front desk",
    description: "An executive assistant screens every call. You have 20 seconds of patience before they hang up. Earn the transfer or lose the opportunity forever.",
    goal: "Navigate past a protective gatekeeper to reach the decision maker without being deceptive or aggressive.",
    evaluationCriteria: ["Confident, concise opener", "Name-drop or trigger event reference", "Reason-based transfer request", "Composure under resistance", "Appropriate urgency without pushiness"],
    difficulty: "Beginner",
    icon: Phone,
    env: "cold-call",
    role: "gatekeeper",
    duration: "~3 min",
  },
  {
    id: "budget-objection",
    title: "Budget Objection",
    subtitle: "Reframe value when price is the wall",
    description: "A prospect loves your product but says the price is too high. Their current contract renews in 30 days. Break through the budget wall or lose the deal to inaction.",
    goal: "Overcome a genuine budget objection by reframing ROI, isolating the real blocker, and proposing creative deal structures.",
    evaluationCriteria: ["Acknowledge concern without discounting", "Isolate budget vs. value objection", "Quantify ROI with specific metrics", "Propose creative deal structure", "Maintain deal momentum with next steps"],
    difficulty: "Intermediate",
    icon: ShieldAlert,
    env: "enterprise",
    role: "skeptical-buyer",
    duration: "~5 min",
    requiredRank: "Prospector",
  },
  {
    id: "existing-vendor",
    title: "Existing Vendor Displacement",
    subtitle: "Unseat the incumbent",
    description: "The prospect already uses a competitor and sees no reason to switch. Find the cracks in their current solution and plant seeds of doubt — without trash-talking.",
    goal: "Identify dissatisfaction with the current vendor and position your solution as a strategic upgrade without negative selling.",
    evaluationCriteria: ["Uncover unmet needs with current vendor", "Avoid direct competitor bashing", "Highlight unique differentiation", "Build cost-of-inaction narrative", "Secure a proof-of-concept commitment"],
    difficulty: "Intermediate",
    icon: RotateCcw,
    env: "cold-call",
    role: "b2b-prospect",
    duration: "~5 min",
    framework: { id: "spin", label: "SPIN" },
    requiredRank: "Closer",
  },
  {
    id: "discovery-call",
    title: "Discovery Call",
    subtitle: "Uncover pain, qualify the deal",
    description: "A guarded VP of Operations who won't volunteer information. They've been burned by vendors before. Ask the right questions to uncover real pain — not surface-level symptoms.",
    goal: "Run a structured discovery conversation that uncovers budget, authority, need, and timeline while building genuine rapport.",
    evaluationCriteria: ["Open-ended pain questions", "Active listening and follow-up probes", "BANT qualification coverage", "Empathy and rapport building", "Clear next-step commitment"],
    difficulty: "Beginner",
    icon: Users,
    env: "cold-call",
    role: "b2b-prospect",
    duration: "~5 min",
    framework: { id: "bant", label: "BANT" },
  },
  {
    id: "enterprise-procurement",
    title: "Enterprise Procurement Pushback",
    subtitle: "Survive the buying committee gauntlet",
    description: "A procurement officer demands 30% off, longer payment terms, and a 90-day pilot — or the deal dies. Negotiate without eroding your margins or losing the champion's trust.",
    goal: "Navigate enterprise procurement negotiations while protecting deal value and maintaining alignment with your internal champion.",
    evaluationCriteria: ["Hold firm on core pricing", "Trade concessions strategically", "Leverage champion relationship", "Address legal and compliance concerns", "Secure mutual commitment timeline"],
    difficulty: "Advanced",
    icon: Building2,
    env: "enterprise",
    role: "decision-maker",
    duration: "~6 min",
    framework: { id: "meddic", label: "MEDDIC" },
    requiredRank: "Operator",
  },
  {
    id: "interview-pressure",
    title: "Interview Pressure Round",
    subtitle: "Prove yourself under scrutiny",
    description: "A hiring manager tests your experience, metrics, and thinking under real interview pressure. Every vague answer costs credibility.",
    goal: "Demonstrate sales competency with specific examples, metrics, and structured responses under interview conditions.",
    evaluationCriteria: ["STAR-structured responses", "Specific metrics and outcomes", "Composure under follow-up pressure", "Self-awareness on weaknesses", "Authentic enthusiasm"],
    difficulty: "Beginner",
    icon: Briefcase,
    env: "interview",
    role: "hiring-manager",
    duration: "~4 min",
    framework: { id: "star", label: "STAR" },
  },
  {
    id: "technical-eval",
    title: "Technical Evaluation",
    subtitle: "Navigate the technical buyer",
    description: "A skeptical technical evaluator probing your product's depth, integrations, and security posture. Hand-waving gets you disqualified.",
    goal: "Satisfy technical due diligence by demonstrating deep product knowledge and honest handling of limitations.",
    evaluationCriteria: ["Technical accuracy and depth", "Honest gap acknowledgment", "Integration and API knowledge", "Security and compliance readiness", "Bridge technical to business value"],
    difficulty: "Advanced",
    icon: Cpu,
    env: "enterprise",
    role: "technical-evaluator",
    duration: "~6 min",
    requiredRank: "Rainmaker",
  },
  {
    id: "champion-enablement",
    title: "Champion Enablement",
    subtitle: "Arm your internal advocate",
    description: "Your champion is going into a board meeting tomorrow to pitch your deal. Equip them with the business case, objection responses, and ROI narrative they need to win internally.",
    goal: "Prepare your internal champion with compelling ammunition to sell the deal to their leadership team.",
    evaluationCriteria: ["Tailor messaging to executive audience", "Provide quantified business case", "Arm with objection rebuttals", "Strategic framing for internal politics", "Create urgency without pressure"],
    difficulty: "Advanced",
    icon: Target,
    env: "enterprise",
    role: "champion",
    duration: "~6 min",
    requiredRank: "Sales Architect",
  },
];

const DIFFICULTY_CONFIG = {
  Beginner: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", bars: 1 },
  Intermediate: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bars: 2 },
  Advanced: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", bars: 3 },
};

function DifficultyBars({ difficulty }: { difficulty: "Beginner" | "Intermediate" | "Advanced" }) {
  const config = DIFFICULTY_CONFIG[difficulty];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-2.5 w-1 rounded-sm ${i <= config.bars ? config.bg.replace("/10", "/60") : "bg-muted"}`}
        />
      ))}
      <span className={`text-[10px] font-semibold ml-1 ${config.color}`}>{difficulty}</span>
    </div>
  );
}

function getBestScore(sessions: SessionRecord[], env: string, role: string): number | null {
  const matching = sessions.filter((s) => {
    const roleMatch = s.roleId === role;
    return roleMatch;
  });
  if (matching.length === 0) return null;
  return Math.max(...matching.map((s) => s.score));
}

function getLeaderboardRank(sessions: SessionRecord[], env: string, role: string): number | null {
  const best = getBestScore(sessions, env, role);
  if (best === null) return null;
  // Simulated rank based on score thresholds
  if (best >= 90) return 1;
  if (best >= 80) return Math.floor(Math.random() * 5) + 2;
  if (best >= 70) return Math.floor(Math.random() * 10) + 6;
  if (best >= 60) return Math.floor(Math.random() * 15) + 15;
  return Math.floor(Math.random() * 20) + 30;
}

const Scenarios = () => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [chainProgressMap, setChainProgressMap] = useState<Record<string, ChainProgress>>({});
  const [seriesEligibility, setSeriesEligibility] = useState<SeriesEligibility | null>(null);
  const [completedSeries, setCompletedSeries] = useState<PromotionSeries | null>(null);
  const { profile, user } = useAuth();
  const userElo = profile?.elo ?? 1000;
  const userRank = getEloRank(userElo);

  useEffect(() => {
    setSessions(loadHistory());
    setChainProgressMap(loadChainProgress());
  }, []);

  useEffect(() => {
    if (!user?.id || !profile) return;
    const checkEligibility = async () => {
      const ranks = getRankThresholds();
      const currentIdx = ranks.findIndex((r) => r.name === userRank);
      const nextRank = currentIdx < ranks.length - 1 ? ranks[currentIdx + 1]?.name : null;
      const lastFailed = nextRank ? await loadLastFailedSeriesElo(user.id, nextRank) : null;
      setSeriesEligibility(getSeriesEligibility(user.id, userElo, lastFailed));
    };
    checkEligibility();
  }, [user?.id, userElo, userRank, profile]);

  const handleResetChain = (chainId: string) => {
    resetChainProgress(chainId);
    setChainProgressMap(loadChainProgress());
  };

  const handleStartSeries = () => {
    if (!user?.id || !seriesEligibility?.nextRank) return;
    const series = startPromotionSeries(user.id, userRank, seriesEligibility.nextRank, userElo);
    setSeriesEligibility((prev) => prev ? { ...prev, activeSeries: series, eligible: true } : prev);
  };

  const handleContinueSeries = () => {
    // Navigate to practice with promotion series params
    if (seriesEligibility?.activeSeries) {
      const s = seriesEligibility.activeSeries;
      window.location.href = `/practice?env=cold-call&role=b2b-prospect&promoSeries=${s.id}&game=${s.games.length}`;
    }
  };

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
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-5">
            <Swords className="h-3.5 w-3.5" />
            Choose Your Challenge
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Sales Training{" "}
            <span className="text-gradient">Arena</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Select a scenario. Get scored. Climb the leaderboard. Each challenge tests different sales skills under real pressure.
          </p>
        </motion.div>

        {/* Promotion Series Banner */}
        {seriesEligibility && (
          <div className="max-w-5xl mx-auto mb-8">
            <PromotionSeriesBanner
              eligibility={seriesEligibility}
              onStartSeries={handleStartSeries}
              onContinueSeries={handleContinueSeries}
            />
          </div>
        )}

        {/* Flash Challenge */}
        <div className="max-w-5xl mx-auto mb-8">
          <FlashChallengeBanner />
        </div>

        {/* Scenario Chains */}
        <div className="max-w-5xl mx-auto mb-14">
          <div className="flex items-center gap-2 mb-6">
            <Link2 className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-xl font-bold text-foreground">Multi-Stage Chains</h2>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">NEW</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {SCENARIO_CHAINS.map((chain, i) => (
              <motion.div
                key={chain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <ScenarioChainCard
                  chain={chain}
                  progress={chainProgressMap[chain.id] ?? null}
                  userRank={userRank}
                  onReset={handleResetChain}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Single Scenarios Header */}
        <div className="flex items-center gap-2 mb-6 max-w-5xl mx-auto">
          <Swords className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">Single Scenarios</h2>
        </div>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {SCENARIOS.map((scenario, i) => {
            const Icon = scenario.icon;
            const isComingSoon = scenario.comingSoon;
            const isLocked = !!scenario.requiredRank && !isRankSufficient(userRank, scenario.requiredRank);
            const isDisabled = isComingSoon || isLocked;
            const bestScore = getBestScore(sessions, scenario.env, scenario.role);
            const rank = getLeaderboardRank(sessions, scenario.env, scenario.role);

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ${
                  isDisabled
                    ? "opacity-60 pointer-events-none"
                    : "hover:border-primary/40 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.15)]"
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-0.5 ${
                  isComingSoon ? "bg-muted" : "bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                }`} />

                <div className="p-5 flex flex-col gap-4">
                  {/* Icon + Difficulty + Framework */}
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors relative">
                      {isLocked ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Icon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <DifficultyBars difficulty={scenario.difficulty} />
                      {scenario.framework && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                          {scenario.framework.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title + Subtitle */}
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{scenario.subtitle}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenario.description}
                  </p>

                  {/* Goal */}
                  <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-0.5">Goal</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{scenario.goal}</p>
                  </div>

                  {/* Evaluation Criteria */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Scored on</p>
                    <div className="flex flex-wrap gap-1">
                      {scenario.evaluationCriteria.slice(0, 3).map((c) => (
                        <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 border border-border/50 text-muted-foreground">
                          {c}
                        </span>
                      ))}
                      {scenario.evaluationCriteria.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground/60">
                          +{scenario.evaluationCriteria.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Row: Best Score + Leaderboard Rank */}
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-muted/30 border border-border/50">
                    {bestScore !== null ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-1">
                          <Flame className="h-3.5 w-3.5 text-primary shrink-0" />
                          <div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Best</p>
                            <p className="text-sm font-bold font-heading text-foreground">{bestScore}</p>
                          </div>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex items-center gap-1.5 flex-1">
                          <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Rank</p>
                            <p className="text-sm font-bold font-heading text-foreground">#{rank}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <Trophy className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        <p className="text-[11px] text-muted-foreground/60">No attempts yet — be the first</p>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <p className="text-[11px] text-muted-foreground/50">
                    {scenario.difficulty} • {scenario.duration}{scenario.framework ? ` • ${scenario.framework.label}` : ""}
                  </p>

                {/* CTA */}
                  {isLocked ? (
                    <Button variant="outline" size="sm" className="w-full h-9 text-xs" disabled>
                      <Lock className="h-3 w-3 mr-1.5" />
                      Requires {scenario.requiredRank} Rank
                    </Button>
                  ) : isComingSoon ? (
                    <Button variant="outline" size="sm" className="w-full h-9 text-xs" disabled>
                      <Lock className="h-3 w-3 mr-1.5" />
                      Coming Soon — Voice Simulation
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full h-9 text-xs gap-1.5 group-hover:gap-2.5 transition-all"
                      asChild
                    >
                      <a href={`/practice?env=${scenario.env}&role=${scenario.role}`}>
                        Start Challenge <ArrowRight className="h-3.5 w-3.5" />
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
          className="text-center mt-14 space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Complete scenarios to earn ELO and climb the{" "}
            <a href="/leaderboard" className="text-primary hover:underline font-medium">
              global leaderboard →
            </a>
          </p>
          <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground/50">
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> ELO-ranked</span>
            <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> Weekly challenges</span>
            <span className="flex items-center gap-1"><Swords className="h-3 w-3" /> Head-to-head battles</span>
          </div>
        </motion.div>
      </div>

      {/* Series Result Modal */}
      <SeriesResultModal
        open={!!completedSeries}
        series={completedSeries}
        onClose={() => setCompletedSeries(null)}
      />
    </div>
  );
};

export default Scenarios;
