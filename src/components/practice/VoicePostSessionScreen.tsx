import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mic, Flame, Snowflake, Lightbulb, Zap, Activity, MessageSquare,
  Clock, Shield, Radio, Trophy, ArrowUp, RotateCcw, Shuffle,
  Type, ChevronDown, ChevronUp, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedScore } from "./AnimatedScore";
import { loadHistory } from "./sessionStorage";
import type { VoiceMetrics } from "./voiceInterviewDesign";

/* ── Types ── */
interface VoiceScoreCategory {
  name: string;
  score: number;
  icon: React.ReactNode;
}

/* ── Coaching tips keyed by category name ── */
const VOICE_COACHING_TIPS: Record<string, string> = {
  Clarity: "Eliminate filler words and vague hedging. Open with your key point, then support with one specific example.",
  Confidence: "Use declarative phrasing — replace 'I think maybe' with 'In my experience.' Practice power pauses between key points.",
  Pace: "Aim for 140–170 words per minute. Slow down on key value statements, speed up on transitions.",
  Conciseness: "Lead with the answer in one sentence, then expand only if asked. Cut setup and throat-clearing phrases.",
  "Response Quality": "Structure every answer: Situation → Action → Result. Include at least one metric per response.",
  "Verbal Readiness": "Reduce hesitation before answering. A brief 1-second pause is confident; 3+ seconds signals uncertainty.",
};

const CATEGORY_EXPLANATIONS: Record<string, { strong: string; weak: string }> = {
  Clarity: {
    strong: "Your delivery was clean with minimal filler — your message landed clearly.",
    weak: "Filler words and vague phrasing diluted your core message.",
  },
  Confidence: {
    strong: "Steady pace and declarative phrasing projected strong authority.",
    weak: "Hedging language and inconsistent pacing undermined perceived confidence.",
  },
  Pace: {
    strong: "Your speaking pace stayed in the ideal 140–170 wpm range throughout.",
    weak: "Your pace was outside the optimal range — rushing or dragging reduced impact.",
  },
  Conciseness: {
    strong: "You kept responses tight and purposeful without over-explaining.",
    weak: "Responses ran too long or too short — tighten the structure.",
  },
  "Response Quality": {
    strong: "Answers were well-structured with specifics and measurable outcomes.",
    weak: "Answers lacked structure or specifics — try Situation → Action → Result.",
  },
  "Verbal Readiness": {
    strong: "Quick, consistent response times showed preparation and readiness.",
    weak: "Long or inconsistent pauses before answering signaled hesitation.",
  },
};

