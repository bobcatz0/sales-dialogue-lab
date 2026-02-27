import { motion } from "framer-motion";
import { Star, TrendingUp, Target, RotateCcw, Play, Quote, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feedback } from "./types";

function getRankColor(rank: string) {
  switch (rank) {
    case "Rainmaker":
    case "Operator":
      return "text-primary";
    case "Closer":
      return "text-accent-foreground";
    case "Starter":
      return "text-muted-foreground";
    default:
      return "text-destructive";
  }
}

function getScoreBarColor(score: number) {
  if (score >= 81) return "bg-primary";
  if (score >= 61) return "bg-primary/80";
  if (score >= 41) return "bg-accent-foreground";
  if (score >= 21) return "bg-muted-foreground";
  return "bg-destructive";
}

export function FeedbackPanel({
  feedback,
  onStartNew,
  onTrySameRole,
}: {
  feedback: Feedback;
  onStartNew: () => void;
  onTrySameRole: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="card-elevated overflow-hidden"
    >
      {/* Score hero */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-border">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.05 }}
          className={`text-5xl font-bold font-heading ${getRankColor(feedback.rank)}`}
        >
          {feedback.score}
        </motion.span>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRankColor(feedback.rank)} border-current/20`}
          >
            {feedback.rank}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Gauge className="h-3 w-3" />
            Lvl {feedback.peakDifficulty ?? 1}
          </span>
        </div>
        {/* Score bar */}
        <div className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden mt-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${feedback.score}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className={`h-full rounded-full ${getScoreBarColor(feedback.score)}`}
          />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Best Moment */}
        {feedback.bestMoment && (
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground mb-1">
              <Quote className="h-3 w-3 text-muted-foreground" />
              Strongest Moment
            </div>
            <p className="text-sm text-foreground italic leading-relaxed">
              "{feedback.bestMoment}"
            </p>
          </div>
        )}

        {/* Strengths & Focus On */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
              <Star className="h-3 w-3 text-primary" />
              Strengths
            </div>
            {feedback.strengths.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug pl-3.5 relative before:content-['✓'] before:absolute before:left-0 before:text-primary before:text-[10px] before:font-bold">
                {s}
              </p>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              Focus On
            </div>
            {feedback.improvements.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug pl-3.5 relative before:content-['→'] before:absolute before:left-0 before:text-[10px]">
                {s}
              </p>
            ))}
          </div>
        </div>

        {/* Next Drill */}
        {feedback.nextDrill && (
          <div className="flex items-start gap-2 rounded-md p-2.5 bg-muted/50">
            <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">Recommended: </span>
              {feedback.nextDrill}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="default" size="sm" className="flex-1 h-9" onClick={onStartNew}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            New Session
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9" onClick={onTrySameRole}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
