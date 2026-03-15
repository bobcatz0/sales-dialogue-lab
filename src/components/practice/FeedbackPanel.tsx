import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Star, TrendingUp, TrendingDown, Target, RotateCcw, Play, Quote, Gauge,
  Download, Compass, FileText, CheckCircle2, XCircle, AlertTriangle,
  ShieldCheck, Mic, BarChart3, Trophy, ArrowUp, Lightbulb, Flame, Snowflake,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Feedback, SkillScore, ExposureMoment, CriticalWeakness, FinalRoundMetrics } from "./types";
import { ShareableSummary } from "./ShareableSummary";
import { ScorecardShare } from "./ScorecardShare";
import { ChallengeButton } from "./ChallengeButton";
import { ShareResultCard } from "./ShareResultCard";
import { HumanReviewedBadge } from "./EvaluatorBadges";
import { AnimatedScore } from "./AnimatedScore";
import { RetryLoopPanel } from "./RetryLoopPanel";
import { ReplayImprovementPanel } from "./ReplayImprovementPanel";
import type { VoiceMetrics } from "./voiceInterviewDesign";
import { VoiceResultsPanel } from "./VoiceResultsPanel";
import { updateProgress } from "./skillProgress";
import { RubricScoresSection, AnswerComparisonSection } from "./FrameworkFeedback";
import { SkillXpSummary } from "./SkillXpSummary";
import { StreakReward } from "./StreakReward";
import { ConversationBreakdown } from "./ConversationBreakdown";
import { useAuth } from "@/hooks/useAuth";
import { loadHistory } from "./sessionStorage";

const INTERVIEW_RANKS = ["Interview Ready", "Strong Candidate", "Prepared", "Developing", "Not Ready"];

function isInterviewRank(rank: string) {
  return INTERVIEW_RANKS.includes(rank);
}

function getRankColor(rank: string) {
  switch (rank) {
    case "Rainmaker": case "Operator": case "Interview Ready": case "Strong Candidate":
      return "text-primary";
    case "Closer": case "Prepared":
      return "text-accent-foreground";
    case "Starter": case "Developing":
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

// --- Coaching tips based on skill name ---
const COACHING_TIPS: Record<string, string> = {
  "Communication": "Practice structuring responses with a clear opening, body, and closing. Use the PREP framework: Point, Reason, Example, Point.",
  "Clarity": "Eliminate filler words and vague language. State your key point first, then support it with specifics.",
  "Confidence": "Use declarative statements instead of hedging. Replace 'I think' with 'In my experience' and practice power pauses.",
  "Objection Handling": "Acknowledge the objection, ask a clarifying question, then reframe with value. Never dismiss concerns.",
  "Discovery Questions": "Ask open-ended questions that uncover pain points. Follow up with 'Tell me more about that' to go deeper.",
  "Metrics": "Always quantify your impact. Use the formula: Action + Metric + Timeframe for compelling results.",
  "Ownership": "Use 'I' statements to describe your specific contributions. Avoid hiding behind 'we' when describing your wins.",
  "Structure": "Open with a brief agenda, follow a logical progression, and close with a summary of key points discussed.",
  "Rapport Building": "Mirror the prospect's energy and pace. Reference specific details they've shared to show active listening.",
  "Closing": "Summarize value delivered, confirm alignment on next steps, and propose a specific action with a timeline.",
  "Cold Call Opening": "Lead with a hook or pattern interrupt. State your value proposition within 10 seconds. Don't ask 'How are you?'",
  "Conciseness": "Keep responses to 30-45 seconds. Lead with the answer, then support. Cut filler phrases ruthlessly.",
};

function getCoachingTip(skillName: string): string {
  return COACHING_TIPS[skillName] || `Focus on deliberate practice for ${skillName}. Record yourself and review for specific patterns to improve.`;
}

// --- Skill Bar ---
function SkillBar({ skill, delay }: { skill: SkillScore; delay: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground font-medium">{skill.name}</span>
        <span className={`text-xs font-bold tabular-nums ${
          skill.score >= 75 ? "text-primary" : skill.score >= 50 ? "text-foreground" : "text-destructive"
        }`}>
          {skill.score}/100
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${skill.score}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay }}
          className={`h-full rounded-full ${getBarColor(skill.score)}`}
        />
      </div>
    </div>
  );
}

