import { motion } from "framer-motion";
import { Flame, Gift, Trophy, Zap } from "lucide-react";

const STREAK_MILESTONES = [
  { days: 3, label: "3-Day Consistency", badge: "🔥", xpBonus: 1.1 },
  { days: 7, label: "Weekly Warrior", badge: "🏅", xpBonus: 1.25 },
  { days: 14, label: "Two-Week Titan", badge: "🏅", xpBonus: 1.5 },
  { days: 30, label: "30-Day Legend", badge: "🏆", xpBonus: 2.0 },
];

export function getStreakXpMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

function getNextMilestone(streak: number) {
  return STREAK_MILESTONES.find((m) => streak < m.days) ?? null;
}

function getReachedMilestone(streak: number) {
  return [...STREAK_MILESTONES].reverse().find((m) => streak >= m.days) ?? null;
}

interface StreakRewardProps {
  currentStreak: number;
  longestStreak: number;
  /** Whether the streak just increased this session */
  justIncreased?: boolean;
}

export function StreakReward({ currentStreak, longestStreak, justIncreased }: StreakRewardProps) {
  if (currentStreak === 0) return null;

  const isOnFire = currentStreak >= 3;
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak && justIncreased;
  const multiplier = getStreakXpMultiplier(currentStreak);
  const hasBonus = multiplier > 1;
  const reachedMilestone = getReachedMilestone(currentStreak);
  const nextMilestone = getNextMilestone(currentStreak);
  const justHitMilestone = justIncreased && STREAK_MILESTONES.some((m) => m.days === currentStreak);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
      className={`rounded-xl border overflow-hidden ${
        justHitMilestone
          ? "border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
          : isOnFire
          ? "border-orange-500/30 bg-gradient-to-br from-orange-500/8 to-transparent"
          : "border-border bg-card"
      }`}
    >
      <div className="px-4 py-3 space-y-2.5">
        {/* Streak header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={isOnFire ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`flex items-center justify-center h-9 w-9 rounded-full ${
                isOnFire ? "bg-orange-500/15" : "bg-muted"
              }`}
            >
              <Flame className={`h-5 w-5 ${isOnFire ? "text-orange-500" : "text-muted-foreground"}`} />
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xl font-bold font-heading tabular-nums ${
                  isOnFire ? "text-orange-500" : "text-foreground"
                }`}>
                  {currentStreak}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Day Streak
                </span>
                {isNewRecord && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full"
                  >
                    NEW BEST
                  </motion.span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {justIncreased ? "Streak extended! Keep it going." : "Practice daily to build your streak."}
              </p>
            </div>
          </div>

          {longestStreak > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-3 w-3" />
              <span className="text-[10px] tabular-nums font-medium">{longestStreak}</span>
            </div>
          )}
        </div>

        {/* XP Bonus indicator */}
        {hasBonus && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/15"
          >
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-[11px] text-foreground font-medium">
              <span className="text-primary font-bold">{Math.round((multiplier - 1) * 100)}% XP Bonus</span>
              {" "}active from your streak
            </p>
          </motion.div>
        )}

        {/* Milestone hit celebration */}
        {justHitMilestone && reachedMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/25"
          >
            <Gift className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">
                {reachedMilestone.badge} {reachedMilestone.label} Unlocked!
              </p>
              <p className="text-[10px] text-muted-foreground">
                You now earn {Math.round((reachedMilestone.xpBonus - 1) * 100)}% bonus XP on all skills
              </p>
            </div>
          </motion.div>
        )}

        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (currentStreak / nextMilestone.days) * 100)}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
              />
            </div>
            <p className="text-[9px] text-muted-foreground text-right tabular-nums">
              {currentStreak}/{nextMilestone.days} days to{" "}
              <span className="font-semibold text-foreground">
                {nextMilestone.badge} {nextMilestone.label}
              </span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
