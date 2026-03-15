import { useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, Target, RotateCcw, Play, Quote, Gauge, Download, Compass, FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Mic, TrendingDown, Minus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Feedback, SkillScore, ExposureMoment, CriticalWeakness, FinalRoundMetrics } from "./types";
import { ShareableSummary } from "./ShareableSummary";
import type { VoiceMetrics } from "./voiceInterviewDesign";
import { buildVoiceReview, buildVoiceFeedbackResult } from "./voiceInterviewDesign";
import type { ChatMessage } from "./types";
import { VoiceFeedbackPanel } from "./VoiceFeedbackPanel";
import { getVoicePreviousBest, recordVoiceScore } from "./voiceOnboarding";
import { loadHistory } from "./sessionStorage";
import type { PromoSeriesState } from "./promotionSeries";

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

// --- Skill improvement tips ---

const SKILL_TIPS: Record<string, string> = {
  "Communication": "Lead with your main point before adding context. Cut filler words and aim for direct, confident delivery.",
  "Objection Handling": "Acknowledge the concern first, then reframe — avoid jumping to solutions before the prospect feels heard.",
  "Clarity": "Open each answer with one concrete sentence. Add a specific metric or example before expanding.",
  "Confidence": "Remove qualifier language (basically, kind of, sort of). State claims directly — hedging signals uncertainty.",
  "Discovery Questions": "Prepare 3–5 targeted questions per call. Drive the conversation forward by asking before explaining.",
};

// --- Skill Breakdown Bar ---

