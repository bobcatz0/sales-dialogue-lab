import { motion } from "framer-motion";
import { Star, TrendingUp, Target, RotateCcw, Play, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feedback } from "./types";

function getRankColor(rank: string) {
  switch (rank) {
    case "Rainmaker":
      return "text-primary";
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
      className="card-elevated p-6 space-y-6"
    >
      {/* Score + Rank header */}
      <div className="text-center space-y-3">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Session Results
        </h3>

        {/* Big score */}
        <div className="flex items-baseline justify-center gap-1">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className={`text-5xl font-bold font-heading ${getRankColor(feedback.rank)}`}
          >
            {feedback.score}
          </motion.span>
          <span className="text-lg text-muted-foreground font-medium">/100</span>
        </div>

        {/* Rank badge */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className={`inline-block text-sm font-bold px-3 py-1 rounded-full border ${getRankColor(feedback.rank)} border-current/20 bg-current/5`}
          >
            {feedback.rank}
          </span>
        </motion.div>

        {/* Score bar */}
        <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${feedback.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className={`h-full rounded-full ${getScoreBarColor(feedback.score)}`}
          />
        </div>
      </div>

      {/* Best Moment */}
      {feedback.bestMoment && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-muted/50 rounded-lg p-4 border border-border"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
            <Quote className="h-3.5 w-3.5 text-primary" />
            Best Moment
          </div>
          <p className="text-sm text-foreground italic leading-relaxed">
            "{feedback.bestMoment}"
          </p>
        </motion.div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Star className="h-3.5 w-3.5 text-primary" />
            Strengths
          </div>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-xs text-muted-foreground leading-relaxed pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold"
              >
                {s}
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            Areas to Improve
          </div>
          <ul className="space-y-1.5">
            {feedback.improvements.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-xs text-muted-foreground leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-muted-foreground"
              >
                {s}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next Drill */}
      {feedback.nextDrill && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-start gap-2.5 bg-primary/5 rounded-lg p-4 border border-primary/10"
        >
          <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-foreground block mb-0.5">
              Next Drill
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feedback.nextDrill}
            </p>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 pt-1"
      >
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={onStartNew}
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Start New Session
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onTrySameRole}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Try Same Role Again
        </Button>
      </motion.div>
    </motion.div>
  );
}
