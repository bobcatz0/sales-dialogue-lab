import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Zap, TrendingUp, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadHistory } from "./sessionStorage";
import { supabase } from "@/integrations/supabase/client";

interface RetryLoopPanelProps {
  currentScore: number;
  scenarioRole?: string;
  scenarioEnv?: string;
  scenarioTitle?: string;
  onRetry: () => void;
  onNewScenario: () => void;
}

export function RetryLoopPanel({
  currentScore,
  scenarioRole,
  scenarioEnv,
  scenarioTitle,
  onRetry,
  onNewScenario,
}: RetryLoopPanelProps) {
  const [topScoreToday, setTopScoreToday] = useState<number | null>(null);

  const history = loadHistory();
  const scenarioAttempts = scenarioRole
    ? history.filter((s) => s.roleId === scenarioRole)
    : [];
  const personalBest = scenarioAttempts.length > 0
    ? Math.max(...scenarioAttempts.map((s) => s.score))
    : currentScore;
  const isNewBest = currentScore >= personalBest;

  // Fetch today's top score from scorecards
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    supabase
      .from("scorecards")
      .select("score")
      .gte("created_at", today.toISOString())
      .order("score", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTopScoreToday(data[0].score);
        }
      });
  }, []);

  const effectiveTopToday = topScoreToday !== null
    ? Math.max(topScoreToday, currentScore)
    : currentScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 28 }}
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5"
    >
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      <div className="p-5 space-y-5">
        {/* Score comparison grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Your Score */}
          <div className="text-center p-3 rounded-xl bg-muted/40 border border-border">
            <Zap className="h-4 w-4 text-primary mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Your Score
            </p>
            <p className="text-2xl font-bold font-heading text-primary tabular-nums">
              {currentScore}
            </p>
          </div>

          {/* Personal Best */}
          <div className={`text-center p-3 rounded-xl border ${
            isNewBest
              ? "bg-primary/5 border-primary/25"
              : "bg-muted/40 border-border"
          }`}>
            <Trophy className={`h-4 w-4 mx-auto mb-1.5 ${isNewBest ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Personal Best
            </p>
            <p className={`text-2xl font-bold font-heading tabular-nums ${isNewBest ? "text-primary" : "text-foreground"}`}>
              {personalBest}
            </p>
            {isNewBest && scenarioAttempts.length > 1 && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                NEW!
              </span>
            )}
          </div>

          {/* Top Score Today */}
          <div className="text-center p-3 rounded-xl bg-muted/40 border border-border">
            <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Top Today
            </p>
            <p className="text-2xl font-bold font-heading text-foreground tabular-nums">
              {effectiveTopToday}
            </p>
          </div>
        </div>

        {/* Retry CTA */}
        <Button
          variant="hero"
          size="lg"
          className="w-full h-12 text-sm gap-2"
          onClick={onRetry}
        >
          <RotateCcw className="h-4 w-4" />
          Retry Scenario — Beat Your Score
        </Button>

        {/* Attempt history */}
        {scenarioAttempts.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Attempts
              </p>
            </div>
            <div className="space-y-1">
              {scenarioAttempts.slice(0, 8).map((attempt, idx) => {
                const isBest = attempt.score === personalBest;
                const isCurrent = idx === 0;
                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.06 }}
                    className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition-colors ${
                      isCurrent ? "bg-primary/5 border border-primary/15" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium tabular-nums w-5">
                        #{scenarioAttempts.length - idx}
                      </span>
                      {isCurrent && (
                        <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                          Latest
                        </span>
                      )}
                      {isBest && !isCurrent && (
                        <Trophy className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <span className={`text-sm font-bold font-heading tabular-nums ${
                      isBest ? "text-primary" : "text-foreground"
                    }`}>
                      {attempt.score}
                    </span>
                  </motion.div>
                );
              })}
              {scenarioAttempts.length > 8 && (
                <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
                  +{scenarioAttempts.length - 8} more attempts
                </p>
              )}
            </div>
          </div>
        )}

        {/* Secondary action */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs text-muted-foreground"
          onClick={onNewScenario}
        >
          Try a Different Scenario
        </Button>
      </div>
    </motion.div>
  );
}
