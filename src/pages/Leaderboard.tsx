import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Flame, TrendingUp, TrendingDown, Target, Minus,
  Award, Zap, User, Mic, BarChart2,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { loadConsistency, computeProfileStats, type ConsistencyData } from "@/components/practice/consistencyScoring";
import { loadHistory } from "@/components/practice/sessionStorage";
import { loadVoiceHistory, loadVoiceRanking, computeVoiceProfileStats } from "@/components/practice/voiceStorage";
import { roles } from "@/components/practice/roleData";
import { getRank } from "@/components/practice/progression";
import { loadAlias, loadEarnedBadges } from "@/components/practice/achievements";
import type { SessionRecord, VoiceSessionRecord, VoiceRankingData } from "@/components/practice/types";
import { usePlan } from "@/context/PlanContext";
import { PlanBadge, UpgradeModal } from "@/components/plan/UpgradePrompt";

type LeaderboardMode = "text" | "voice" | "overall";

const LeaderboardPage = () => {
  const [mode, setMode] = useState<LeaderboardMode>("text");
  const [consistency, setConsistency] = useState<ConsistencyData | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [voiceSessions, setVoiceSessions] = useState<VoiceSessionRecord[]>([]);
  const [voiceRanking, setVoiceRanking] = useState<VoiceRankingData | null>(null);
  const [alias, setAlias] = useState<string | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { plan } = usePlan();

  useEffect(() => {
    setConsistency(loadConsistency());
    setSessions(loadHistory());
    setVoiceSessions(loadVoiceHistory());
    setVoiceRanking(loadVoiceRanking());
    setAlias(loadAlias());
    setBadgeCount(loadEarnedBadges().length);
  }, []);

  if (!consistency) return null;

  const textStats = computeProfileStats(sessions);
  const voiceStats = computeVoiceProfileStats(voiceSessions);
  const mostPracticedRole = roles.find((r) => r.id === textStats.mostPracticed);
  const rank = getRank(consistency.score);

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

          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <ModeButton
              label="Text"
              icon={<BarChart2 className="h-4 w-4" />}
              active={mode === "text"}
              onClick={() => setMode("text")}
            />
            <ModeButton
              label="Voice"
              icon={<Mic className="h-4 w-4" />}
              active={mode === "voice"}
              onClick={() => setMode("voice")}
            />
            <ModeButton
              label="Overall"
              icon={<Trophy className="h-4 w-4" />}
              active={mode === "overall"}
              onClick={() => setMode("overall")}
            />
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
                <PlanBadge tier={plan} />
                {plan === "free" && (
                  <button
                    className="text-[10px] text-primary hover:underline"
                    onClick={() => setShowUpgrade(true)}
                  >
                    Upgrade
                  </button>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3 w-3" /> {consistency.currentStreak} day streak
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="h-3 w-3" /> {badgeCount} badge{badgeCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Mode-specific content */}
          {mode === "text" && (
            <TextLeaderboard
              consistency={consistency}
              sessions={sessions}
              stats={textStats}
              mostPracticedRole={mostPracticedRole}
            />
          )}
          {mode === "voice" && (
            <VoiceLeaderboard
              voiceRanking={voiceRanking}
              voiceSessions={voiceSessions}
              stats={voiceStats}
            />
          )}
          {mode === "overall" && (
            <OverallLeaderboard
              consistency={consistency}
              sessions={sessions}
              textStats={textStats}
              voiceRanking={voiceRanking}
              voiceSessions={voiceSessions}
              voiceStats={voiceStats}
            />
          )}
        </motion.div>
      </div>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        highlightTier="pro"
        reason="Upgrade to unlock voice mode, advanced feedback, and all scenarios."
      />
    </div>
  );
};

// ─── Text Leaderboard ────────────────────────────────────────────────────────

function TextLeaderboard({
  consistency,
  sessions,
  stats,
  mostPracticedRole,
}: {
  consistency: ConsistencyData;
  sessions: SessionRecord[];
  stats: ReturnType<typeof computeProfileStats>;
  mostPracticedRole: (typeof roles)[number] | undefined;
}) {
  const trendIcon =
    stats.trend === "up" ? <TrendingUp className="h-4 w-4 text-primary" /> :
    stats.trend === "down" ? <TrendingDown className="h-4 w-4 text-destructive" /> :
    <Minus className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="space-y-6">
      {/* Consistency Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="card-elevated p-8 text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          Consistency Score
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
        <div className="bg-muted/50 rounded-lg p-3 border border-border mt-4">
          <p className="text-xs text-muted-foreground">
            🔒 Accounts coming soon to sync across devices.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Target className="h-4 w-4 text-primary" />} label="Total Sessions" value={consistency.totalSessions.toString()} delay={0.15} />
        <StatCard icon={<Flame className="h-4 w-4 text-primary" />} label="Current Streak" value={`${consistency.currentStreak}d`} delay={0.2} />
        <StatCard icon={<Award className="h-4 w-4 text-primary" />} label="Best Streak" value={`${consistency.bestStreak}d`} delay={0.25} />
        <StatCard icon={trendIcon} label="Trend" value={stats.trend === "up" ? "Improving" : stats.trend === "down" ? "Declining" : "Steady"} delay={0.3} />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-elevated p-5 space-y-3">
          <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            This Week
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-heading text-foreground">{consistency.weeklyPoints}</span>
            <span className="text-sm text-muted-foreground">pts</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {consistency.sessionsThisWeek} session{consistency.sessionsThisWeek !== 1 ? "s" : ""} this week
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-elevated p-5 space-y-3">
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
              <span className="font-medium text-foreground">{mostPracticedRole?.title ?? "—"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent text sessions */}
      {sessions.length > 0 ? (
        <RecentTextSessions sessions={sessions} />
      ) : (
        <EmptyState href="/practice" label="Start practicing" />
      )}
    </div>
  );
}

