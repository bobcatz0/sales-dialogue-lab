import { motion } from "framer-motion";
import { Star, TrendingUp, Lightbulb, Quote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feedback } from "./types";

export function FeedbackPanel({
  feedback,
  onClose,
}: {
  feedback: Feedback;
  onClose: () => void;
}) {
  const scoreColor =
    feedback.score >= 7
      ? "text-primary"
      : feedback.score >= 4
        ? "text-accent-foreground"
        : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="card-elevated p-6 space-y-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            Session Feedback
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {feedback.overall}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 -mt-1 -mr-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className={`text-3xl font-bold font-heading ${scoreColor}`}>
          {feedback.score}/10
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-5 rounded-full transition-colors ${
                i < feedback.score ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {feedback.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 text-primary" />
              Strengths
            </div>
            <ul className="space-y-1">
              {feedback.strengths.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground leading-relaxed pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-primary"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {feedback.improvements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              Areas to Improve
            </div>
            <ul className="space-y-1">
              {feedback.improvements.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground leading-relaxed pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-muted-foreground"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {feedback.keyMoment && (
        <div className="bg-muted/50 rounded-lg p-3.5 border border-border">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5">
            <Quote className="h-3.5 w-3.5 text-primary" />
            Key Moment
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            &ldquo;{feedback.keyMoment}&rdquo;
          </p>
        </div>
      )}

      {feedback.tip && (
        <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3.5 border border-primary/10">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            {feedback.tip}
          </p>
        </div>
      )}
    </motion.div>
  );
}
