import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import {
  loadProgress,
  getSkillLevel,
  SKILL_LABELS,
  type ProgressState,
  type SkillProgressData,
} from "@/components/practice/skillProgress";

function SkillProgressBar({
  label,
  score,
  delay,
}: {
  label: string;
  score: number;
  delay: number;
}) {
  const level = getSkillLevel(score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            Level {level.level} — {level.title}
          </span>
        </div>
        <span className="text-sm font-bold text-foreground tabular-nums">
          {score}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay }}
          className="h-full rounded-full bg-primary"
        />
      </div>
      {level.nextLevelAt !== null && (
        <p className="text-[11px] text-muted-foreground">
          Next level at score {level.nextLevelAt}
        </p>
      )}
    </div>
  );
}

const Progress = () => {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  const hasData = progress.totalSessions > 0;
  const skillKeys = Object.keys(SKILL_LABELS) as (keyof SkillProgressData)[];
  const streakActive =
    progress.streak.lastSessionDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
            Your Sales Skill Progress
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track your growth across core sales competencies.
          </p>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 card-elevated p-5 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground font-heading">
              {progress.streak.currentStreak > 0
                ? `🔥 ${progress.streak.currentStreak} Day Rehearsal Streak`
                : "No active streak"}
            </p>
            <p className="text-sm text-muted-foreground">
              {streakActive
                ? "Great job! You've practiced today."
                : "Complete one scenario today to keep your streak."}
            </p>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-4 grid grid-cols-2 gap-4"
        >
          <div className="card-elevated p-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground font-heading">
                {progress.totalSessions}
              </p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground font-heading">
                {hasData
                  ? Math.round(
                      skillKeys.reduce(
                        (sum, k) => sum + progress.skills[k],
                        0
                      ) / skillKeys.length
                    )
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Skill Score</p>
            </div>
          </div>
        </motion.div>

        {/* Skill bars */}
        {hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-8 card-elevated p-6 space-y-6"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Skill Breakdown
            </p>
            {skillKeys.map((key, i) => (
              <SkillProgressBar
                key={key}
                label={SKILL_LABELS[key]}
                score={progress.skills[key]}
                delay={0.4 + i * 0.1}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-8 card-elevated p-8 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Complete your first rehearsal to start tracking progress.
            </p>
            <Button variant="hero" asChild>
              <a href="/scenarios" className="gap-2">
                Start a Scenario
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Progress;
