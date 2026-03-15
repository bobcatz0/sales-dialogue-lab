import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, Circle, Zap, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ScenarioChain, ChainProgress } from "./types";
import type { RankTier } from "@/lib/elo";

const RANK_ORDER: RankTier[] = ["Rookie", "Prospector", "Closer", "Operator", "Rainmaker", "Sales Architect"];

function isRankSufficient(userRank: RankTier, requiredRank: RankTier): boolean {
  return RANK_ORDER.indexOf(userRank) >= RANK_ORDER.indexOf(requiredRank);
}

const DIFFICULTY_CONFIG = {
  Beginner: { color: "text-green-400", bg: "bg-green-500/10", bars: 1 },
  Intermediate: { color: "text-amber-400", bg: "bg-amber-500/10", bars: 2 },
  Advanced: { color: "text-red-400", bg: "bg-red-500/10", bars: 3 },
};

interface Props {
  chain: ScenarioChain;
  progress: ChainProgress | null;
  userRank: RankTier;
  onReset?: (chainId: string) => void;
  personality?: string;
}

export default function ScenarioChainCard({ chain, progress, userRank, onReset, personality = "neutral" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const Icon = chain.icon;
  const isLocked = !!chain.requiredRank && !isRankSufficient(userRank, chain.requiredRank);
  const config = DIFFICULTY_CONFIG[chain.difficulty];

  const completedStages = progress?.stageResults.length ?? 0;
  const totalStages = chain.stages.length;
  const progressPct = (completedStages / totalStages) * 100;
  const isComplete = progress?.completed ?? false;

  const nextStageIndex = progress ? Math.min(progress.stageResults.length, totalStages - 1) : 0;
  const nextStage = chain.stages[nextStageIndex];

  const getStageScore = (stageId: string): number | null => {
    return progress?.stageResults.find((r) => r.stageId === stageId)?.score ?? null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
        isLocked
          ? "border-border bg-card opacity-60"
          : isComplete
          ? "border-green-500/30 bg-card shadow-[0_0_30px_-10px_hsl(142_70%_45%/0.1)]"
          : "border-border bg-card hover:border-primary/40 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.15)]"
      }`}
    >
      {/* Gradient bar */}
      <div className={`h-1 ${isLocked ? "bg-muted" : "bg-gradient-to-r from-primary/60 via-primary to-primary/60"}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${
            isLocked ? "bg-muted/40 border-border" : "bg-primary/10 border-primary/20"
          }`}>
            {isLocked ? <Lock className="h-5 w-5 text-muted-foreground" /> : <Icon className="h-5 w-5 text-primary" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading text-lg font-bold text-foreground leading-tight">{chain.title}</h3>
              {isComplete && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground">{chain.subtitle}</p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-2.5 w-1 rounded-sm ${i <= config.bars ? config.bg.replace("/10", "/60") : "bg-muted"}`} />
                ))}
                <span className={`text-[10px] font-semibold ml-1 ${config.color}`}>{chain.difficulty}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{totalStages} stages • {chain.totalDuration}</span>
              {chain.framework && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                  {chain.framework.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">{chain.description}</p>

        {/* Progress bar */}
        {!isLocked && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{completedStages}/{totalStages} stages completed</span>
              {progress?.averageScore !== null && progress?.averageScore !== undefined && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-400" />
                  Avg: {progress.averageScore}
                </span>
              )}
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {/* Expand/collapse stages */}
        {!isLocked && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-primary font-medium mt-3 hover:underline"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide stages" : "View all stages"}
          </button>
        )}

        {/* Expanded stage list */}
        <AnimatePresence>
          {expanded && !isLocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                {chain.stages.map((stage, idx) => {
                  const score = getStageScore(stage.id);
                  const isCurrent = idx === nextStageIndex && !isComplete;
                  const isStageComplete = score !== null;

                  return (
                    <div
                      key={stage.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                        isCurrent
                          ? "border-primary/30 bg-primary/5"
                          : isStageComplete
                          ? "border-green-500/20 bg-green-500/5"
                          : "border-border/50 bg-muted/20"
                      }`}
                    >
                      <div className="shrink-0">
                        {isStageComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : isCurrent ? (
                          <Zap className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                          {stage.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{stage.subtitle} • {stage.duration}</p>
                      </div>
                      {score !== null && (
                        <span className="text-xs font-bold text-foreground">{score}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-4">
          {isLocked ? (
            <Button variant="outline" size="sm" className="w-full h-9 text-xs" disabled>
              <Lock className="h-3 w-3 mr-1.5" />
              Requires {chain.requiredRank} Rank
            </Button>
          ) : isComplete ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={() => onReset?.(chain.id)}
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Restart Chain
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="flex-1 h-9 text-xs gap-1.5"
                asChild
              >
                <a href={`/practice?env=${chain.stages[0].env}&role=${chain.stages[0].role}&chain=${chain.id}&stage=0`}>
                  Replay <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          ) : (
            <Button
              variant="hero"
              size="sm"
              className="w-full h-9 text-xs gap-1.5"
              asChild
            >
              <a href={`/practice?env=${nextStage.env}&role=${nextStage.role}&chain=${chain.id}&stage=${nextStageIndex}`}>
                {completedStages > 0 ? "Continue Chain" : "Start Chain"} — {nextStage.title}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