// ─── Voice Leaderboard ───────────────────────────────────────────────────────

function VoiceLeaderboard({
  voiceRanking,
  voiceSessions,
  stats,
}: {
  voiceRanking: VoiceRankingData | null;
  voiceSessions: VoiceSessionRecord[];
  stats: ReturnType<typeof computeVoiceProfileStats>;
}) {
  const trendIcon =
    stats.trend === "up" ? <TrendingUp className="h-4 w-4 text-primary" /> :
    stats.trend === "down" ? <TrendingDown className="h-4 w-4 text-destructive" /> :
    <Minus className="h-4 w-4 text-muted-foreground" />;

  const ranking = voiceRanking ?? {
    bestVoiceScore: 0,
    totalVoiceSessions: 0,
    weeklyVoiceSessions: 0,
    weeklyVoicePoints: 0,
    weekStart: "",
    strongestSkill: null,
  };

  const voiceRankLabel = getVoiceRankLabel(ranking.bestVoiceScore);

  return (
    <div className="space-y-6">
      {/* Voice Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="card-elevated p-8 text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mic className="h-4 w-4 text-primary" />
          Best Voice Score
        </div>
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="text-6xl font-bold font-heading text-primary"
        >
          {ranking.bestVoiceScore}
        </motion.div>
        <div className="text-xs text-muted-foreground">out of 100</div>
        <div className="w-full max-w-sm mx-auto h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ranking.bestVoiceScore}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        {voiceRankLabel && (
          <Badge variant="outline" className="text-[11px] font-semibold border-primary/40 text-primary">
            {voiceRankLabel}
          </Badge>
        )}
        {ranking.strongestSkill && (
          <p className="text-xs text-muted-foreground">
            Strongest voice skill: <span className="font-semibold text-foreground">{ranking.strongestSkill}</span>
          </p>
        )}
      </motion.div>

      {/* Voice Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Mic className="h-4 w-4 text-primary" />} label="Voice Sessions" value={ranking.totalVoiceSessions.toString()} delay={0.15} />
        <StatCard icon={<Zap className="h-4 w-4 text-primary" />} label="This Week" value={`${ranking.weeklyVoiceSessions} sess.`} delay={0.2} />
        <StatCard icon={<Award className="h-4 w-4 text-primary" />} label="Weekly Pts" value={ranking.weeklyVoicePoints.toString()} delay={0.25} />
        <StatCard icon={trendIcon} label="Trend" value={stats.trend === "up" ? "Improving" : stats.trend === "down" ? "Declining" : "Steady"} delay={0.3} />
      </div>

      {/* Avg score card */}
      {voiceSessions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-elevated p-5 space-y-2">
          <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Voice Profile
          </h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg Voice Score (last 10)</span>
            <span className="font-medium text-foreground">{stats.avgVoiceScore}/100</span>
          </div>
          {ranking.strongestSkill && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Strongest Skill</span>
              <span className="font-medium text-foreground">{ranking.strongestSkill}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent voice sessions */}
      {voiceSessions.length > 0 ? (
        <RecentVoiceSessions sessions={voiceSessions} />
      ) : (
        <EmptyState href="/practice" label="Try a voice session" />
      )}
    </div>
  );
}

// ─── Overall Leaderboard ─────────────────────────────────────────────────────

function OverallLeaderboard({
  consistency,
  sessions,
  textStats,
  voiceRanking,
  voiceSessions,
  voiceStats,
}: {
  consistency: ConsistencyData;
  sessions: SessionRecord[];
  textStats: ReturnType<typeof computeProfileStats>;
  voiceRanking: VoiceRankingData | null;
  voiceSessions: VoiceSessionRecord[];
  voiceStats: ReturnType<typeof computeVoiceProfileStats>;
}) {
  const ranking = voiceRanking ?? {
    bestVoiceScore: 0,
    totalVoiceSessions: 0,
    weeklyVoiceSessions: 0,
    weeklyVoicePoints: 0,
    weekStart: "",
    strongestSkill: null,
  };

  const totalSessions = consistency.totalSessions + ranking.totalVoiceSessions;
  const weeklyPoints = consistency.weeklyPoints + ranking.weeklyVoicePoints;

  return (
    <div className="space-y-6">
      {/* Overall summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="card-elevated p-6 space-y-4"
      >
        <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Combined Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold font-heading text-primary">{totalSessions}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-heading text-primary">{weeklyPoints}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Weekly Points</div>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            Overall score combines text consistency and voice performance once both modes have sessions.
          </p>
        </div>
      </motion.div>

      {/* Side-by-side text vs voice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Text block */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-elevated p-5 space-y-3">
          <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Text Mode
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-heading text-primary">{consistency.score}</span>
            <span className="text-xs text-muted-foreground">/ 1,000</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sessions</span>
              <span className="font-medium text-foreground">{consistency.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Streak</span>
              <span className="font-medium text-foreground">{consistency.currentStreak}d</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Score</span>
              <span className="font-medium text-foreground">{textStats.avgScore}/100</span>
            </div>
          </div>
        </motion.div>

        {/* Voice block */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-elevated p-5 space-y-3">
          <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            Voice Mode
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-heading text-primary">{ranking.bestVoiceScore}</span>
            <span className="text-xs text-muted-foreground">best / 100</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sessions</span>
              <span className="font-medium text-foreground">{ranking.totalVoiceSessions}</span>
            </div>
            {ranking.strongestSkill && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strongest Skill</span>
                <span className="font-medium text-foreground">{ranking.strongestSkill}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Score</span>
              <span className="font-medium text-foreground">{voiceStats.avgVoiceScore}/100</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent activity from both modes merged */}
      {(sessions.length > 0 || voiceSessions.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-elevated p-5 space-y-3">
          <h3 className="font-heading text-sm font-bold text-foreground">Recent Activity</h3>
          <div className="space-y-1">
            {/* Merge and sort by date, take top 8 */}
            {[
              ...sessions.slice(0, 8).map((s) => ({ type: "text" as const, date: s.date, title: s.roleTitle, score: s.score, rank: s.rank })),
              ...voiceSessions.slice(0, 8).map((s) => ({ type: "voice" as const, date: s.date, title: s.roleTitle, score: s.voiceScore, rank: s.voiceRank })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 8)
              .map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className="text-xs text-muted-foreground w-6 text-center font-medium">{i + 1}</span>
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {entry.type === "voice"
                      ? <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                      : <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate block">{entry.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" · "}{entry.rank}
                      {" · "}<span className="capitalize">{entry.type}</span>
                    </span>
                  </div>
                  <span className="text-sm font-bold font-heading text-primary shrink-0">{entry.score}</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function RecentTextSessions({ sessions }: { sessions: SessionRecord[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card-elevated p-5 space-y-3">
      <h3 className="font-heading text-sm font-bold text-foreground">Recent Text Sessions</h3>
      <div className="space-y-1">
        {sessions.slice(0, 8).map((s, i) => {
          const role = roles.find((r) => r.id === s.roleId);
          const Icon = role?.icon;
          return (
            <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
              <span className="text-xs text-muted-foreground w-6 text-center font-medium">{i + 1}</span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-foreground truncate block">{s.roleTitle}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {" · "}{s.rank} · Lvl {s.peakDifficulty ?? 1}
                </span>
              </div>
              <span className="text-sm font-bold font-heading text-primary shrink-0">{s.score}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RecentVoiceSessions({ sessions }: { sessions: VoiceSessionRecord[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card-elevated p-5 space-y-3">
      <h3 className="font-heading text-sm font-bold text-foreground">Recent Voice Sessions</h3>
      <div className="space-y-1">
        {sessions.slice(0, 8).map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
            <span className="text-xs text-muted-foreground w-6 text-center font-medium">{i + 1}</span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-foreground truncate block">{s.roleTitle}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                {" · "}{s.voiceRank} · Best: {s.strongestSkill}
              </span>
            </div>
            <span className="text-sm font-bold font-heading text-primary shrink-0">{s.voiceScore}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function EmptyState({ href, label }: { href: string; label: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground">
        No sessions yet.{" "}
        <a href={href} className="text-primary hover:underline">{label}</a>{" "}
        to start building your score.
      </p>
    </div>
  );
}

function ModeButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

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

function getVoiceRankLabel(score: number): string {
  if (score >= 90) return "Elite";
  if (score >= 75) return "Pro";
  if (score >= 60) return "Developing";
  if (score >= 45) return "Inconsistent";
  if (score > 0) return "Needs Work";
  return "";
}

export default LeaderboardPage;
