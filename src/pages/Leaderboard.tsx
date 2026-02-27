import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, TrendingDown, Target, User, Minus, Award, Zap } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { loadConsistency, computeProfileStats, type ConsistencyData } from "@/components/practice/consistencyScoring";
import { loadHistory } from "@/components/practice/sessionStorage";
import { roles } from "@/components/practice/roleData";
import type { SessionRecord } from "@/components/practice/types";

const LeaderboardPage = () => {
  const [consistency, setConsistency] = useState<ConsistencyData | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setConsistency(loadConsistency());
    setSessions(loadHistory());
  }, []);

  if (!consistency) return null;

  const stats = computeProfileStats(sessions);
  const mostPracticedRole = roles.find((r) => r.id === stats.mostPracticed);

  const trendIcon =
    stats.trend === "up" ? <TrendingUp className="h-4 w-4 text-primary" /> :
    stats.trend === "down" ? <TrendingDown className="h-4 w-4 text-destructive" /> :
    <Minus className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Consistency beats talent. Show up, improve, repeat.
            </p>
          </div>

          {/* Consistency Score Hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-8 text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              Your Consistency Score
            </div>
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              className="text-6xl font-bold font-heading text-primary"
            >
              {consistency.score}
            </motion.div>
            <div className="text-xs text-muted-foreground">out of 1,000</div>
            <div className="w-full max-w-sm mx-auto h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(consistency.score / 1000) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-primary"
              />
            </div>

            {/* Sign up banner */}
            <div className="bg-muted/50 rounded-lg p-3 border border-border mt-4">
              <p className="text-xs text-muted-foreground">
                🔒 Sign up to save progress across devices and compete on the global leaderboard.
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Target className="h-4 w-4 text-primary" />}
              label="Total Sessions"
              value={consistency.totalSessions.toString()}
              delay={0.15}
            />
            <StatCard
              icon={<Flame className="h-4 w-4 text-primary" />}
              label="Current Streak"
              value={`${consistency.currentStreak} day${consistency.currentStreak !== 1 ? "s" : ""}`}
              delay={0.2}
            />
            <StatCard
              icon={<Award className="h-4 w-4 text-primary" />}
              label="Best Streak"
              value={`${consistency.bestStreak} day${consistency.bestStreak !== 1 ? "s" : ""}`}
              delay={0.25}
            />
            <StatCard
              icon={trendIcon}
              label="Improvement"
              value={stats.trend === "up" ? "Improving" : stats.trend === "down" ? "Declining" : "Steady"}
              delay={0.3}
            />
          </div>

          {/* Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weekly Points */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card-elevated p-5 space-y-3"
            >
              <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                This Week
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-heading text-foreground">
                  {consistency.weeklyPoints}
                </span>
                <span className="text-sm text-muted-foreground">pts</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {consistency.sessionsThisWeek} session{consistency.sessionsThisWeek !== 1 ? "s" : ""} completed this week
              </p>
            </motion.div>

            {/* Profile Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card-elevated p-5 space-y-3"
            >
              <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Profile
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Score (last 10)</span>
                  <span className="font-medium text-foreground">{stats.avgScore}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Most Practiced</span>
                  <span className="font-medium text-foreground">
                    {mostPracticedRole?.title ?? "—"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="card-elevated p-5 space-y-3"
            >
              <h3 className="font-heading text-sm font-bold text-foreground">
                Recent Sessions
              </h3>
              <div className="space-y-1">
                {sessions.slice(0, 8).map((s, i) => {
                  const role = roles.find((r) => r.id === s.roleId);
                  const Icon = role?.icon;
                  const date = new Date(s.date);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground w-6 text-center font-medium">
                        {i + 1}
                      </span>
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {s.roleTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          {" · "}
                          {s.rank} · Lvl {s.peakDifficulty ?? 1}
                        </span>
                      </div>
                      <span className="text-sm font-bold font-heading text-primary shrink-0">
                        {s.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {sessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No sessions yet. Head to{" "}
                <a href="/practice" className="text-primary hover:underline">
                  Practice
                </a>{" "}
                to start building your score.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-elevated p-4 text-center space-y-1"
    >
      <div className="flex justify-center">{icon}</div>
      <div className="text-lg font-bold font-heading text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default LeaderboardPage;