// --- Strongest / Weakest Skill Highlight ---
function SkillHighlight({ skill, type }: { skill: SkillScore; type: "strongest" | "weakest" }) {
  const isStrongest = type === "strongest";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={`rounded-xl p-4 border ${
        isStrongest
          ? "bg-primary/5 border-primary/20"
          : "bg-destructive/5 border-destructive/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {isStrongest ? (
          <Flame className="h-4 w-4 text-primary" />
        ) : (
          <Snowflake className="h-4 w-4 text-destructive" />
        )}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          isStrongest ? "text-primary" : "text-destructive"
        }`}>
          {isStrongest ? "Strongest Skill" : "Weakest Skill"}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{skill.name}</p>
      <p className={`text-lg font-heading font-bold tabular-nums ${
        isStrongest ? "text-primary" : "text-destructive"
      }`}>
        {skill.score}/100
      </p>
      {!isStrongest && (
        <div className="mt-3 pt-3 border-t border-destructive/15">
          <div className="flex items-start gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-accent-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {getCoachingTip(skill.name)}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- Personal Best Comparison ---
function PersonalBestComparison({ currentScore, scenarioRole }: { currentScore: number; scenarioRole?: string }) {
  const history = loadHistory();
  const relevantSessions = scenarioRole
    ? history.filter((s) => s.roleId === scenarioRole)
    : history;

  if (relevantSessions.length <= 1) return null;

  const previousBest = Math.max(...relevantSessions.slice(1).map((s) => s.score));
  const isNewBest = currentScore > previousBest;
  const diff = currentScore - previousBest;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className={`rounded-xl p-4 border ${
        isNewBest ? "bg-primary/5 border-primary/25" : "bg-muted/40 border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className={`h-4 w-4 ${isNewBest ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-xs font-semibold text-foreground">
            {isNewBest ? "New Personal Best!" : "Personal Best Comparison"}
          </span>
        </div>
        {isNewBest && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <ArrowUp className="h-2.5 w-2.5" />
            +{diff}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-4">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Previous Best</p>
          <p className="text-xl font-bold font-heading text-muted-foreground">{previousBest}</p>
        </div>
        <div className="text-center flex-1 flex justify-center">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            diff > 0 ? "text-primary bg-primary/10" : diff < 0 ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"
          }`}>
            {diff > 0 ? `+${diff}` : diff === 0 ? "Tied" : `${diff}`}
          </span>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">This Session</p>
          <p className={`text-xl font-bold font-heading ${isNewBest ? "text-primary" : "text-foreground"}`}>{currentScore}</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- Percentile Ranking ---
function PercentileRanking({ score }: { score: number }) {
  const [percentile, setPercentile] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    async function calc() {
      const [{ count: below }, { count: total }] = await Promise.all([
        supabase.from("scorecards").select("id", { count: "exact", head: true }).lt("score", score),
        supabase.from("scorecards").select("id", { count: "exact", head: true }),
      ]);
      if (total && total > 0) {
        const pct = Math.round(((below ?? 0) / total) * 100);
        setPercentile(pct);
        setTotalPlayers(total);
      }
    }
    calc();
  }, [score]);

  if (percentile === null) return null;

  const topPct = 100 - percentile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 3.4 }}
      className="flex items-center justify-center gap-2 mt-2"
    >
      <Users className="h-3.5 w-3.5 text-muted-foreground" />
      <span className={`text-sm font-bold ${
        topPct <= 5 ? "text-primary" : topPct <= 15 ? "text-accent-foreground" : "text-foreground"
      }`}>
        Top {topPct}%
      </span>
      <span className="text-[10px] text-muted-foreground">
        of {totalPlayers.toLocaleString()} players
      </span>
    </motion.div>
  );
}


function formatDate() {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function downloadPDF(feedback: Feedback, alias: string | null) {
  try {
    const interview = isInterviewRank(feedback.rank);
    const date = formatDate();
    const name = alias || "Anonymous";
    const skillRows = (feedback.skillBreakdown || [])
      .map((s) => {
        const bar = "█".repeat(Math.round(s.score / 5)) + "░".repeat(20 - Math.round(s.score / 5));
        return `  ${s.name.padEnd(24)} ${bar} ${s.score}`;
      })
      .join("\n");

    const text = [
      `PERFORMANCE REPORT`, `${"═".repeat(50)}`, ``,
      `Date: ${date}`, `Candidate: ${name}`, ``,
      `── A. Overall Performance ──────────────────────`, ``,
      `  ${interview ? "Interview Readiness" : "Performance"} Score:  ${feedback.score}/100`,
      `  Rank:               ${feedback.rank}`,
      `  Peak Difficulty:    Level ${feedback.peakDifficulty ?? 1}`, ``,
      `── B. Skill Breakdown ─────────────────────────`, ``,
      skillRows || "  (Not available for this session)", ``,
      `── C. Strength Summary ────────────────────────`, ``,
      ...feedback.strengths.map((s) => `  ✓ ${s}`), ``,
      `── D. ${interview ? "Development" : "Primary"} Focus ──────────────────────`, ``,
      ...feedback.improvements.map((s) => `  → ${s}`), ``,
      `── E. Strongest Moment ────────────────────────`, ``,
      `  "${feedback.bestMoment}"`, ``,
      `── F. Training Recommendation ─────────────────`, ``,
      `  ${feedback.trainingRecommendation || feedback.nextDrill}`, ``,
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
  feedback, onStartNew, onTrySameRole, onStartDrill, alias, isValidSession,
  isFinalRound, voiceMetrics, voiceFeedbackLines, voiceScoreAdjustment,
  scenarioTitle, scenarioEnv, scenarioRole, eloDelta,
  currentStreak, longestStreak, streakJustIncreased,
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
  currentStreak?: number;
  longestStreak?: number;
  streakJustIncreased?: boolean;
}) {
  const interview = isInterviewRank(feedback.rank);
  const skills = feedback.skillBreakdown || [];
  const frm = feedback.finalRoundMetrics;
  const [progressUpdated, setProgressUpdated] = useState(false);
  const { profile, user } = useAuth();
  const [skillRefreshKey, setSkillRefreshKey] = useState(0);

  const strongest = skills.length > 0 ? skills.reduce((a, b) => (a.score >= b.score ? a : b)) : null;
  const weakest = skills.length > 0 ? skills.reduce((a, b) => (a.score <= b.score ? a : b)) : null;

  useEffect(() => {
    if (!progressUpdated) {
      updateProgress(skills, feedback.score);
      setProgressUpdated(true);
      toast("Progress updated.", {
        duration: 2000,
        icon: <BarChart3 className="h-4 w-4 text-primary" />,
        action: { label: "View Progress", onClick: () => { window.location.href = "/progress"; } },
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
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {isFinalRound ? "Final Round Evaluation" : "Performance Evaluation"}
        </h3>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
          Structured assessment based on professional sales standards
        </p>
      </div>

      {/* ═══════════════ TOP SECTION: Score / Rank / ELO ═══════════════ */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-border bg-gradient-to-b from-background to-muted/10">
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

        {/* Rank + Level + ELO badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center gap-2 mt-2 flex-wrap justify-center"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.9, type: "spring", stiffness: 400, damping: 18 }}
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getRankColor(feedback.rank)} border-current/20`}
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
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                eloDelta >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
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

        {/* Score bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.0 }}
          className="w-full max-w-[220px] h-1.5 bg-muted rounded-full overflow-hidden mt-3"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${feedback.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 3.0 }}
            className={`h-full rounded-full ${getScoreBarColor(feedback.score)}`}
          />
        </motion.div>

        {/* Percentile ranking */}
        <PercentileRanking score={feedback.score} />
      </div>

      <div className="p-5 space-y-5">
        {/* ═══════════════ CRITICAL WEAKNESS (if any) ═══════════════ */}
        {interview && feedback.criticalWeakness && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-4 bg-destructive/8 border border-destructive/25 space-y-3"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
              <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">
                Critical Weakness Identified
              </p>
            </div>
            <p className="text-[11px] text-foreground italic leading-snug">"{feedback.criticalWeakness.weakResponse}"</p>
            <p className="text-[11px] text-muted-foreground leading-snug">{feedback.criticalWeakness.credibilityImpact}</p>
            <p className="text-[11px] text-muted-foreground leading-snug">{feedback.criticalWeakness.recoveryFailure}</p>
            <div className="pt-2 border-t border-destructive/15">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Corrective Approach</p>
              <p className="text-[11px] text-foreground font-medium leading-snug">"{feedback.criticalWeakness.correctiveExample}"</p>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ MIDDLE SECTION: Skill Breakdown ═══════════════ */}
        {skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Skill Breakdown</h4>
            </div>
            <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
              {skills.map((skill, i) => (
                <SkillBar key={skill.name} skill={skill} delay={0.3 + i * 0.1} />
              ))}
            </div>

            {/* Strongest & Weakest highlights */}
            {strongest && weakest && strongest.name !== weakest.name && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SkillHighlight skill={strongest} type="strongest" />
                <SkillHighlight skill={weakest} type="weakest" />
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════ STREAK REWARD ═══════════════ */}
        {(currentStreak ?? 0) > 0 && (
          <StreakReward
            currentStreak={currentStreak ?? 0}
            longestStreak={longestStreak ?? 0}
            justIncreased={streakJustIncreased}
          />
        )}

        {/* ═══════════════ SKILL XP SUMMARY ═══════════════ */}
        {user && skills.length > 0 && (
          <SkillXpSummary
            userId={user.id}
            skillBreakdown={skills}
            onXpAwarded={() => setSkillRefreshKey((k) => k + 1)}
            currentStreak={currentStreak}
          />
        )}

        {/* Framework Rubric Scores */}
        <RubricScoresSection scores={feedback.rubricScores || []} frameworkId={feedback.frameworkId} />

        {/* Conversation Breakdown Timeline */}
        <ConversationBreakdown moments={feedback.timestampedMoments || []} />

        {/* Answer vs Ideal Comparison */}
        <AnswerComparisonSection comparisons={feedback.answerComparisons || []} />

        {/* Strongest Moment */}
        {feedback.bestMoment && (
          <div className="bg-muted/40 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground mb-1.5">
              <Quote className="h-3 w-3 text-muted-foreground" />
              Strongest Moment
            </div>
            <p className="text-sm text-foreground italic leading-relaxed">"{feedback.bestMoment}"</p>
          </div>
        )}

        {/* Strength Summary + Development Focus */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Star className="h-3 w-3 text-primary" />
              Strength Summary
            </div>
            {feedback.strengths.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug pl-3.5 relative before:content-['✓'] before:absolute before:left-0 before:text-primary before:text-[10px] before:font-bold">{s}</p>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              {interview ? "Development Focus" : "Primary Focus"}
            </div>
            {feedback.improvements.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug pl-3.5 relative before:content-['→'] before:absolute before:left-0 before:text-[10px]">{s}</p>
            ))}
          </div>
        </div>

        {/* Training Recommendation */}
        {(feedback.trainingRecommendation || feedback.nextDrill) && (
          <div className="flex items-start gap-2 rounded-lg p-3 bg-muted/50">
            <Compass className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">Next Session: </span>
              {feedback.trainingRecommendation || feedback.nextDrill}
            </p>
          </div>
        )}

        {/* Pacing Note */}
        {interview && feedback.pacingNote && (
          <div className="flex items-start gap-2 rounded-lg p-3 bg-muted/30 border border-border">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">{feedback.pacingNote}</p>
          </div>
        )}

        {/* Voice Performance Review */}
        {voiceMetrics && (
          <VoiceResultsPanel
            voiceMetrics={voiceMetrics}
            baseScore={feedback.score}
            voiceScoreAdjustment={voiceScoreAdjustment}
          />
        )}

        {/* Resume Alignment — interview only */}
        {interview && feedback.resumeAlignment && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-3 w-3 text-muted-foreground" />
              Resume Alignment
            </div>
            <div className="bg-muted/40 rounded-lg p-3 border border-border space-y-2">
              <div className="flex items-center gap-2 text-[11px]">
                {feedback.resumeAlignment.claimsMatched ? <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                <span className="text-muted-foreground">Claims {feedback.resumeAlignment.claimsMatched ? "substantiated" : "not substantiated"}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {feedback.resumeAlignment.metricsDefended ? <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                <span className="text-muted-foreground">Metrics {feedback.resumeAlignment.metricsDefended ? "defended with context" : "not defended"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pt-1 border-t border-border">{feedback.resumeAlignment.consistencyNote}</p>
            </div>
          </div>
        )}

        {/* Evaluator Style */}
        {interview && feedback.evaluatorStyle && (
          <div className="rounded-lg p-3 bg-muted/30 border border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Evaluation Style</p>
            <p className="text-[11px] text-foreground font-medium capitalize">{feedback.evaluatorStyle.replace("-", " ")}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
              {feedback.evaluatorStyle === "analytical" && "This session emphasized metrics, data specificity, and structured reasoning."}
              {feedback.evaluatorStyle === "results-oriented" && "This session emphasized outcomes, impact, and concise delivery."}
              {feedback.evaluatorStyle === "behavioral" && "This session emphasized ownership, accountability, and learning from experience."}
            </p>
          </div>
        )}

        {/* Exposure Moments */}
        {interview && feedback.exposureMoments && feedback.exposureMoments.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              Exposure Moment
            </div>
            {feedback.exposureMoments.map((moment, i) => (
              <div key={i} className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 space-y-2">
                <p className="text-[11px] text-foreground italic leading-snug">"{moment.weakAnswer}"</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{moment.reason}</p>
                <p className="text-[11px] text-foreground font-medium leading-snug">→ {moment.correction}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recovery Assessment */}
        {interview && feedback.recoveryAssessment && (
          <div className={`rounded-lg p-3 border ${feedback.recoveryAssessment.recovered ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border"}`}>
            <p className={`text-[11px] font-medium leading-snug ${feedback.recoveryAssessment.recovered ? "text-primary" : "text-muted-foreground"}`}>
              {feedback.recoveryAssessment.note}
            </p>
          </div>
        )}

        {/* Final Round Metrics */}
        {isFinalRound && frm && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Final Round Assessment</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Pressure Resilience", value: frm.pressureResilience },
                { label: "Recovery Strength", value: frm.recoveryStrength },
                { label: "Composure", value: frm.composure },
              ].map((metric) => (
                <div key={metric.label} className="text-center p-2 rounded-lg bg-muted/40 border border-border">
                  <p className={`text-lg font-bold font-heading ${getScoreBarColor(metric.value).replace("bg-", "text-")}`}>{metric.value}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{metric.label}</p>
                </div>
              ))}
            </div>
            {frm.performanceDeclined && (
              <div className="rounded-lg p-2.5 bg-destructive/8 border border-destructive/20">
                <p className="text-[11px] font-medium text-destructive">Performance declined under elevated pressure.</p>
              </div>
            )}
          </div>
        )}

        {/* Interview Ready Badge */}
        {isFinalRound && feedback.score >= 85 && !feedback.criticalWeakness && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.3 }}
            className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col items-center text-center space-y-2">
              <motion.div initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}>
                <ShieldCheck className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="text-sm font-bold text-primary tracking-wide uppercase">Interview Ready</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[240px]">Performance met structured evaluation standards under elevated pressure. Score: {feedback.score}/100.</p>
              <p className="text-[9px] text-muted-foreground/50 mt-1">Valid for 30 days · Simulator evaluation only</p>
            </div>
          </motion.div>
        )}

        {!isFinalRound && interview && feedback.score >= 85 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">Final Round Simulation Unlocked</span>
          </div>
        )}

        {/* Confidence Reflection */}
        {interview && (
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-[11px] text-foreground leading-relaxed text-center">Would you feel confident answering these questions in a live interview?</p>
          </div>
        )}

        {/* ═══════════════ REPLAY & IMPROVEMENT ═══════════════ */}
        <ReplayImprovementPanel
          answerComparisons={feedback.answerComparisons}
          exposureMoments={feedback.exposureMoments}
          timestampedMoments={feedback.timestampedMoments}
          strengths={feedback.strengths}
          improvements={feedback.improvements}
          score={feedback.score}
          scenarioRole={scenarioRole}
          scenarioTitle={scenarioTitle}
          onRetry={onTrySameRole}
        />

        {/* ═══════════════ BOTTOM SECTION: Retry Loop ═══════════════ */}
        <RetryLoopPanel
          currentScore={feedback.score}
          scenarioRole={scenarioRole}
          scenarioEnv={scenarioEnv}
          scenarioTitle={scenarioTitle}
          onRetry={onTrySameRole}
          onNewScenario={onStartNew}
        />

        {/* Download */}
        <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground" onClick={handleDownload}>
          <Download className="h-3 w-3 mr-1.5" />
          Download Full Report
        </Button>

        {/* Share Result Card */}
        <ShareResultCard
          scenarioTitle={scenarioTitle || feedback.rank}
          score={feedback.score}
          rank={feedback.rank}
          eloDelta={eloDelta}
          elo={profile?.elo ?? null}
        />

        {/* Scorecard */}
        <ScorecardShare feedback={feedback} scenarioTitle={scenarioTitle || feedback.rank} alias={alias ?? null} isValidSession={!!isValidSession} elo={profile?.elo ?? null} eloDelta={eloDelta} />

        {/* Challenge */}
        {isValidSession && scenarioEnv && scenarioRole && (
          <ChallengeButton score={feedback.score} scenarioEnv={scenarioEnv} scenarioRole={scenarioRole} isLoggedIn={!!profile} />
        )}

        {/* Shareable summary */}
        {interview && (
          <ShareableSummary feedback={feedback} alias={alias ?? null} isValidSession={!!isValidSession} />
        )}
      </div>
    </motion.div>
  );
}