/* ── Score derivation (reused from VoiceResultsPanel logic) ── */
function deriveVoiceScores(metrics: VoiceMetrics, baseScore: number): VoiceScoreCategory[] {
  const clarityScore = metrics.fillerFrequency <= 1 ? 92
    : metrics.fillerFrequency <= 2 ? 80
    : metrics.fillerFrequency <= 5 ? 60
    : Math.max(25, 50 - (metrics.fillerFrequency - 5) * 5);

  const paceInRange = metrics.verbalPace >= 140 && metrics.verbalPace <= 170;
  const pauseControlled = metrics.pauseLengthAvg > 0 && metrics.pauseLengthAvg <= 1.5 && metrics.pauseLengthVariance <= 0.4;
  const confidenceBase = paceInRange ? 78 : metrics.verbalPace >= 120 && metrics.verbalPace <= 190 ? 62 : 40;
  const confidenceScore = Math.min(100, confidenceBase + (metrics.fillerFrequency <= 2 ? 12 : 0) + (pauseControlled ? 8 : 0));

  const paceScore = paceInRange ? 90
    : (metrics.verbalPace >= 130 && metrics.verbalPace <= 180) ? 75
    : (metrics.verbalPace >= 120 && metrics.verbalPace <= 190) ? 55
    : 35;

  const avgDuration = metrics.responseDuration;
  const concisenessScore = avgDuration >= 25 && avgDuration <= 50 ? 88
    : avgDuration >= 15 && avgDuration <= 70 ? 70
    : avgDuration < 15 ? 45
    : Math.max(30, 60 - (avgDuration - 70) * 0.5);

  const responseQualityScore = Math.min(100, Math.round(baseScore * 0.9 + (paceInRange ? 5 : 0) + (metrics.fillerFrequency <= 2 ? 5 : 0)));

  let verbalReadinessScore: number;
  if (metrics.pauseLengthAvg === 0) {
    verbalReadinessScore = Math.min(100, Math.round(baseScore * 0.85 + (metrics.fillerFrequency <= 2 ? 10 : 0)));
  } else if (metrics.pauseLengthAvg <= 1.0 && metrics.pauseLengthVariance <= 0.3) {
    verbalReadinessScore = 92;
  } else if (metrics.pauseLengthAvg <= 1.5 && metrics.pauseLengthVariance <= 0.5) {
    verbalReadinessScore = 78;
  } else if (metrics.pauseLengthAvg <= 2.5) {
    verbalReadinessScore = 60;
  } else {
    verbalReadinessScore = Math.max(30, 50 - (metrics.pauseLengthAvg - 2.5) * 10);
  }

  return [
    { name: "Clarity", score: Math.round(clarityScore), icon: <Zap className="h-3.5 w-3.5" /> },
    { name: "Confidence", score: Math.round(confidenceScore), icon: <Shield className="h-3.5 w-3.5" /> },
    { name: "Pace", score: Math.round(paceScore), icon: <Activity className="h-3.5 w-3.5" /> },
    { name: "Conciseness", score: Math.round(concisenessScore), icon: <Clock className="h-3.5 w-3.5" /> },
    { name: "Response Quality", score: Math.round(responseQualityScore), icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { name: "Verbal Readiness", score: Math.round(verbalReadinessScore), icon: <Radio className="h-3.5 w-3.5" /> },
  ];
}

function getBarColor(score: number) {
  if (score >= 80) return "bg-primary";
  if (score >= 60) return "bg-primary/60";
  if (score >= 40) return "bg-muted-foreground";
  return "bg-destructive/60";
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-foreground";
  return "text-destructive";
}

function getRankFromScore(score: number): string {
  if (score >= 90) return "Rainmaker";
  if (score >= 75) return "Operator";
  if (score >= 60) return "Closer";
  if (score >= 40) return "Starter";
  return "Rookie";
}

/* ── Sub-components ── */

function CategoryBar({ cat, delay }: { cat: VoiceScoreCategory; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{cat.icon}</span>
          <span className="text-xs font-medium text-foreground">{cat.name}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${getScoreColor(cat.score)}`}>{cat.score}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cat.score}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: delay + 0.1 }}
          className={`h-full rounded-full ${getBarColor(cat.score)}`}
        />
      </div>
    </motion.div>
  );
}

function PersonalBestBlock({ currentScore, scenarioRole }: { currentScore: number; scenarioRole?: string }) {
  const history = loadHistory();
  const relevant = scenarioRole ? history.filter((s) => s.roleId === scenarioRole) : history;
  if (relevant.length <= 1) return null;

  const previousBest = Math.max(...relevant.slice(1).map((s) => s.score));
  const diff = currentScore - previousBest;
  const isNewBest = currentScore > previousBest;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4 }}
      className={`rounded-xl p-4 border ${isNewBest ? "bg-primary/5 border-primary/25" : "bg-muted/30 border-border"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className={`h-4 w-4 ${isNewBest ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-xs font-semibold text-foreground">
          {isNewBest ? "New Personal Best!" : "Personal Best Comparison"}
        </span>
        {isNewBest && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-0.5 ml-auto">
            <ArrowUp className="h-2.5 w-2.5" />+{diff}
          </span>
        )}
      </div>
      <div className="flex items-end justify-around">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Previous Best</p>
          <p className="text-xl font-bold font-heading text-muted-foreground">{previousBest}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          diff > 0 ? "text-primary bg-primary/10" : diff < 0 ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"
        }`}>
          {diff > 0 ? `+${diff}` : diff === 0 ? "Tied" : `${diff}`}
        </span>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">This Session</p>
          <p className={`text-xl font-bold font-heading ${isNewBest ? "text-primary" : "text-foreground"}`}>{currentScore}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Component ── */
export interface VoicePostSessionProps {
  voiceMetrics: VoiceMetrics;
  baseScore: number;
  voiceScoreAdjustment?: number;
  transcript?: string;
  scenarioRole?: string;
  onRetry: () => void;
  onNewScenario: () => void;
  onSwitchToText: () => void;
}

export function VoicePostSessionScreen({
  voiceMetrics,
  baseScore,
  voiceScoreAdjustment,
  transcript,
  scenarioRole,
  onRetry,
  onNewScenario,
  onSwitchToText,
}: VoicePostSessionProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const categories = deriveVoiceScores(voiceMetrics, baseScore);
  const voiceScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
  const rank = getRankFromScore(voiceScore);
  const strongest = categories.reduce((a, b) => (a.score >= b.score ? a : b));
  const weakest = categories.reduce((a, b) => (a.score <= b.score ? a : b));
  const coachingTip = VOICE_COACHING_TIPS[weakest.name] || "Focus on deliberate vocal practice.";

  // Rough percentile from score
  const percentile = Math.min(99, Math.max(1, Math.round(voiceScore * 0.95)));
  const topPct = 100 - percentile;

  // One-line summary
  const summaryLine = voiceScore >= 80
    ? "Strong vocal delivery — your tone and pacing commanded attention."
    : voiceScore >= 60
    ? "Solid foundation — tighten delivery on your weakest category to level up."
    : "Room to grow — focus on one category at a time for fastest improvement.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="card-elevated overflow-hidden"
    >
      {/* ═══ HEADER ═══ */}
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Voice Practice Complete
          </h3>
        </div>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
          Sales call delivery assessment
        </p>
      </div>

      {/* ═══ TOP SUMMARY ═══ */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-border bg-gradient-to-b from-background to-muted/10">
        <AnimatedScore
          target={voiceScore}
          delay={0.2}
          className={`text-5xl font-bold font-heading ${getScoreColor(voiceScore)}`}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-[10px] text-muted-foreground mt-0.5"
        >
          Voice Performance Score
        </motion.p>

        {/* Rank + Percentile badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8 }}
          className="flex items-center gap-2 mt-2 flex-wrap justify-center"
        >
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getScoreColor(voiceScore)} border-current/20`}>
            {rank}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" />
            Top {topPct}%
          </span>
          {voiceScoreAdjustment != null && voiceScoreAdjustment !== 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              voiceScoreAdjustment > 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}>
              {voiceScoreAdjustment > 0 ? "+" : ""}{voiceScoreAdjustment} adj
            </span>
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
            animate={{ width: `${voiceScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 3.0 }}
            className={`h-full rounded-full ${getBarColor(voiceScore)}`}
          />
        </motion.div>

        {/* Summary line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2 }}
          className="text-[11px] text-muted-foreground text-center mt-3 max-w-[300px] leading-relaxed"
        >
          {summaryLine}
        </motion.p>
      </div>

      <div className="p-5 space-y-5">
        {/* ═══ CATEGORY BREAKDOWN ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Voice Category Breakdown</h4>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
            {categories.map((cat, i) => (
              <CategoryBar key={cat.name} cat={cat} delay={0.4 + i * 0.08} />
            ))}
          </div>
        </motion.div>

        {/* ═══ STRONGEST & WEAKEST ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="rounded-xl p-4 border bg-primary/5 border-primary/20"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Strongest Area</span>
            </div>
            <p className="text-sm font-bold text-foreground">{strongest.name}</p>
            <p className="text-lg font-heading font-bold text-primary tabular-nums">{strongest.score}/100</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
              {CATEGORY_EXPLANATIONS[strongest.name]?.strong || "Excellent performance in this category."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="rounded-xl p-4 border bg-destructive/5 border-destructive/20 ring-1 ring-destructive/10"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Snowflake className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Focus Area</span>
            </div>
            <p className="text-sm font-bold text-foreground">{weakest.name}</p>
            <p className="text-lg font-heading font-bold text-destructive tabular-nums">{weakest.score}/100</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
              {CATEGORY_EXPLANATIONS[weakest.name]?.weak || "This area needs focused practice."}
            </p>
          </motion.div>
        </div>

        {/* ═══ COACHING TIP ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="rounded-xl p-4 border border-border bg-muted/30"
        >
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground mb-1">
                Coaching Tip — {weakest.name}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{coachingTip}</p>
            </div>
          </div>
        </motion.div>

        {/* ═══ TRANSCRIPT REVIEW ═══ */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            <button
              onClick={() => setTranscriptOpen(!transcriptOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Transcript Review</span>
              </div>
              {transcriptOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            {transcriptOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-3 border-t border-border"
              >
                <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {transcript}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ═══ PERSONAL BEST ═══ */}
        <PersonalBestBlock currentScore={voiceScore} scenarioRole={scenarioRole} />

        {/* ═══ RAW METRICS ═══ */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: voiceMetrics.fillerFrequency, label: "Fillers/min" },
            { val: voiceMetrics.verbalPace, label: "Words/min" },
            { val: `${voiceMetrics.responseDuration}s`, label: "Duration" },
          ].map((m) => (
            <div key={m.label} className="text-center p-2 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-bold font-heading text-foreground">{m.val}</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* ═══ CTAs ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="space-y-2 pt-2"
        >
          <Button
            className="w-full h-11 text-sm gap-2 font-semibold"
            onClick={onRetry}
          >
            <RotateCcw className="h-4 w-4" />
            Retry Voice Scenario
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-9 text-xs gap-1.5" onClick={onNewScenario}>
              <Shuffle className="h-3.5 w-3.5" />
              New Voice Scenario
            </Button>
            <Button variant="ghost" className="h-9 text-xs gap-1.5 text-muted-foreground" onClick={onSwitchToText}>
              <Type className="h-3.5 w-3.5" />
              Switch to Text
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
