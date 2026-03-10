import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, TrendingDown, Target, Minus, Award, Zap, User, Medal, Crown } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { loadConsistency, computeProfileStats, type ConsistencyData } from "@/components/practice/consistencyScoring";
import { loadHistory } from "@/components/practice/sessionStorage";
import { roles } from "@/components/practice/roleData";
import { getRank } from "@/components/practice/progression";
import { loadAlias, loadEarnedBadges } from "@/components/practice/achievements";
import type { SessionRecord } from "@/components/practice/types";

const FRAMEWORK_LABELS: Record<string, string> = {
  star: "STAR",
  bant: "BANT",
  meddic: "MEDDIC",
  spin: "SPIN",
};

function getPercentile(score: number, allScores: number[]): number {
  if (allScores.length < 2) return 99;
  const below = allScores.filter((s) => s < score).length;
  return Math.max(1, Math.min(99, Math.round((below / allScores.length) * 100)));
}

function getMedalIcon(index: number) {
  if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
  if (index === 2) return <Medal className="h-4 w-4 text-amber-600" />;
  return null;
}

const LeaderboardPage = () => {
  const [consistency, setConsistency] = useState<ConsistencyData | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [alias, setAlias] = useState<string | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    setConsistency(loadConsistency());
    setSessions(loadHistory());
    setAlias(loadAlias());
    setBadgeCount(loadEarnedBadges().length);
  }, []);

  if (!consistency) return null;

  const stats = computeProfileStats(sessions);
  const mostPracticedRole = roles.find((r) => r.id === stats.mostPracticed);
  const rank = getRank(consistency.score);
  const allScores = sessions.map((s) => s.score);

  // Top scores — best unique scores sorted descending
  const topScores = [...sessions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

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
              Your top simulation scores ranked by performance.
            </p>
          </div>

          {/* Identity card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="card-elevated p-5 flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-heading font-bold text-foreground truncate">
                {alias ?? "Anonymous"}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-semibold border-primary/40 text-primary">
                  {rank}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3 w-3" /> {consistency.currentStreak} day streak
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="h-3 w-3" /> {badgeCount} badge{badgeCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Target className="h-4 w-4 text-primary" />}
              label="Total Sessions"
              value={consistency.totalSessions.toString()}
              delay={0.1}
            />
            <StatCard
              icon={<Flame className="h-4 w-4 text-primary" />}
              label="Current Streak"
              value={`${consistency.currentStreak} day${consistency.currentStreak !== 1 ? "s" : ""}`}
              delay={0.15}
            />
            <StatCard
              icon={<Zap className="h-4 w-4 text-primary" />}
              label="Consistency Score"
              value={`${consistency.score}`}
              delay={0.2}
            />
            <StatCard
              icon={trendIcon}
              label="Improvement"
              value={stats.trend === "up" ? "Improving" : stats.trend === "down" ? "Declining" : "Steady"}
              delay={0.25}
            />
          </div>

          {/* Top Scores Leaderboard */}
          {topScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-elevated overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Top Scores
                </h3>
              </div>
              <div className="divide-y divide-border">
                {topScores.map((s, i) => {
                  const role = roles.find((r) => r.id === s.roleId);
                  const Icon = role?.icon;
                  const date = new Date(s.date);
                  const percentile = getPercentile(s.score, allScores);
                  const framework = s.frameworkId && s.frameworkId !== "none"
                    ? FRAMEWORK_LABELS[s.frameworkId] || s.frameworkId.toUpperCase()
                    : null;

                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                      className={`flex items-center gap-3 py-3 px-5 hover:bg-muted/30 transition-colors ${
                        i === 0 ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {getMedalIcon(i) || (
                          <span className="text-xs text-muted-foreground font-bold">
                            {i + 1}
                          </span>
                        )}
                      </div>

                      {/* Icon */}
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {s.scenarioTitle || s.roleTitle}
                          </span>
                          {framework && (
                            <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                              {framework}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{s.rank}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] font-medium text-green-500">
                            Top {100 - percentile}%
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <span className={`text-lg font-bold font-heading ${
                          i === 0 ? "text-primary" : "text-foreground"
                        }`}>
                          {s.score}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">/100</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Weekly + Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best Streak</span>
                  <span className="font-medium text-foreground">
                    {consistency.bestStreak} day{consistency.bestStreak !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sign up banner */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <p className="text-xs text-muted-foreground">
              🔒 Accounts coming soon to sync across devices and compete on a global leaderboard.
            </p>
          </div>

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
