import { motion } from "framer-motion";
import { User, Flame, Target, Award, Shield, Zap, Star, Cpu, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BADGE_DEFINITIONS, loadEarnedBadges } from "@/components/practice/achievements";
import type { ConsistencyData } from "@/components/practice/consistencyScoring";
import { getRank } from "@/components/practice/progression";

const BADGE_ICONS: Record<string, React.ElementType> = {
  shield: Shield,
  target: Target,
  zap: Zap,
  flame: Flame,
  award: Award,
  star: Star,
  trophy: Trophy,
  cpu: Cpu,
};

interface ProfilePanelProps {
  alias: string;
  consistency: ConsistencyData;
}

export function ProfilePanel({ alias, consistency }: ProfilePanelProps) {
  const rank = getRank(consistency.score);
  const earnedIds = loadEarnedBadges();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{alias}</p>
          <p className="text-[11px] text-muted-foreground">
            {rank} · {consistency.currentStreak} day streak
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] font-medium border-border text-muted-foreground shrink-0">
          {rank}
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold font-heading text-foreground">{consistency.totalSessions}</div>
          <div className="text-[10px] text-muted-foreground">Sessions</div>
        </div>
        <div>
          <div className="text-lg font-bold font-heading text-foreground">{consistency.currentStreak}</div>
          <div className="text-[10px] text-muted-foreground">Streak</div>
        </div>
        <div>
          <div className="text-lg font-bold font-heading text-foreground">{earnedIds.length}</div>
          <div className="text-[10px] text-muted-foreground">Milestones</div>
        </div>
      </div>

      {/* Badges grid */}
      {BADGE_DEFINITIONS.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-2 font-medium">Milestones</p>
          <div className="grid grid-cols-4 gap-1.5">
            {BADGE_DEFINITIONS.map((b) => {
              const earned = earnedIds.includes(b.id);
              const IconComp = BADGE_ICONS[b.icon] || Award;
              return (
                <div
                  key={b.id}
                  title={earned ? `${b.label}: ${b.description}` : `Locked — ${b.description}`}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-opacity ${
                    earned ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                    earned ? "bg-primary/15" : "bg-muted"
                  }`}>
                    <IconComp className={`h-3.5 w-3.5 ${earned ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight truncate w-full">
                    {b.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sync note */}
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Accounts coming soon to sync across devices
      </p>
    </motion.div>
  );
}
