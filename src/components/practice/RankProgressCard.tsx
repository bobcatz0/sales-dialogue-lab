import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { getEloRank, getRankThresholds, type RankTier } from "@/lib/elo";

function getRankColor(rank: string) {
  switch (rank) {
    case "Sales Architect": return "text-purple-400";
    case "Rainmaker": return "text-yellow-400";
    case "Operator": return "text-blue-400";
    case "Closer": return "text-primary";
    case "Prospector": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

function getRankGradient(rank: string) {
  switch (rank) {
    case "Sales Architect": return "from-purple-500 to-purple-400";
    case "Rainmaker": return "from-yellow-500 to-yellow-400";
    case "Operator": return "from-blue-500 to-blue-400";
    case "Closer": return "from-primary to-primary/80";
    case "Prospector": return "from-orange-500 to-orange-400";
    default: return "from-muted-foreground to-muted-foreground/80";
  }
}

interface RankProgressCardProps {
  elo: number;
  eloDelta: number | null;
}

export function RankProgressCard({ elo, eloDelta }: RankProgressCardProps) {
  const currentRank = getEloRank(elo);
  const thresholds = getRankThresholds();

  // Find current and next rank thresholds
  const currentIdx = thresholds.findIndex((t) => t.name === currentRank);
  const nextThreshold = currentIdx < thresholds.length - 1 ? thresholds[currentIdx + 1] : null;
  const currentMin = thresholds[currentIdx]?.min ?? 0;
  const nextMin = nextThreshold?.min ?? elo + 100;
  const nextRank = nextThreshold?.name ?? null;

  const rangeSize = nextMin - currentMin;
  const progressInRange = elo - currentMin;
  const progressPercent = rangeSize > 0 ? Math.min(100, Math.max(0, (progressInRange / rangeSize) * 100)) : 100;
  const eloToNext = nextMin - elo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card-elevated overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Rank Progress
        </p>
      </div>
      <div className="p-4 space-y-3">
        {/* Current rank + ELO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${getRankColor(currentRank)}`}>
              {currentRank}
            </span>
            <span className="text-lg font-bold font-heading text-foreground tabular-nums">
              {elo}
            </span>
            <span className="text-[10px] text-muted-foreground">ELO</span>
          </div>
          {eloDelta != null && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                eloDelta >= 0
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {eloDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {eloDelta >= 0 ? "+" : ""}{eloDelta}
            </motion.span>
          )}
        </div>

        {/* Progress bar */}
        {nextRank && (
          <div className="space-y-1.5">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${getRankGradient(currentRank)}`}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold ${getRankColor(currentRank)}`}>
                {currentRank}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {eloToNext} ELO to
                </span>
                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                <span className={`text-[10px] font-semibold ${getRankColor(nextRank)}`}>
                  {nextRank}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* At max rank */}
        {!nextRank && (
          <p className="text-[10px] text-muted-foreground text-center">
            🏆 Highest rank achieved
          </p>
        )}
      </div>
    </motion.div>
  );
}
