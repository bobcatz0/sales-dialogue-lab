import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

interface PracticeStreakProps {
  currentStreak: number;
  longestStreak: number;
}

export function PracticeStreak({ currentStreak, longestStreak }: PracticeStreakProps) {
  if (currentStreak === 0 && longestStreak === 0) return null;

  const isOnFire = currentStreak >= 3;
  const isRecord = currentStreak > 0 && currentStreak >= longestStreak;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card-elevated px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
          isOnFire ? "bg-orange-500/15" : "bg-muted"
        }`}>
          <Flame className={`h-4 w-4 ${isOnFire ? "text-orange-500" : "text-muted-foreground"}`} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-lg font-bold font-heading tabular-nums ${
              isOnFire ? "text-orange-500" : "text-foreground"
            }`}>
              {currentStreak}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              day streak
            </span>
            {isRecord && currentStreak > 1 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full"
              >
                NEW BEST
              </motion.span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isOnFire ? "🔥 You're on fire! Keep it going." : "Practice daily to build your streak."}
          </p>
        </div>
      </div>
      {longestStreak > 0 && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Trophy className="h-3 w-3" />
          <span className="text-[10px] tabular-nums">{longestStreak}</span>
        </div>
      )}
    </motion.div>
  );
}
