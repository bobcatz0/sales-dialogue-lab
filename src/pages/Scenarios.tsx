import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone, Building2, ShieldAlert, Users, Cpu, RotateCcw, ArrowRight, Zap,
  Briefcase, Mic, Trophy, Crown, Target, Swords, TrendingUp, Lock, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import { loadHistory } from "@/components/practice/sessionStorage";
import type { SessionRecord } from "@/components/practice/types";
import { getEloRank, getRankThresholds, type RankTier } from "@/lib/elo";
import { useAuth } from "@/hooks/useAuth";

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
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
    id: "discovery-call",
    title: "Discovery Call",
    subtitle: "Uncover pain, qualify the deal",
    description: "A guarded B2B prospect who won't volunteer information. Ask the right questions to uncover needs.",
    difficulty: "Beginner",
    icon: Users,
    env: "cold-call",
    role: "b2b-prospect",
    duration: "~5 min",
    framework: { id: "bant", label: "BANT" },
  },
  {
    id: "objection-handling",
    title: "Pricing Objection",
    subtitle: "Turn no into yes",
    description: "A skeptical buyer hits you with price, timing, and competitor objections. Reframe value under fire.",
    difficulty: "Intermediate",
    icon: ShieldAlert,
    env: "enterprise",
    role: "skeptical-buyer",
    duration: "~5 min",
  },
  {
    id: "cold-call-gatekeeper",
    title: "Cold Outreach",
    subtitle: "Get past the gatekeeper",
    description: "An assistant picks up. You have 30 seconds to earn a transfer to the decision maker.",
    difficulty: "Beginner",
    icon: Phone,
    env: "cold-call",
    role: "gatekeeper",
    duration: "~3 min",
    comingSoon: true,
  },
  {
    id: "lead-qualification",
    title: "Lead Qualification",
    subtitle: "Separate signal from noise",
    description: "A warm inbound lead with unclear intent. Qualify budget, authority, need, and timeline before committing resources.",
    difficulty: "Intermediate",
    icon: Target,
    env: "cold-call",
    role: "b2b-prospect",
    duration: "~5 min",
    framework: { id: "bant", label: "BANT" },
  },
  {
    id: "executive-pitch",
    title: "Closing Conversation",
    subtitle: "Win over the C-suite",
    description: "A time-constrained decision maker. Lead with outcomes, secure commitment, or lose the room.",
    difficulty: "Advanced",
    icon: Building2,
    env: "enterprise",
    role: "decision-maker",
    duration: "~5 min",
    framework: { id: "meddic", label: "MEDDIC" },
  },
  {
    id: "interview-pressure",
    title: "Interview Pressure Round",
    subtitle: "Prove yourself under scrutiny",
    description: "A hiring manager tests your experience, metrics, and thinking under real interview pressure.",
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
    description: "A skeptical technical evaluator probing your product's depth, integrations, and security.",
    difficulty: "Advanced",
    icon: Cpu,
    env: "enterprise",
    role: "technical-evaluator",
    duration: "~6 min",
  },
  {
    id: "champion-enablement",
    title: "Champion Enablement",
    subtitle: "Arm your internal advocate",
    description: "An internal champion needs the right ammunition to sell your deal internally.",
    difficulty: "Advanced",
    icon: RotateCcw,
    env: "enterprise",
    role: "champion",
    duration: "~6 min",
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

  useEffect(() => {
    setSessions(loadHistory());
  }, []);

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

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {SCENARIOS.map((scenario, i) => {
            const Icon = scenario.icon;
            const isComingSoon = scenario.comingSoon;
            const bestScore = getBestScore(sessions, scenario.env, scenario.role);
            const rank = getLeaderboardRank(sessions, scenario.env, scenario.role);

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ${
                  isComingSoon
                    ? "opacity-50 pointer-events-none"
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
                    <div className="h-11 w-11 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
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
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {scenario.description}
                  </p>

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
                  {isComingSoon ? (
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
    </div>
  );
};

export default Scenarios;
