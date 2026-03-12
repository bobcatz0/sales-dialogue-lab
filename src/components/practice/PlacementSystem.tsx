import { motion } from "framer-motion";
import { Target, Trophy, TrendingUp, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getEloRank, ELO_RANKS } from "@/lib/elo";
import { PLACEMENT_SESSIONS_REQUIRED } from "@/lib/eloSync";
import { UserAvatar } from "@/components/UserAvatar";

interface PlacementProgressProps {
  totalSessions: number;
  elo?: number;
  avatarUrl?: string | null;
  displayName?: string;
}

/** Shows placement progress during the first 3 sessions */
export function PlacementProgress({ totalSessions, elo, avatarUrl, displayName }: PlacementProgressProps) {
  const isPlacing = totalSessions < PLACEMENT_SESSIONS_REQUIRED;
  const progress = Math.min(totalSessions, PLACEMENT_SESSIONS_REQUIRED);

  if (!isPlacing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Placement Phase</span>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary ml-auto">
          {progress}/{PLACEMENT_SESSIONS_REQUIRED}
        </Badge>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Complete {PLACEMENT_SESSIONS_REQUIRED - progress} more simulation{PLACEMENT_SESSIONS_REQUIRED - progress !== 1 ? "s" : ""} to receive your rank and ELO rating.
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: PLACEMENT_SESSIONS_REQUIRED }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8 }}
            animate={{ scale: i < progress ? 1.1 : 0.9 }}
            className={`h-3 w-3 rounded-full transition-colors ${
              i < progress ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface PlacementResultProps {
  elo: number;
  percentile: number;
  avatarUrl?: string | null;
  displayName?: string;
  onDismiss: () => void;
}

/** Shown after completing placement — reveals rank, ELO, percentile, and next tier */
export function PlacementResult({ elo, percentile, avatarUrl, displayName, onDismiss }: PlacementResultProps) {
  const rank = getEloRank(elo);
  const currentRankIdx = ELO_RANKS.findIndex((r) => r.name === rank);
  const nextRank = currentRankIdx < ELO_RANKS.length - 1 ? ELO_RANKS[currentRankIdx + 1] : null;
  const pointsToNext = nextRank ? nextRank.min - elo : 0;

  function getRankColor(r: string) {
    switch (r) {
      case "Sales Architect": return "text-purple-400";
      case "Rainmaker": return "text-yellow-400";
      case "Operator": return "text-blue-400";
      case "Closer": return "text-primary";
      case "Prospector": return "text-orange-400";
      default: return "text-muted-foreground";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="card-elevated p-8 max-w-sm w-full space-y-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
        >
          <Trophy className="h-12 w-12 text-primary mx-auto" />
        </motion.div>

        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Placement Complete!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your rank has been calibrated</p>
        </div>

        {/* Avatar + rank */}
        <div className="flex justify-center">
          <UserAvatar
            avatarUrl={avatarUrl}
            displayName={displayName}
            elo={elo}
            size="lg"
            showRankBadge={false}
          />
        </div>

        {/* ELO + Rank */}
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold font-heading text-foreground tabular-nums"
          >
            {elo}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-lg font-bold mt-1 ${getRankColor(rank)}`}
          >
            {rank}
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Percentile</span>
            </div>
            <p className="text-lg font-bold font-heading text-foreground">
              Top {Math.max(1, 100 - percentile)}%
            </p>
          </div>
          {nextRank ? (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Next Tier</span>
              </div>
              <p className={`text-sm font-bold ${getRankColor(nextRank.name)}`}>
                {nextRank.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {pointsToNext} pts away
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Rank</span>
              </div>
              <p className="text-sm font-bold text-foreground">Max Rank!</p>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Continue to Leaderboard →
        </button>
      </motion.div>
    </motion.div>
  );
}

/** Inline badge shown on leaderboards for users still placing */
export function PlacingBadge() {
  return (
    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary gap-0.5 animate-pulse">
      <Target className="h-2.5 w-2.5" />
      Placing
    </Badge>
  );
}
