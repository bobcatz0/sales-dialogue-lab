import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronDown, ChevronUp, MessageSquare, Lightbulb, AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnswerComparison, ExposureMoment, TimestampedMoment } from "./types";
import type { SessionRecord } from "./types";
import { loadHistory } from "./sessionStorage";

interface ReplayImprovementPanelProps {
  answerComparisons?: AnswerComparison[];
  exposureMoments?: ExposureMoment[];
  timestampedMoments?: TimestampedMoment[];
  strengths: string[];
  improvements: string[];
  score: number;
  scenarioRole?: string;
  scenarioTitle?: string;
  onRetry: () => void;
}

function ImprovementCard({
  label,
  userResponse,
  issue,
  improvedResponse,
  index,
}: {
  label: string;
  userResponse: string;
  issue: string;
  improvedResponse: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">{label}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* User's response */}
              <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="h-3 w-3 text-destructive" />
                  <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">
                    Your Response
                  </span>
                </div>
                <p className="text-[11px] text-foreground italic leading-relaxed">
                  "{userResponse}"
                </p>
              </div>

              {/* What went wrong */}
              <div className="flex items-start gap-2 px-1">
                <AlertTriangle className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">{issue}</p>
              </div>

              {/* Improved response */}
              <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Improved Response
                  </span>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed">
                  "{improvedResponse}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AttemptTimeline({
  scenarioRole,
  currentScore,
}: {
  scenarioRole?: string;
  currentScore: number;
}) {
  const history = loadHistory();
  const attempts = scenarioRole
    ? history.filter((s) => s.roleId === scenarioRole)
    : [];

  if (attempts.length <= 1) return null;

  const personalBest = Math.max(...attempts.map((a) => a.score));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <Flame className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Attempt History
        </p>
        <span className="text-[10px] text-muted-foreground">
          ({attempts.length} attempts)
        </span>
      </div>

      {/* Visual timeline */}
      <div className="flex items-end gap-1 h-16 px-1">
        {attempts.slice(-12).map((attempt, idx) => {
          const height = Math.max(8, (attempt.score / 100) * 100);
          const isCurrent = idx === attempts.slice(-12).length - 1;
          const isBest = attempt.score === personalBest;

          return (
            <motion.div
              key={attempt.id}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.4, delay: 0.4 + idx * 0.05 }}
              className="relative group flex-1 min-w-0"
            >
              <div
                className={`w-full h-full rounded-t-sm transition-colors ${
                  isCurrent
                    ? "bg-primary"
                    : isBest
                      ? "bg-primary/60"
                      : "bg-muted-foreground/20"
                }`}
              />
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                  isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  {attempt.score}
                </span>
              </div>
              {isCurrent && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <span className="text-[8px] font-bold text-primary uppercase">Now</span>
                </div>
              )}
              {isBest && !isCurrent && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <span className="text-[8px] font-bold text-primary/60 uppercase">Best</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2">
        <span>
          Personal Best: <span className="font-bold text-foreground">{personalBest}</span>
        </span>
        {currentScore < personalBest && (
          <span>
            Gap: <span className="font-bold text-destructive">-{personalBest - currentScore}</span> points
          </span>
        )}
        {currentScore >= personalBest && attempts.length > 1 && (
          <span className="font-bold text-primary flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> New Personal Best!
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function ReplayImprovementPanel({
  answerComparisons,
  exposureMoments,
  timestampedMoments,
  strengths,
  improvements,
  score,
  scenarioRole,
  scenarioTitle,
  onRetry,
}: ReplayImprovementPanelProps) {
  // Build improvement cards from available data
  const cards: { label: string; userResponse: string; issue: string; improvedResponse: string }[] = [];

  // From answer comparisons
  if (answerComparisons && answerComparisons.length > 0) {
    answerComparisons.forEach((comp) => {
      cards.push({
        label: comp.question,
        userResponse: comp.userAnswer,
        issue: comp.gap,
        improvedResponse: comp.idealAnswer,
      });
    });
  }

  // From exposure moments
  if (exposureMoments && exposureMoments.length > 0) {
    exposureMoments.forEach((moment) => {
      // Avoid duplicates if already covered by answer comparisons
      if (!cards.some((c) => c.userResponse === moment.weakAnswer)) {
        cards.push({
          label: "Weak Spot Detected",
          userResponse: moment.weakAnswer,
          issue: moment.reason,
          improvedResponse: moment.correction,
        });
      }
    });
  }

  // From timestamped moments with suggested responses
  if (timestampedMoments && timestampedMoments.length > 0) {
    timestampedMoments.forEach((moment) => {
      if (moment.suggestedResponse && !cards.some((c) => c.userResponse === moment.quote)) {
        cards.push({
          label: moment.label,
          userResponse: moment.quote,
          issue: moment.issue,
          improvedResponse: moment.suggestedResponse,
        });
      }
    });
  }

  // If no specific response data, build from strengths/improvements
  const hasResponseData = cards.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5"
    >
      <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Replay & Improve</h4>
          </div>
          {scenarioTitle && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
              {scenarioTitle}
            </span>
          )}
        </div>

        {/* Response-level improvements */}
        {hasResponseData && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Key Moments to Improve ({cards.length})
            </p>
            {cards.slice(0, 5).map((card, i) => (
              <ImprovementCard
                key={i}
                index={i}
                label={card.label}
                userResponse={card.userResponse}
                issue={card.issue}
                improvedResponse={card.improvedResponse}
              />
            ))}
          </div>
        )}

        {/* Fallback: strengths vs improvements summary */}
        {!hasResponseData && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> What Worked
                </p>
                {strengths.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-[11px] text-foreground leading-snug">✓ {s}</p>
                ))}
              </div>
              <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Focus Areas
                </p>
                {improvements.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground leading-snug">→ {s}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Attempt History Timeline */}
        <AttemptTimeline scenarioRole={scenarioRole} currentScore={score} />

        {/* Retry CTA */}
        <Button
          variant="hero"
          size="lg"
          className="w-full h-12 text-sm gap-2"
          onClick={onRetry}
        >
          <RotateCcw className="h-4 w-4" />
          Retry & Beat Your Score
        </Button>
      </div>
    </motion.div>
  );
}
