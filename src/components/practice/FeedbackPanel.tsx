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
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="card-elevated p-6 space-y-5"
    >
      {/* Score + Rank */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className={`text-4xl font-bold font-heading ${getRankColor(feedback.rank)}`}
          >
            {feedback.score}
          </motion.span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getRankColor(feedback.rank)} border-current/20 bg-current/5`}
          >
            {feedback.rank}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            Lvl {feedback.peakDifficulty ?? 1}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${feedback.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={`h-full rounded-full ${getScoreBarColor(feedback.score)}`}
        />
      </div>

      {/* Best Moment */}
      {feedback.bestMoment && (
        <div className="bg-muted/40 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-1.5">
            <Quote className="h-3 w-3 text-primary" />
            Best Moment
          </div>
          <p className="text-sm text-foreground italic leading-relaxed">
            "{feedback.bestMoment}"
          </p>
        </div>
      )}

      {/* Strengths & Improvements — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Star className="h-3.5 w-3.5 text-primary" />
            Strengths
          </div>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground leading-relaxed pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-primary before:text-[10px] before:font-bold"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            Focus On
          </div>
          <ul className="space-y-1.5">
            {feedback.improvements.map((s, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground leading-relaxed pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-muted-foreground before:text-[10px]"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next Drill */}
      {feedback.nextDrill && (
        <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3 border border-primary/10">
          <Target className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Next: </span>
            {feedback.nextDrill}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="default" size="sm" className="flex-1" onClick={onStartNew}>
          <Play className="h-3.5 w-3.5 mr-1.5" />
          New Session
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onTrySameRole}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    </motion.div>
  );
}
