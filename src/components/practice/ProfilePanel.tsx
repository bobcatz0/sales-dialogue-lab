import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame, Target, Award, Shield, Zap, Star, Cpu, Trophy, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BADGE_DEFINITIONS, loadEarnedBadges } from "@/components/practice/achievements";
import type { ConsistencyData } from "@/components/practice/consistencyScoring";
import { getRank } from "@/components/practice/progression";
import { getInterviewReadyStatus } from "@/components/practice/interviewReadyStatus";
import { getDrillStats } from "@/components/practice/drillTracking";
import { loadHistory } from "@/components/practice/sessionStorage";
import { useAuth } from "@/hooks/useAuth";
import { EvaluatorBadge, EvaluatorReputation } from "./EvaluatorBadges";
import { WeeklyChallengeBadges } from "@/components/clans/WeeklyChallengeBadges";
import { UserAvatar } from "@/components/UserAvatar";

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
  const { profile, user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <UserAvatar
          avatarUrl={profile?.avatar_url}
          displayName={alias}
          elo={profile?.elo ?? 1000}
          size="sm"
          showRankBadge={false}
        />
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

      {/* Evaluator badge & reputation */}
      {profile?.is_evaluator && (
        <div className="space-y-1.5">
          <EvaluatorBadge size="sm" />
          <EvaluatorReputation
            reputation={profile.evaluator_reputation}
            reviewsGiven={profile.reviews_given}
          />
        </div>
      )}

      {/* Weekly Challenge Badges */}
      {user && <WeeklyChallengeBadges userId={user.id} />}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold font-heading text-foreground">{consistency.totalSessions}</div>
          <div className="text-[10px] text-muted-foreground">Sessions</div>
        </div>
        <div>
          <div className="text-lg font-bold font-heading text-foreground">{earnedIds.length}</div>
          <div className="text-[10px] text-muted-foreground">Milestones</div>
        </div>
        <div>
          <div className="text-lg font-bold font-heading text-foreground">{consistency.sessionsThisWeek}</div>
          <div className="text-[10px] text-muted-foreground">This Week</div>
        </div>
      </div>

      {/* Weekly Goal */}
      {(() => {
        const GOAL_KEY = "salescalls_weekly_goal";
        const [goal, setGoalState] = useState<number>(() => {
          try { return parseInt(localStorage.getItem(GOAL_KEY) || "0", 10) || 0; } catch { return 0; }
        });
        const setGoal = useCallback((v: number) => {
          const clamped = Math.max(0, Math.min(14, v));
          setGoalState(clamped);
          if (clamped > 0) localStorage.setItem(GOAL_KEY, String(clamped));
          else localStorage.removeItem(GOAL_KEY);
        }, []);

        const done = consistency.sessionsThisWeek;
        const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
        const met = goal > 0 && done >= goal;

        if (goal === 0) {
          return (
            <div className="flex items-center justify-between rounded-lg p-2.5 border border-dashed border-border bg-muted/20">
              <p className="text-[10px] text-muted-foreground">Set a weekly session goal</p>
              <div className="flex gap-1">
                {[3, 5, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGoal(n)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border bg-background text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className={`rounded-lg p-2.5 border ${met ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Target className={`h-3 w-3 ${met ? "text-primary" : "text-muted-foreground"}`} />
                <p className={`text-[10px] font-semibold ${met ? "text-primary" : "text-foreground"}`}>
                  {met ? "Goal reached!" : `${done}/${goal} sessions`}
                </p>
              </div>
              <button
                onClick={() => setGoal(0)}
                className="text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${met ? "bg-primary" : "bg-primary/50"}`}
              />
            </div>
          </div>
        );
      })()}

      {/* Streak Display — uses DB-backed streak from profile */}
      {(() => {
        const dbStreak = (profile as any)?.current_streak ?? consistency.currentStreak;
        const dbBest = (profile as any)?.longest_streak ?? consistency.bestStreak;
        const streak = Math.max(dbStreak, consistency.currentStreak);
        const best = Math.max(dbBest, consistency.bestStreak);
        const isOnFire = streak >= 3;

        const MILESTONES = [7, 14, 30];
        const nextMilestone = MILESTONES.find((m) => streak < m) ?? null;
        const milestoneProgress = nextMilestone
          ? Math.min(100, (streak / nextMilestone) * 100)
          : 100;
        const milestoneLabel = nextMilestone === 7 ? "Weekly Warrior 🏅" : nextMilestone === 14 ? "Two-Week Titan 🏅" : nextMilestone === 30 ? "30-Day Legend 🏆" : null;

        return (
          <div className={`rounded-lg p-3 border space-y-2 ${isOnFire ? "border-primary/25 bg-primary/5" : "border-border bg-muted/30"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className={`h-4 w-4 ${isOnFire ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-sm font-bold ${isOnFire ? "text-primary" : "text-foreground"}`}>
                    {streak} day{streak !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Current streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{best}</p>
                <p className="text-[9px] text-muted-foreground">Best</p>
              </div>
            </div>
            {nextMilestone && milestoneLabel && (
              <div className="space-y-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${milestoneProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground text-right tabular-nums">
                  {streak}/{nextMilestone} to <span className="font-semibold text-foreground">{milestoneLabel}</span>
                </p>
              </div>
            )}
            {isOnFire && !nextMilestone && (
              <p className="text-[9px] text-primary/80 font-medium text-center">
                🔥 All milestones unlocked. Legendary discipline.
              </p>
            )}
          </div>
        );
      })()}

      {/* 7-Day Activity Heatmap */}
      {(() => {
        const history = loadHistory();
        const today = new Date();
        const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
        const dow = today.getDay(); // 0=Sun
        const mondayOffset = dow === 0 ? -6 : 1 - dow;

        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + mondayOffset + i);
          const dateStr = d.toISOString().slice(0, 10);
          const count = history.filter((s) => s.date?.slice(0, 10) === dateStr).length;
          const isToday = dateStr === today.toISOString().slice(0, 10);
          return { label: dayLabels[i], count, isToday };
        });

        return (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">This Week</p>
            <div className="flex gap-1.5 justify-between">
              {days.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors ${
                      day.count >= 3
                        ? "bg-primary text-primary-foreground"
                        : day.count === 2
                        ? "bg-primary/60 text-primary-foreground"
                        : day.count === 1
                        ? "bg-primary/25 text-primary"
                        : "bg-muted text-muted-foreground/40"
                    } ${day.isToday ? "ring-1 ring-primary/50 ring-offset-1 ring-offset-background" : ""}`}
                  >
                    {day.count || ""}
                  </div>
                  <span className={`text-[9px] ${day.isToday ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 4-Week Performance Trends */}
      {(() => {
        const history = loadHistory();
        if (history.length < 2) return null;

        const today = new Date();
        const dow = today.getDay();
        const mondayOffset = dow === 0 ? -6 : 1 - dow;

        const weeks = Array.from({ length: 4 }, (_, wi) => {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() + mondayOffset - wi * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          const startStr = weekStart.toISOString().slice(0, 10);
          const endStr = weekEnd.toISOString().slice(0, 10);

          const sessions = history.filter((s) => {
            const d = s.date?.slice(0, 10);
            return d && d >= startStr && d < endStr;
          });

          const avg = sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
            : null;

          const label = wi === 0 ? "This" : wi === 1 ? "Last" : `${wi}w ago`;
          return { label, sessions: sessions.length, avg };
        }).reverse();

        const maxSessions = Math.max(...weeks.map((w) => w.sessions), 1);

        return (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">4-Week Trend</p>
            <div className="flex gap-1 justify-between items-end h-16">
              {weeks.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full flex justify-center items-end h-10">
                    <div
                      className={`w-5 rounded-sm transition-all ${
                        week.avg !== null && week.avg >= 70
                          ? "bg-primary"
                          : week.avg !== null
                          ? "bg-primary/40"
                          : "bg-muted"
                      }`}
                      style={{ height: `${week.sessions > 0 ? Math.max(20, (week.sessions / maxSessions) * 100) : 8}%` }}
                    />
                  </div>
                  {week.avg !== null ? (
                    <span className="text-[9px] font-bold text-foreground tabular-nums">{week.avg}</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/40">—</span>
                  )}
                  <span className="text-[8px] text-muted-foreground">{week.label}</span>
                </div>
              ))}
            </div>
            {(() => {
              const thisWeek = weeks[3];
              const lastWeek = weeks[2];
              if (thisWeek.avg !== null && lastWeek.avg !== null) {
                const diff = thisWeek.avg - lastWeek.avg;
                if (diff > 0) return <p className="text-[9px] text-primary mt-1.5 text-center font-medium">+{diff} avg vs last week</p>;
                if (diff < 0) return <p className="text-[9px] text-muted-foreground mt-1.5 text-center">↓{Math.abs(diff)} avg vs last week</p>;
              }
              return null;
            })()}
          </div>
        );
      })()}

      {/* Skill Progression (Last 10 Sessions) */}
      {(() => {
        const history = loadHistory();
        const recent = history.slice(0, 10).reverse();
        const sessionsWithSkills = recent.filter((s) => s.skillBreakdown && s.skillBreakdown.length > 0);
        if (sessionsWithSkills.length < 2) return null;

        const skillNames = Array.from(
          new Set(sessionsWithSkills.flatMap((s) => (s.skillBreakdown || []).map((sk) => sk.name)))
        );

        const SKILL_COLORS = ["bg-primary", "bg-primary/70", "bg-primary/45", "bg-primary/25", "bg-accent"];

        const mid = Math.floor(sessionsWithSkills.length / 2);
        const firstHalf = sessionsWithSkills.slice(0, mid);
        const secondHalf = sessionsWithSkills.slice(mid);

        const avgForSkill = (sessions: typeof sessionsWithSkills, name: string) => {
          const scores = sessions.flatMap((s) =>
            (s.skillBreakdown || []).filter((sk) => sk.name === name).map((sk) => sk.score)
          );
          return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        };

        const skillData = skillNames.map((name, i) => {
          const early = avgForSkill(firstHalf, name);
          const latest = avgForSkill(secondHalf, name);
          const diff = early !== null && latest !== null ? latest - early : null;
          return { name, latest, diff, color: SKILL_COLORS[i % SKILL_COLORS.length] };
        }).filter((s) => s.latest !== null);

        if (skillData.length === 0) return null;

        return (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Skill Progression <span className="normal-case font-normal">· last {sessionsWithSkills.length} sessions</span>
            </p>
            <div className="space-y-1.5">
              {skillData.map((skill) => (
                <div key={skill.name} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{skill.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-foreground tabular-nums">{skill.latest}</span>
                      {skill.diff !== null && skill.diff !== 0 && (
                        <span className={`text-[9px] font-medium ${skill.diff > 0 ? "text-primary" : "text-destructive"}`}>
                          {skill.diff > 0 ? "+" : ""}{skill.diff}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.latest}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${skill.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
