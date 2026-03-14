import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, ArrowRight, Trophy, Check, Crown, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTodayChallenge } from "@/components/practice/dailyChallenge";
import { ENVIRONMENTS } from "@/components/practice/environments";
import { roles } from "@/components/practice/roleData";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Alex K.", score: 94 },
  { rank: 2, name: "Maria S.", score: 89 },
  { rank: 3, name: "Jordan R.", score: 86 },
  { rank: 4, name: "Priya T.", score: 82 },
  { rank: 5, name: "Chris L.", score: 79 },
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

export default function DailyDrillSection() {
  const { challenge, completed } = getTodayChallenge();
  const env = ENVIRONMENTS.find((e) => e.id === challenge.environmentId);
  const persona = roles.find((r) => r.id === challenge.personaId);
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeRemaining()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Try to fetch real top scores for today
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
          setLeaderboard(
            data.map((d, i) => ({
              rank: i + 1,
              name: d.display_name,
              score: d.score,
            }))
          );
        }
      });
  }, []);

  if (!env || !persona) return null;

  const RANK_STYLES: Record<number, string> = {
    1: "text-primary font-bold",
    2: "text-foreground font-semibold",
    3: "text-foreground font-semibold",
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Section label */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-primary/30" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              Daily Drill
            </span>
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            <div className="p-6 md:p-8">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Target className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-foreground">
                        Today's Challenge
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Same scenario for everyone · Best score wins
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
                  <Clock className="h-3 w-3" />
                  {timeLeft} left
                </div>
              </div>

              {/* Challenge details + Leaderboard grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left: Scenario info */}
                <div className="md:col-span-3 space-y-4">
                  <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {env.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <span className="text-xs text-muted-foreground">
                        {persona.title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {persona.description}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {challenge.skillFocus}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">•</span>
                      <span className="text-[10px] text-muted-foreground">
                        {challenge.successLabel}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  {completed ? (
                    <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-primary/5 border border-primary/20">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Completed Today</span>
                      <span className="text-[10px] text-muted-foreground ml-1">+25 pts</span>
                    </div>
                  ) : (
                    <Button
                      variant="hero"
                      className="w-full h-11 text-sm gap-2"
                      asChild
                    >
                      <a href={`/practice?env=${challenge.environmentId}&role=${challenge.personaId}`}>
                        Start Daily Drill
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Right: Mini leaderboard */}
                <div className="md:col-span-2">
                  <div className="rounded-xl bg-muted/20 border border-border p-4 h-full">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Today's Leaders
                      </span>
                    </div>
                    <div className="space-y-2">
                      {leaderboard.map((entry) => (
                        <div
                          key={entry.rank}
                          className="flex items-center gap-2.5 py-1.5"
                        >
                          <span className={`text-xs w-5 text-center tabular-nums ${
                            entry.rank === 1 ? "text-primary font-bold" : "text-muted-foreground"
                          }`}>
                            {entry.rank === 1 ? (
                              <Crown className="h-3.5 w-3.5 text-amber-400 mx-auto" />
                            ) : (
                              `#${entry.rank}`
                            )}
                          </span>
                          <span className={`text-xs flex-1 truncate ${
                            RANK_STYLES[entry.rank] || "text-muted-foreground"
                          }`}>
                            {entry.name}
                          </span>
                          <span className={`text-xs font-bold tabular-nums font-heading ${
                            entry.rank === 1 ? "text-primary" : "text-foreground"
                          }`}>
                            {entry.score}
                          </span>
                        </div>
                      ))}
                    </div>
                    {!completed && (
                      <p className="text-[9px] text-muted-foreground/50 text-center mt-3 pt-2 border-t border-border/50">
                        Complete the drill to appear here
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
