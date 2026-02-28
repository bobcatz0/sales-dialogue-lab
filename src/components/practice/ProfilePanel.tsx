import { motion } from "framer-motion";
import { User, Flame, Target, Award, Shield, Zap, Star, Cpu, Trophy, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BADGE_DEFINITIONS, loadEarnedBadges } from "@/components/practice/achievements";
import type { ConsistencyData } from "@/components/practice/consistencyScoring";
import { getRank } from "@/components/practice/progression";
import { getInterviewReadyStatus } from "@/components/practice/interviewReadyStatus";
import { getDrillStats } from "@/components/practice/drillTracking";

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
  const interviewReady = getInterviewReadyStatus();
  const drillStats = getDrillStats();

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
      {/* Drill Improvement Trends */}
      {drillStats.totalDrills > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground font-medium">Skill Drills</p>
            <span className="text-[10px] text-muted-foreground/60 ml-auto">{drillStats.totalDrills} completed</span>
          </div>
          <div className="space-y-1.5">
            {drillStats.byCategory.map((stat) => {
              const maxCount = drillStats.byCategory[0]?.count || 1;
              const pct = Math.round((stat.count / maxCount) * 100);
              return (
                <div key={stat.category} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{stat.category}</span>
                    <span className="text-[10px] text-foreground tabular-nums">{stat.count}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {drillStats.recentFocus && (
            <p className="text-[10px] text-muted-foreground">
              Recent focus: <span className="text-foreground font-medium">{drillStats.recentFocus}</span>
            </p>
          )}
        </div>
      )}


      {interviewReady && (() => {
        const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(interviewReady.grantedDate).getTime()) / 86400000));
        const expiring = daysLeft <= 5;
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-lg border-2 p-3 ${
              expiring
                ? "border-destructive/40 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent"
                : "border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
            }`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${expiring ? "bg-destructive/5" : "bg-primary/5"}`} />
            <div className="relative flex items-center gap-2.5">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${expiring ? "bg-destructive/15" : "bg-primary/15"}`}>
                <ShieldCheck className={`h-4.5 w-4.5 ${expiring ? "text-destructive" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${expiring ? "text-destructive" : "text-primary"}`}>
                  Interview Ready
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Score {interviewReady.score} · {daysLeft}d remaining
                </p>
                {expiring && (
                  <p className="text-[9px] text-destructive/80 font-medium mt-0.5">
                    Expiring soon — complete a Final Round to renew
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* Sync note */}
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Accounts coming soon to sync across devices
      </p>
    </motion.div>
  );
}