function SkillBar({ skill, delay, isLowest }: { skill: SkillScore; delay: number; isLowest?: boolean }) {
  return (
    <div className={`space-y-1 ${isLowest ? "rounded-md p-2 -mx-2 bg-amber-500/5 border border-amber-500/20" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] ${isLowest ? "text-amber-500/90 font-medium" : "text-muted-foreground"}`}>
            {skill.name}
          </span>
          {isLowest && (
            <span className="text-[9px] font-semibold text-amber-500/80 uppercase tracking-wider bg-amber-500/10 px-1 py-0.5 rounded">
              Focus Area
            </span>
          )}
        </div>
        <span className={`text-[11px] font-medium tabular-nums ${isLowest ? "text-amber-500/90" : "text-foreground"}`}>
          {skill.score}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${skill.score}%` }}
          transition={{ duration: 0.5, ease: "easeOut", delay }}
          className={`h-full rounded-full ${isLowest ? "bg-amber-500/70" : getBarColor(skill.score)}`}
        />
      </div>
      {isLowest && SKILL_TIPS[skill.name] && (
        <motion.p
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2 }}
          className="text-[10px] text-amber-500/80 leading-snug pt-0.5"
        >
          {SKILL_TIPS[skill.name]}
        </motion.p>
      )}
    </div>
  );
}

// --- Promotion Series Panel ---

function GameDot({ filled, isWin }: { filled: boolean; isWin: boolean }) {
  return (
    <motion.div
      initial={filled ? { scale: 0 } : false}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className={`h-3 w-3 rounded-full border-2 ${
        filled
          ? isWin
            ? "bg-primary border-primary"
            : "bg-destructive border-destructive"
          : "bg-transparent border-muted-foreground/30"
      }`}
    />
  );
}

function PromotionSeriesPanel({ promo }: { promo: PromoSeriesState }) {
  const isWon = promo.status === "won";
  const isFailed = promo.status === "failed";
  const isActive = promo.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.25 }}
      className={`rounded-xl border overflow-hidden ${
        isWon
          ? "border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
          : isFailed
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-muted/20"
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
        isWon ? "border-primary/20" : isFailed ? "border-destructive/20" : "border-border"
      }`}>
        <div className="flex items-center gap-2">
          {isWon && (
            <motion.div
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.4 }}
            >
              <Award className="h-3.5 w-3.5 text-primary" />
            </motion.div>
          )}
          {isFailed && <Target className="h-3.5 w-3.5 text-destructive/70" />}
          {isActive && <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />}
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
            isWon ? "text-primary" : isFailed ? "text-destructive/80" : "text-muted-foreground"
          }`}>
            {isWon ? "Promotion Complete" : isFailed ? "Promotion Failed" : "Promotion Series"}
          </p>
        </div>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
          isWon
            ? "bg-primary/15 text-primary"
            : isFailed
            ? "bg-destructive/10 text-destructive/70"
            : "bg-muted text-muted-foreground"
        }`}>
          Best of 3
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Rank progression */}
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[11px] font-bold ${
            isWon ? "text-muted-foreground line-through" : isFailed ? "text-foreground" : "text-foreground"
          }`}>
            {promo.fromRank}
          </span>
          <motion.div
            animate={isWon ? { x: [0, 4, 0], opacity: [1, 0.6, 1] } : {}}
            transition={{ repeat: isWon ? 2 : 0, duration: 0.4, delay: 0.5 }}
            className="flex items-center"
          >
            <svg className={`h-3 w-5 ${isWon ? "text-primary" : isFailed ? "text-destructive/50" : "text-muted-foreground/50"}`} viewBox="0 0 20 12" fill="none">
              <path d="M1 6h16M13 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <span className={`text-[11px] font-bold ${
            isWon ? "text-primary" : isFailed ? "text-muted-foreground" : "text-muted-foreground"
          }`}>
            {promo.toRank}
          </span>
        </div>

        {/* Win/Loss dots */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mr-0.5">W</span>
            {[0, 1].map((i) => (
              <GameDot key={`w${i}`} filled={i < promo.wins} isWin={true} />
            ))}
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mr-0.5">L</span>
            {[0, 1].map((i) => (
              <GameDot key={`l${i}`} filled={i < promo.losses} isWin={false} />
            ))}
          </div>
        </div>

        {/* Status message */}
        <p className={`text-[10px] text-center leading-snug ${
          isWon ? "text-primary font-medium" : isFailed ? "text-destructive/70" : "text-muted-foreground"
        }`}>
          {isWon && `You've ranked up to ${promo.toRank}. Series complete.`}
          {isFailed && `${promo.wins}W · ${promo.losses}L — Score adjusted. Re-enter the zone to retry.`}
          {isActive && promo.wins === 0 && promo.losses === 0 && `Score 65+ in your next 2 sessions to rank up.`}
          {isActive && (promo.wins > 0 || promo.losses > 0) && (
            promo.wins > promo.losses
              ? `${2 - promo.wins} more win${2 - promo.wins > 1 ? "s" : ""} needed. Don't drop it.`
              : promo.losses > promo.wins
              ? `${2 - promo.losses} loss${2 - promo.losses > 1 ? "es" : ""} away from failure. Score 65+ to recover.`
              : `Tied. Next session decides.`
          )}
        </p>
      </div>
    </motion.div>
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
  roleId,
  roleTitle,
  voiceMessages,
  promoSeries,
  advancedFeedback = true,
  onUpgrade,
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
  roleId?: string;
  roleTitle?: string;
  voiceMessages?: ChatMessage[];
  promoSeries?: PromoSeriesState;
  /** When false, skill breakdown is replaced with a Pro upgrade teaser. */
  advancedFeedback?: boolean;
  onUpgrade?: () => void;
}) {
  const interview = isInterviewRank(feedback.rank);
  const skills = feedback.skillBreakdown || [];
  const frm = feedback.finalRoundMetrics;

  const lowestSkill = useMemo(() => {
    if (skills.length === 0) return null;
    return skills.reduce((min, s) => s.score < min.score ? s : min, skills[0]);
  }, [skills]);

  const personalBest = useMemo(() => {
    if (!roleId) return null;
    const history = loadHistory();
    const roleSessions = history.filter(s => s.roleId === roleId);
    if (roleSessions.length === 0) return null;
    return Math.max(...roleSessions.map(s => s.score));
  }, [roleId]);

  const personalBestDelta = personalBest !== null ? feedback.score - personalBest : null;

  // ── Voice mode: delegate entirely to VoiceFeedbackPanel ──────────────────
  // Compute previous best once on mount (before recording this session).
  const voicePreviousBestRef = useRef<number | null | undefined>(undefined);
  if (voiceMetrics && roleId && voicePreviousBestRef.current === undefined) {
    voicePreviousBestRef.current = getVoicePreviousBest(roleId);
  }

  const voiceResult = useMemo(() => {
    if (!voiceMetrics) return null;
    const transcript = voiceMessages
      ? voiceMessages.filter((m) => m.role === "user").map((m) => m.text).join("\n")
      : "";
    return buildVoiceFeedbackResult(
      voiceMetrics,
      transcript,
      voicePreviousBestRef.current ?? null,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMetrics, voiceMessages]);

  // Record the voice score once — after result is computed.
  const voiceScoreRecordedRef = useRef(false);
  useEffect(() => {
    if (voiceResult && roleId && !voiceScoreRecordedRef.current) {
      voiceScoreRecordedRef.current = true;
      recordVoiceScore(roleId, voiceResult.finalScore);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceResult]);

  if (voiceResult) {
    return (
      <VoiceFeedbackPanel
        result={voiceResult}
        roleTitle={roleTitle ?? ""}
        onRetry={onTrySameRole}
        onNewScenario={onStartNew}
        voiceScoreAdjustment={voiceScoreAdjustment}
        voiceMessages={voiceMessages}
      />
    );
  }
  // ── End voice early-return ────────────────────────────────────────────────

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
          advancedFeedback ? (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Skill Breakdown
              </p>
              <div className="space-y-2.5">
                {skills.map((skill, i) => (
                  <SkillBar
                    key={skill.name}
                    skill={skill}
                    delay={0.2 + i * 0.08}
                    isLowest={lowestSkill?.name === skill.name}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl border border-dashed border-primary/20 bg-primary/5 px-4 py-4 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={onUpgrade}
            >
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Skill Breakdown</p>
                <p className="text-xs text-muted-foreground">Detailed skill scores available on <span className="text-primary font-semibold">Pro</span>.</p>
              </div>
              <button className="shrink-0 h-7 px-3 text-xs rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-semibold">
                Unlock
              </button>
            </div>
          )
        )}

        {/* Personal Best Comparison */}
        {personalBest !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-lg border border-border bg-muted/30 p-3"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Personal Best — {isFinalRound ? "Final Round" : "This Role"}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold font-heading text-foreground">{feedback.score}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">This Session</p>
                </div>
                <div className="text-muted-foreground/40 text-xs">vs</div>
                <div className="text-center">
                  <p className="text-xl font-bold font-heading text-muted-foreground">{personalBest}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Personal Best</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {personalBestDelta !== null && personalBestDelta > 0 && (
                  <div className="flex items-center gap-1 text-primary">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold">+{personalBestDelta}</span>
                  </div>
                )}
                {personalBestDelta !== null && personalBestDelta < 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold">{personalBestDelta}</span>
                  </div>
                )}
                {personalBestDelta === 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Minus className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold">Tied</span>
                  </div>
                )}
                <p className="text-[9px] text-muted-foreground">
                  {personalBestDelta !== null && personalBestDelta > 0
                    ? "New personal best"
                    : personalBestDelta === 0
                    ? "Matched best"
                    : "vs your best"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Promotion Series */}
        {promoSeries && <PromotionSeriesPanel promo={promoSeries} />}

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

        {/* Voice Performance Review — voice mode only */}
        {voiceMetrics && (() => {
          const review = buildVoiceReview(voiceMetrics);
          return (
            <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/15">
                <div className="flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    Voice Performance Review
                  </p>
                </div>
                {voiceScoreAdjustment !== undefined && voiceScoreAdjustment !== 0 && (
                  <span className={`text-[10px] font-semibold ${voiceScoreAdjustment > 0 ? "text-primary" : "text-destructive"}`}>
                    {voiceScoreAdjustment > 0 ? "+" : ""}{voiceScoreAdjustment} pts
                  </span>
                )}
              </div>

              <div className="px-4 py-3 space-y-3.5">
                {/* Voice score */}
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.1 }}
                    className="text-4xl font-bold font-heading text-primary leading-none"
                  >
                    {review.voiceScore}
                  </motion.span>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground leading-tight">Voice Score</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Across 6 delivery categories</p>
                    <div className="w-24 h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${review.voiceScore}%` }}
                        transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
                        className={`h-full rounded-full ${getScoreBarColor(review.voiceScore)}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="space-y-2">
                  {review.categories.map((cat, i) => {
                    const isWeakest = cat.name === review.weakestCategory.name;
                    const isStrongest = cat.name === review.strongestCategory.name;
                    return (
                      <div key={cat.name} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] ${isWeakest ? "text-amber-500/90 font-medium" : "text-muted-foreground"}`}>
                              {cat.name}
                            </span>
                            {isStrongest && (
                              <span className="text-[9px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-1 py-0.5 rounded">
                                Best
                              </span>
                            )}
                            {isWeakest && (
                              <span className="text-[9px] font-semibold text-amber-500/80 uppercase tracking-wider bg-amber-500/10 px-1 py-0.5 rounded">
                                Focus
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-medium tabular-nums ${isWeakest ? "text-amber-500/90" : "text-foreground"}`}>
                            {cat.score}
                          </span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.score}%` }}
                            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 + i * 0.07 }}
                            className={`h-full rounded-full ${isWeakest ? "bg-amber-500/70" : getBarColor(cat.score)}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Strongest / Weakest summary row */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div className="rounded-lg p-2.5 bg-primary/8 border border-primary/15">
                    <p className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-0.5">Strongest</p>
                    <p className="text-[11px] font-medium text-foreground">{review.strongestCategory.name}</p>
                    <p className="text-[10px] text-muted-foreground">{review.strongestCategory.score}/100</p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-amber-500/8 border border-amber-500/20">
                    <p className="text-[9px] font-semibold text-amber-500/80 uppercase tracking-wider mb-0.5">Weakest</p>
                    <p className="text-[11px] font-medium text-foreground">{review.weakestCategory.name}</p>
                    <p className="text-[10px] text-muted-foreground">{review.weakestCategory.score}/100</p>
                  </div>
                </div>

                {/* Coaching tip */}
                <div className="flex items-start gap-2 rounded-lg p-2.5 bg-muted/50 border border-border">
                  <Compass className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <span className="font-semibold text-foreground">Coaching: </span>
                    {review.coachingTip}
                  </p>
                </div>

                {/* Raw metrics as secondary context */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-[13px] font-bold font-heading text-foreground tabular-nums">{voiceMetrics.fillerFrequency}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Fillers/min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-bold font-heading text-foreground tabular-nums">{voiceMetrics.verbalPace}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Words/min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-bold font-heading text-foreground tabular-nums">{voiceMetrics.responseDuration}s</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Duration</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
        {interview && feedback.score < 60 && onStartDrill ? (
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
