import { useCallback } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, Target, RotateCcw, Play, Quote, Gauge, Download, Compass, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Feedback, SkillScore } from "./types";
import { ShareableSummary } from "./ShareableSummary";

const INTERVIEW_RANKS = ["Interview Ready", "Strong Candidate", "Prepared", "Developing", "Not Ready"];

function isInterviewRank(rank: string) {
  return INTERVIEW_RANKS.includes(rank);
}

function getRankColor(rank: string) {
  switch (rank) {
    case "Rainmaker":
    case "Operator":
    case "Interview Ready":
    case "Strong Candidate":
      return "text-primary";
    case "Closer":
    case "Prepared":
      return "text-accent-foreground";
    case "Starter":
    case "Developing":
      return "text-muted-foreground";
    default:
      return "text-destructive";
  }
}

function getBarColor(score: number) {
  if (score >= 75) return "bg-primary";
  if (score >= 50) return "bg-primary/60";
  if (score >= 30) return "bg-muted-foreground";
  return "bg-destructive/60";
}

function getScoreBarColor(score: number) {
  if (score >= 81) return "bg-primary";
  if (score >= 61) return "bg-primary/80";
  if (score >= 41) return "bg-accent-foreground";
  if (score >= 21) return "bg-muted-foreground";
  return "bg-destructive";
}

// --- Skill Breakdown Bar ---

function SkillBar({ skill, delay }: { skill: SkillScore; delay: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{skill.name}</span>
        <span className="text-[11px] font-medium text-foreground tabular-nums">{skill.score}</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${skill.score}%` }}
          transition={{ duration: 0.5, ease: "easeOut", delay }}
          className={`h-full rounded-full ${getBarColor(skill.score)}`}
        />
      </div>
    </div>
  );
}

// --- PDF Download ---

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function downloadPDF(feedback: Feedback, alias: string | null) {
  try {
    const interview = isInterviewRank(feedback.rank);
    const date = formatDate();
    const name = alias || "Anonymous";

    // Build skill rows
    const skillRows = (feedback.skillBreakdown || [])
      .map((s) => {
        const bar = "█".repeat(Math.round(s.score / 5)) + "░".repeat(20 - Math.round(s.score / 5));
        return `  ${s.name.padEnd(24)} ${bar} ${s.score}`;
      })
      .join("\n");

    const text = [
      `PERFORMANCE REPORT`,
      `${"═".repeat(50)}`,
      ``,
      `Date: ${date}`,
      `Candidate: ${name}`,
      ``,
      `── A. Overall Performance ──────────────────────`,
      ``,
      `  ${interview ? "Interview Readiness" : "Performance"} Score:  ${feedback.score}/100`,
      `  Rank:               ${feedback.rank}`,
      `  Peak Difficulty:    Level ${feedback.peakDifficulty ?? 1}`,
      ``,
      `── B. Skill Breakdown ─────────────────────────`,
      ``,
      skillRows || "  (Not available for this session)",
      ``,
      `── C. Strength Summary ────────────────────────`,
      ``,
      ...feedback.strengths.map((s) => `  ✓ ${s}`),
      ``,
      `── D. ${interview ? "Development" : "Primary"} Focus ──────────────────────`,
      ``,
      ...feedback.improvements.map((s) => `  → ${s}`),
      ``,
      `── E. Strongest Moment ────────────────────────`,
      ``,
      `  "${feedback.bestMoment}"`,
      ``,
      `── F. Training Recommendation ─────────────────`,
      ``,
      `  ${feedback.trainingRecommendation || feedback.nextDrill}`,
      ``,
      `${"═".repeat(50)}`,
      `Generated via SalesCalls Practice Simulator`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.download = `performance-report-${feedback.score}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);

    toast("Report downloaded.", { duration: 2000 });
  } catch {
    toast.error("Failed to generate report.");
  }
}

// --- Main Component ---

export function FeedbackPanel({
  feedback,
  onStartNew,
  onTrySameRole,
  alias,
  isValidSession,
}: {
  feedback: Feedback;
  onStartNew: () => void;
  onTrySameRole: () => void;
  alias?: string | null;
  isValidSession?: boolean;
}) {
  const interview = isInterviewRank(feedback.rank);
  const skills = feedback.skillBreakdown || [];

  const handleDownload = useCallback(() => {
    downloadPDF(feedback, alias ?? null);
  }, [feedback, alias]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="card-elevated overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Performance Report
        </h3>
      </div>

      {/* A. Overall Performance */}
      <div className="flex flex-col items-center py-5 px-4 border-b border-border">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.05 }}
          className={`text-5xl font-bold font-heading ${getRankColor(feedback.rank)}`}
        >
          {feedback.score}
        </motion.span>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {interview ? "Interview Readiness Score" : "Performance Score"}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRankColor(feedback.rank)} border-current/20`}
          >
            {feedback.rank}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Gauge className="h-3 w-3" />
            Level {feedback.peakDifficulty ?? 1}
          </span>
        </div>
        <div className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden mt-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${feedback.score}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className={`h-full rounded-full ${getScoreBarColor(feedback.score)}`}
          />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* B. Skill Breakdown */}
        {skills.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Skill Breakdown
            </p>
            <div className="space-y-2.5">
              {skills.map((skill, i) => (
                <SkillBar key={skill.name} skill={skill} delay={0.2 + i * 0.08} />
              ))}
            </div>
          </div>
        )}

        {/* Strongest Moment */}
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

        {/* C. Strength Summary + D. Development Focus */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Star className="h-3 w-3 text-primary" />
              Strength Summary
            </div>
            {feedback.strengths.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug pl-3.5 relative before:content-['✓'] before:absolute before:left-0 before:text-primary before:text-[10px] before:font-bold">
                {s}
              </p>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              {interview ? "Development Focus" : "Primary Focus"}
            </div>
            {feedback.improvements.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug pl-3.5 relative before:content-['→'] before:absolute before:left-0 before:text-[10px]">
                {s}
              </p>
            ))}
          </div>
        </div>

        {/* E. Training Recommendation */}
        {(feedback.trainingRecommendation || feedback.nextDrill) && (
          <div className="flex items-start gap-2 rounded-md p-2.5 bg-muted/50">
            <Compass className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">Next Session: </span>
              {feedback.trainingRecommendation || feedback.nextDrill}
            </p>
          </div>
        )}

        {/* F. Resume Alignment — interview only, when resume was provided */}
        {interview && feedback.resumeAlignment && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-3 w-3 text-muted-foreground" />
              Resume Alignment
            </div>
            <div className="bg-muted/40 rounded-lg p-3 border border-border space-y-2">
              <div className="flex items-center gap-2 text-[11px]">
                {feedback.resumeAlignment.claimsMatched ? (
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                )}
                <span className="text-muted-foreground">
                  Claims {feedback.resumeAlignment.claimsMatched ? "substantiated" : "not substantiated"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {feedback.resumeAlignment.metricsDefended ? (
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                )}
                <span className="text-muted-foreground">
                  Metrics {feedback.resumeAlignment.metricsDefended ? "defended with context" : "not defended"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pt-1 border-t border-border">
                {feedback.resumeAlignment.consistencyNote}
              </p>
            </div>
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

        {/* Download Report */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs text-muted-foreground"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3 mr-1.5" />
          Download Full Report
        </Button>

        {/* Shareable summary — interview only */}
        {interview && (
          <ShareableSummary
            feedback={feedback}
            alias={alias ?? null}
            isValidSession={!!isValidSession}
          />
        )}
      </div>
    </motion.div>
  );
}
