import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, TrendingUp, Zap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getTodayChallenge } from "@/components/practice/dailyChallenge";
import { ENVIRONMENTS } from "@/components/practice/environments";

export default function ChallengeHero() {
  const { challenge } = getTodayChallenge();
  const env = ENVIRONMENTS.find((e) => e.id === challenge.environmentId);

  const [avgScore, setAvgScore] = useState<number>(72);
  const [topScore, setTopScore] = useState<number>(94);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("scorecards")
      .select("score")
      .gte("created_at", `${today}T00:00:00`)
      .order("score", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data && data.length >= 1) {
          const avg = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);
          setAvgScore(avg);
          setTopScore(data[0].score);
          setTotalPlayers(data.length);
        }
      });
  }, []);

  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-14">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[100px]" />

      <div className="container relative z-10 mx-auto px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          {/* Pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-sm"
          >
            <Timer className="h-3 w-3" />
            Takes ~60 seconds · No account required
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="space-y-3"
          >
            <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.5rem] text-foreground">
              Can You Beat the
              <br />
              <span className="text-gradient">Average SDR?</span>
            </h1>
            <p className="mx-auto max-w-md text-base md:text-lg text-muted-foreground leading-relaxed">
              Real prospect objection. AI scoring. See how you stack up against
              {totalPlayers > 0 ? ` ${totalPlayers}+ ` : " "}
              other sales reps — instantly.
            </p>
          </motion.div>

          {/* Score benchmarks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="flex items-stretch justify-center gap-3 md:gap-4"
          >
            {/* Average Score */}
            <div className="flex-1 max-w-[160px] rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Avg Score
                </span>
              </div>
              <p className="text-3xl font-heading font-bold text-foreground tabular-nums">
                {avgScore}
              </p>
              <p className="text-[10px] text-muted-foreground/60">out of 100</p>
            </div>

            {/* Divider */}
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                vs
              </span>
            </div>

            {/* Top Score */}
            <div className="flex-1 max-w-[160px] rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                  Top Score
                </span>
              </div>
              <p className="text-3xl font-heading font-bold text-primary tabular-nums">
                {topScore}
              </p>
              <p className="text-[10px] text-primary/40">today's best</p>
            </div>
          </motion.div>

          {/* Challenge scenario card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mx-auto max-w-lg rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5"
          >
            <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <div className="p-5 md:p-6 space-y-4">
              {/* Scenario tag */}
              <div className="flex items-center gap-2">
                {env && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 border border-border px-2.5 py-0.5 rounded-full">
                    {env.title}
                  </span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">
                  {challenge.skillFocus}
                </span>
              </div>

              {/* Prompt preview */}
              <div className="rounded-xl bg-muted/30 border border-border p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Prospect says:
                </p>
                <p className="text-lg font-heading font-bold text-foreground leading-snug italic">
                  "We're happy with our current vendor."
                </p>
              </div>

              {/* Goal */}
              <p className="text-sm text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary inline mr-1.5 -mt-0.5" />
                {challenge.successLabel}
              </p>

              {/* Primary CTA */}
              <Button
                variant="hero"
                className="w-full h-12 text-base gap-2"
                asChild
              >
                <Link to={`/practice?env=${challenge.environmentId}&role=${challenge.personaId}&daily=1`}>
                  Take the Challenge
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="text-[10px] text-muted-foreground/50 text-center">
                Free to play · AI-scored in seconds
              </p>
            </div>
          </motion.div>

          {/* Social proof nudge */}
          {totalPlayers > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60"
            >
              <TrendingUp className="h-3 w-3" />
              <span>{totalPlayers} reps have attempted today</span>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
