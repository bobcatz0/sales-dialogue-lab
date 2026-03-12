import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, TrendingDown, Target, RotateCcw, Play, Quote, Gauge, Download, Compass, FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Mic, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Feedback, SkillScore, ExposureMoment, CriticalWeakness, FinalRoundMetrics } from "./types";
import { ShareableSummary } from "./ShareableSummary";
import { ScorecardShare } from "./ScorecardShare";
import { ChallengeButton } from "./ChallengeButton";
import { HumanReviewedBadge } from "./EvaluatorBadges";
import { AnimatedScore } from "./AnimatedScore";
import type { VoiceMetrics } from "./voiceInterviewDesign";
import { updateProgress } from "./skillProgress";
import { RubricScoresSection, AnswerComparisonSection } from "./FrameworkFeedback";
import { ConversationBreakdown } from "./ConversationBreakdown";
import { useAuth } from "@/hooks/useAuth";

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
      `Evaluation based on structured SDR interview standards.`,
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
  onStartDrill,
  alias,
  isValidSession,
  isFinalRound,
  voiceMetrics,
  voiceFeedbackLines,
  voiceScoreAdjustment,
  scenarioTitle,
  scenarioEnv,
  scenarioRole,
  eloDelta,
}: {
  feedback: Feedback;
  onStartNew: () => void;
  onTrySameRole: () => void;
  onStartDrill?: () => void;
  alias?: string | null;
  isValidSession?: boolean;
  isFinalRound?: boolean;
  voiceMetrics?: VoiceMetrics;
  voiceFeedbackLines?: string[];
  voiceScoreAdjustment?: number;
  scenarioTitle?: string;
  scenarioEnv?: string;
  scenarioRole?: string;
  eloDelta?: number | null;
}) {
  const interview = isInterviewRank(feedback.rank);
  const skills = feedback.skillBreakdown || [];
  const frm = feedback.finalRoundMetrics;
  const [progressUpdated, setProgressUpdated] = useState(false);
  const { profile } = useAuth();

  // Update skill progress on mount
  useEffect(() => {
    if (!progressUpdated) {
      updateProgress(skills, feedback.score);
      setProgressUpdated(true);
      toast("Progress updated.", {
        duration: 2000,
        icon: <BarChart3 className="h-4 w-4 text-primary" />,
        action: {
          label: "View Progress",
          onClick: () => { window.location.href = "/progress"; },
        },
      });
    }
  }, [feedback, skills, progressUpdated]);

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
          {isFinalRound ? "Final Round Evaluation" : "Performance Report"}
        </h3>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
          Evaluation based on structured SDR interview standards.
        </p>
      </div>

      {/* A. Overall Performance */}
      <div className="flex flex-col items-center py-5 px-4 border-b border-border">
        <AnimatedScore
          target={feedback.score}
          delay={0.2}
          className={`text-5xl font-bold font-heading ${getRankColor(feedback.rank)}`}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-[10px] text-muted-foreground mt-0.5"
        >
          {interview ? "Interview Readiness Score" : "Performance Score"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center gap-2 mt-1.5 flex-wrap justify-center"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.9, type: "spring", stiffness: 400, damping: 18 }}
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRankColor(feedback.rank)} border-current/20`}
          >
            {feedback.rank}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.1 }}
            className="text-[10px] text-muted-foreground flex items-center gap-0.5"
          >
            <Gauge className="h-3 w-3" />
            Level {feedback.peakDifficulty ?? 1}
          </motion.span>
          {eloDelta != null && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 3.3, type: "spring", stiffness: 300 }}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                eloDelta >= 0
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {eloDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {eloDelta >= 0 ? "+" : ""}{eloDelta} ELO
            </motion.span>
          )}
          {feedback.humanReviewScore != null && (
            <HumanReviewedBadge evaluatorScore={feedback.humanReviewScore} />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.0 }}
          className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden mt-3"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${feedback.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 3.0 }}
            className={`h-full rounded-full ${getScoreBarColor(feedback.score)}`}
          />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Critical Weakness — top of report when recovery failed */}
        {interview && feedback.criticalWeakness && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg p-4 bg-destructive/8 border border-destructive/25 space-y-3"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
              <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">
                Critical Weakness Identified
              </p>
            </div>
            <p className="text-[11px] text-foreground italic leading-snug">
              "{feedback.criticalWeakness.weakResponse}"
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {feedback.criticalWeakness.credibilityImpact}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {feedback.criticalWeakness.recoveryFailure}
            </p>
            <div className="pt-2 border-t border-destructive/15">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Corrective Approach
              </p>
              <p className="text-[11px] text-foreground font-medium leading-snug">
                "{feedback.criticalWeakness.correctiveExample}"
              </p>
            </div>
          </motion.div>
        )}

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

        {/* Framework Rubric Scores */}
        <RubricScoresSection scores={feedback.rubricScores || []} frameworkId={feedback.frameworkId} />

        {/* Conversation Breakdown Timeline */}
        <ConversationBreakdown moments={feedback.timestampedMoments || []} />

        {/* Answer vs Ideal Comparison */}
        <AnswerComparisonSection comparisons={feedback.answerComparisons || []} />

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

        {/* Pacing Note */}
        {interview && feedback.pacingNote && (
          <div className="flex items-start gap-2 rounded-md p-2.5 bg-muted/30 border border-border">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              {feedback.pacingNote}
            </p>
          </div>
        )}

        {/* Voice Metrics — voice mode only */}
        {voiceMetrics && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Mic className="h-3 w-3 text-primary" />
              Voice Analysis
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/40 border border-border">
                <p className="text-lg font-bold font-heading text-foreground">
                  {voiceMetrics.fillerFrequency}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">Fillers/min</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/40 border border-border">
                <p className="text-lg font-bold font-heading text-foreground">
                  {voiceMetrics.verbalPace}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">Words/min</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/40 border border-border">
                <p className="text-lg font-bold font-heading text-foreground">
                  {voiceMetrics.responseDuration}s
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">Total Duration</p>
              </div>
            </div>
            {voiceFeedbackLines && voiceFeedbackLines.length > 0 && (
              <div className="space-y-1">
                {voiceFeedbackLines.map((line, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground leading-snug pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:text-[10px]">
                    {line}
                  </p>
                ))}
              </div>
            )}
            {voiceScoreAdjustment !== undefined && voiceScoreAdjustment !== 0 && (
              <p className="text-[10px] text-muted-foreground text-center">
                Voice adjustment: <span className={`font-bold ${voiceScoreAdjustment > 0 ? "text-primary" : "text-destructive"}`}>
                  {voiceScoreAdjustment > 0 ? "+" : ""}{voiceScoreAdjustment}
                </span> points
              </p>
            )}
          </div>
        )}

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

        {/* G. Evaluator Style — interview only */}
        {interview && feedback.evaluatorStyle && (
          <div className="rounded-md p-2.5 bg-muted/30 border border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Evaluation Style
            </p>
            <p className="text-[11px] text-foreground font-medium capitalize">
              {feedback.evaluatorStyle.replace("-", " ")}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
              {feedback.evaluatorStyle === "analytical" && "This session emphasized metrics, data specificity, and structured reasoning."}
              {feedback.evaluatorStyle === "results-oriented" && "This session emphasized outcomes, impact, and concise delivery."}
              {feedback.evaluatorStyle === "behavioral" && "This session emphasized ownership, accountability, and learning from experience."}
            </p>
          </div>
        )}

        {/* Exposure Moment — interview only */}
        {interview && feedback.exposureMoments && feedback.exposureMoments.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              Exposure Moment
            </div>
            {feedback.exposureMoments.map((moment, i) => (
              <div key={i} className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 space-y-2">
                <p className="text-[11px] text-foreground italic leading-snug">
                  "{moment.weakAnswer}"
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {moment.reason}
                </p>
                <p className="text-[11px] text-foreground font-medium leading-snug">
                  → {moment.correction}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Recovery Assessment — interview only */}
        {interview && feedback.recoveryAssessment && (
          <div className={`rounded-lg p-3 border ${feedback.recoveryAssessment.recovered ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border"}`}>
            <p className={`text-[11px] font-medium leading-snug ${feedback.recoveryAssessment.recovered ? "text-primary" : "text-muted-foreground"}`}>
              {feedback.recoveryAssessment.note}
            </p>
          </div>
        )}

        {/* Confidence Reflection — interview only */}
        {interview && (
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-[11px] text-foreground leading-relaxed text-center">
              Would you feel confident answering these questions in a live interview?
            </p>
          </div>
        )}

        {/* Final Round Metrics */}
        {isFinalRound && frm && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Final Round Assessment
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Pressure Resilience", value: frm.pressureResilience },
                { label: "Recovery Strength", value: frm.recoveryStrength },
                { label: "Composure", value: frm.composure },
              ].map((metric) => (
                <div key={metric.label} className="text-center p-2 rounded-lg bg-muted/40 border border-border">
                  <p className={`text-lg font-bold font-heading ${getScoreBarColor(metric.value).replace("bg-", "text-")}`}>
                    {metric.value}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{metric.label}</p>
                </div>
              ))}
            </div>
            {frm.performanceDeclined && (
              <div className="rounded-lg p-2.5 bg-destructive/8 border border-destructive/20">
                <p className="text-[11px] font-medium text-destructive">
                  Performance declined under elevated pressure.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Interview Ready Status — Final Round qualified */}
        {isFinalRound && feedback.score >= 85 && !feedback.criticalWeakness && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.3 }}
            className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col items-center text-center space-y-2">
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
              >
                <ShieldCheck className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="text-sm font-bold text-primary tracking-wide uppercase">
                Interview Ready
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[240px]">
                Performance met structured evaluation standards under elevated pressure. Score: {feedback.score}/100.
              </p>
              <p className="text-[9px] text-muted-foreground/50 mt-1">
                Valid for 30 days · Simulator evaluation only
              </p>
            </div>
          </motion.div>
        )}

        {/* Final Round Readiness — standard interview only */}
        {!isFinalRound && interview && feedback.score >= 85 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              Final Round Simulation Unlocked
            </span>
          </div>
        )}

        {/* Actions */}
        {interview && feedback.score < 80 && onStartDrill ? (
          <div className="space-y-2 pt-1">
            <div className="rounded-lg p-3 bg-muted/50 border border-border">
              <p className="text-[11px] font-medium text-foreground text-center">
                Focused Improvement Recommended Before Reattempt.
              </p>
            </div>
            <Button variant="default" size="sm" className="w-full h-9" onClick={onStartDrill}>
              <Target className="h-3.5 w-3.5 mr-1.5" />
              Start Targeted Drill
            </Button>
            <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground" onClick={onStartNew}>
              Skip to New Rehearsal
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <Button variant="default" size="sm" className="flex-1 h-9" onClick={onStartNew}>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              New Rehearsal
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-9" onClick={onTrySameRole}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        )}

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

        {/* Scorecard — always shown for valid sessions */}
        <ScorecardShare
          feedback={feedback}
          scenarioTitle={scenarioTitle || feedback.rank}
          alias={alias ?? null}
          isValidSession={!!isValidSession}
          elo={profile?.elo ?? null}
          eloDelta={eloDelta}
        />

        {/* Challenge a friend */}
        {isValidSession && scenarioEnv && scenarioRole && (
          <ChallengeButton
            score={feedback.score}
            scenarioEnv={scenarioEnv}
            scenarioRole={scenarioRole}
            isLoggedIn={!!profile}
          />
        )}

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
