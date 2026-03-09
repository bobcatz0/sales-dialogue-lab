import { motion } from "framer-motion";
import { ClipboardList, GitCompare, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { RubricScore, AnswerComparison, TimestampedMoment, FrameworkId } from "./types";

const FRAMEWORK_LABELS: Record<string, string> = {
  star: "STAR Method",
  bant: "BANT Framework",
  meddic: "MEDDIC Framework",
  spin: "SPIN Selling",
};

function getRubricBarColor(score: number) {
  if (score >= 75) return "bg-primary";
  if (score >= 50) return "bg-primary/60";
  if (score >= 30) return "bg-muted-foreground";
  return "bg-destructive/60";
}

function getMomentIcon(label: string) {
  if (label === "strong") return <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />;
  if (label === "weak") return <XCircle className="h-3 w-3 text-destructive shrink-0" />;
  return <AlertTriangle className="h-3 w-3 text-accent-foreground shrink-0" />;
}

function getMomentBorder(label: string) {
  if (label === "strong") return "border-primary/20 bg-primary/5";
  if (label === "weak") return "border-destructive/20 bg-destructive/5";
  return "border-accent-foreground/20 bg-accent-foreground/5";
}

export function RubricScoresSection({ scores, frameworkId }: { scores: RubricScore[]; frameworkId?: FrameworkId }) {
  if (!scores || scores.length === 0) return null;
  const label = frameworkId && frameworkId !== "none" ? FRAMEWORK_LABELS[frameworkId] : "Rubric";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <ClipboardList className="h-3 w-3 text-primary" />
        {label} Rubric
      </div>
      <div className="space-y-2">
        {scores.map((item, i) => (
          <motion.div
            key={item.criterion}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {item.criterion}
                <span className="text-[9px] text-muted-foreground/50 ml-1">({item.weight})</span>
              </span>
              <span className="text-[11px] font-medium text-foreground tabular-nums">{item.score}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 + i * 0.06 }}
                className={`h-full rounded-full ${getRubricBarColor(item.score)}`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/70 leading-snug">{item.note}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function AnswerComparisonSection({ comparisons }: { comparisons: AnswerComparison[] }) {
  if (!comparisons || comparisons.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <GitCompare className="h-3 w-3 text-primary" />
        Your Answer vs Ideal Answer
      </div>
      <div className="space-y-3">
        {comparisons.map((comp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
          >
            <p className="text-[11px] font-medium text-foreground leading-snug">
              Q: {comp.question}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-destructive/5 border border-destructive/15 p-2">
                <p className="text-[9px] font-semibold text-destructive uppercase tracking-wider mb-1">Your Answer</p>
                <p className="text-[10px] text-muted-foreground leading-snug italic">"{comp.userAnswer}"</p>
              </div>
              <div className="rounded-md bg-primary/5 border border-primary/15 p-2">
                <p className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-1">Ideal Answer</p>
                <p className="text-[10px] text-muted-foreground leading-snug italic">"{comp.idealAnswer}"</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              <span className="font-medium text-foreground">Gap:</span> {comp.gap}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TimestampedMomentsSection({ moments }: { moments: TimestampedMoment[] }) {
  if (!moments || moments.length === 0) return null;

  const sorted = [...moments].sort((a, b) => a.exchangeIndex - b.exchangeIndex);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <Clock className="h-3 w-3 text-primary" />
        Transcript Highlights
      </div>
      <div className="space-y-2">
        {sorted.map((moment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`rounded-lg border p-2.5 ${getMomentBorder(moment.label)}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {getMomentIcon(moment.label)}
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Exchange {moment.exchangeIndex}
              </span>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${
                moment.label === "strong" ? "border-primary/20 text-primary bg-primary/10" :
                moment.label === "weak" ? "border-destructive/20 text-destructive bg-destructive/10" :
                "border-accent-foreground/20 text-accent-foreground bg-accent-foreground/10"
              }`}>
                {moment.label === "missed-opportunity" ? "Missed" : moment.label}
              </span>
            </div>
            <p className="text-[11px] text-foreground italic leading-snug mb-1">"{moment.quote}"</p>
            <p className="text-[10px] text-muted-foreground leading-snug">{moment.issue}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
