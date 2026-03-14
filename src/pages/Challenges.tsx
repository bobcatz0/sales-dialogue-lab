import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, ArrowRight, Trophy, Crown, Zap, Target, Calendar, Swords, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getTodayChallenge } from "@/components/practice/dailyChallenge";
import { ENVIRONMENTS } from "@/components/practice/environments";
import { roles } from "@/components/practice/roleData";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

const MOCK_DAILY: LeaderboardEntry[] = [
  { rank: 1, name: "Alex K.", score: 94 },
  { rank: 2, name: "Maria S.", score: 89 },
  { rank: 3, name: "Jordan R.", score: 86 },
];

const MOCK_WEEKLY: LeaderboardEntry[] = [
  { rank: 1, name: "Priya T.", score: 97 },
  { rank: 2, name: "Chris L.", score: 92 },
  { rank: 3, name: "Sam W.", score: 88 },
];

const WEEKLY_SCENARIOS = [
  { env: "enterprise", role: "skeptical-buyer", title: "Enterprise Pricing Objection", desc: "Navigate a VP's budget concerns on an enterprise deal.", skill: "Objection Handling" },
  { env: "cold-call", role: "gatekeeper", title: "Cold Call Gauntlet", desc: "Break through a trained gatekeeper in under 3 minutes.", skill: "Call Opening" },
  { env: "interview", role: "hiring-manager", title: "Interview Pressure Round", desc: "Handle rapid-fire behavioral questions from a seasoned hiring manager.", skill: "Clarity Under Pressure" },
];

function getTimeRemaining(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function getWeekTimeRemaining(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h`;
}

function getWeeklyChallenge() {
  const now = new Date();
  const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_SCENARIOS[weekNum % WEEKLY_SCENARIOS.length];
}

function MiniLeaderboard({ entries, emptyText }: { entries: LeaderboardEntry[]; emptyText: string }) {
  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div key={entry.rank} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors">
          <span className="w-5 text-center">
            {entry.rank === 1 ? (
              <Crown className="h-3.5 w-3.5 text-yellow-500 mx-auto" />
            ) : (
              <span className="text-[11px] tabular-nums text-muted-foreground font-medium">#{entry.rank}</span>
            )}
          </span>
          <span className={`text-xs flex-1 truncate ${entry.rank <= 2 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {entry.name}
          </span>
          <span className={`text-xs font-bold tabular-nums font-heading ${entry.rank === 1 ? "text-primary" : "text-foreground"}`}>
            {entry.score}
          </span>
        </div>
      ))}
      <p className="text-[9px] text-muted-foreground/50 text-center pt-2">{emptyText}</p>
    </div>
  );
}

export default function Challenges() {
  const { challenge, completed: dailyCompleted } = getTodayChallenge();
  const env = ENVIRONMENTS.find((e) => e.id === challenge.environmentId);
  const persona = roles.find((r) => r.id === challenge.personaId);
  const weekly = getWeeklyChallenge();

  const [dailyTime, setDailyTime] = useState(getTimeRemaining());
  const [weeklyTime, setWeeklyTime] = useState(getWeekTimeRemaining());
  const [dailyLeaderboard, setDailyLeaderboard] = useState(MOCK_DAILY);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState(MOCK_WEEKLY);

  useEffect(() => {
    const interval = setInterval(() => {
      setDailyTime(getTimeRemaining());
      setWeeklyTime(getWeekTimeRemaining());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("scorecards")
      .select("display_name, score")
      .gte("created_at", `${today}T00:00:00`)
      .order("score", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length >= 3) {
          setDailyLeaderboard(data.map((d, i) => ({ rank: i + 1, name: d.display_name, score: d.score })));
        }
      });

    supabase
      .from("scorecards")
      .select("display_name, score")
      .order("score", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length >= 3) {
          setWeeklyLeaderboard(data.map((d, i) => ({ rank: i + 1, name: d.display_name, score: d.score })));
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Swords className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Challenge Arena</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            Prove Your Skills
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Compete against the community. Climb the ranks. New challenges every day and week.
          </p>
        </motion.div>

        {/* Challenge cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── DAILY CHALLENGE ─── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5 flex flex-col"
          >
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <div className="p-6 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">Daily Challenge</h2>
                    <p className="text-[10px] text-muted-foreground">Resets at midnight</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border shrink-0">
                  <Clock className="h-3 w-3" />
                  {dailyTime}
                </div>
              </div>

              {/* Scenario info */}
              {env && persona && (
                <div className="rounded-xl bg-muted/30 border border-border p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-xs font-semibold text-foreground">{env.title}</span>
                    <span className="text-[10px] text-muted-foreground">→ {persona.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {persona.description}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {challenge.skillFocus}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">•</span>
                    <span className="text-[10px] text-muted-foreground">{challenge.successLabel}</span>
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              <div className="rounded-xl bg-muted/20 border border-border p-3 mb-4 flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today's Leaders</span>
                </div>
                <MiniLeaderboard entries={dailyLeaderboard} emptyText="Complete the drill to appear here" />
              </div>

              {/* CTA */}
              {dailyCompleted ? (
                <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-primary/5 border border-primary/20">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Completed</span>
                  <span className="text-[10px] text-muted-foreground">+25 pts earned</span>
                </div>
              ) : (
                <Button variant="hero" className="w-full h-11 gap-2" asChild>
                  <Link to={`/practice?env=${challenge.environmentId}&role=${challenge.personaId}`}>
                    Attempt Challenge
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>

          {/* ─── WEEKLY CHALLENGE ─── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5 flex flex-col"
          >
            {/* Accent bar — amber for weekly */}
            <div className="h-1 bg-gradient-to-r from-yellow-500/60 via-yellow-500 to-yellow-500/60" />

            <div className="p-6 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">Weekly Challenge</h2>
                    <p className="text-[10px] text-muted-foreground">Resets every Monday</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border shrink-0">
                  <Clock className="h-3 w-3" />
                  {weeklyTime}
                </div>
              </div>

              {/* Scenario info */}
              <div className="rounded-xl bg-muted/30 border border-border p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-yellow-500/70" />
                  <span className="text-xs font-semibold text-foreground">{weekly.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {weekly.desc}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-500 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {weekly.skill}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">•</span>
                  <span className="text-[10px] text-muted-foreground">Best score of the week wins</span>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="rounded-xl bg-muted/20 border border-border p-3 mb-4 flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">This Week's Leaders</span>
                </div>
                <MiniLeaderboard entries={weeklyLeaderboard} emptyText="Take the challenge to compete" />
              </div>

              {/* CTA */}
              <Button variant="hero" className="w-full h-11 gap-2 bg-yellow-500 hover:bg-yellow-500/90 text-background" asChild>
                <Link to={`/practice?env=${weekly.env}&role=${weekly.role}`}>
                  Attempt Challenge
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Past challenges teaser */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-xl border border-border bg-card/50 p-5 text-center"
        >
          <p className="text-xs text-muted-foreground mb-2">Looking for more?</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/scenarios">Browse All Scenarios</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
