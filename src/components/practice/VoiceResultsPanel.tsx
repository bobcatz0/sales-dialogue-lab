import { motion } from "framer-motion";
import { Mic, Flame, Snowflake, Lightbulb, Zap, Activity, MessageSquare, Clock, Shield, Radio } from "lucide-react";
import type { VoiceMetrics } from "./voiceInterviewDesign";

/** Voice-specific scoring categories for sales call performance review */
export interface VoiceScoreCategory {
  name: string;
  score: number;
  icon: React.ReactNode;
}

const VOICE_COACHING_TIPS: Record<string, string> = {
  "Clarity": "Eliminate filler words and vague hedging. Open with your key point, then support with one specific example.",
  "Confidence": "Use declarative phrasing — replace 'I think maybe' with 'In my experience.' Practice power pauses between key points.",
  "Pace": "Aim for 140–170 words per minute. Slow down on key value statements, speed up on transitions.",
  "Conciseness": "Lead with the answer in one sentence, then expand only if asked. Cut setup and throat-clearing phrases.",
  "Response Quality": "Structure every answer: Situation → Action → Result. Include at least one metric per response.",
  "Verbal Readiness": "Reduce hesitation before answering. A brief 1-second pause is confident; 3+ seconds signals uncertainty.",
};

function deriveVoiceScores(metrics: VoiceMetrics, baseScore: number): VoiceScoreCategory[] {
  // Clarity: inverse of filler frequency
  const clarityScore = metrics.fillerFrequency <= 1 ? 92
    : metrics.fillerFrequency <= 2 ? 80
    : metrics.fillerFrequency <= 5 ? 60
    : Math.max(25, 50 - (metrics.fillerFrequency - 5) * 5);

  // Confidence: composite of pace steadiness + low filler + pause control
  const paceInRange = metrics.verbalPace >= 140 && metrics.verbalPace <= 170;
  const pauseControlled = metrics.pauseLengthAvg > 0 && metrics.pauseLengthAvg <= 1.5 && metrics.pauseLengthVariance <= 0.4;
  const confidenceBase = paceInRange ? 78 : metrics.verbalPace >= 120 && metrics.verbalPace <= 190 ? 62 : 40;
  const confidenceScore = Math.min(100, confidenceBase + (metrics.fillerFrequency <= 2 ? 12 : 0) + (pauseControlled ? 8 : 0));

  // Pace: how close to ideal 140-170 wpm
  const paceScore = paceInRange ? 90
    : (metrics.verbalPace >= 130 && metrics.verbalPace <= 180) ? 75
    : (metrics.verbalPace >= 120 && metrics.verbalPace <= 190) ? 55
    : 35;

  // Conciseness: based on response duration (ideal avg 25-50s per response)
  const avgDuration = metrics.responseDuration;
  const concisenessScore = avgDuration >= 25 && avgDuration <= 50 ? 88
    : avgDuration >= 15 && avgDuration <= 70 ? 70
    : avgDuration < 15 ? 45
    : Math.max(30, 60 - (avgDuration - 70) * 0.5);

  // Response Quality: derived from base text evaluation score
  const responseQualityScore = Math.min(100, Math.round(baseScore * 0.9 + (paceInRange ? 5 : 0) + (metrics.fillerFrequency <= 2 ? 5 : 0)));

  // Verbal Readiness: pause analysis — lower avg pause + consistency = more ready
  let verbalReadinessScore: number;
  if (metrics.pauseLengthAvg === 0) {
    // No pause data available — estimate from other signals
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

function VoiceCategoryBar({ category, delay }: { category: VoiceScoreCategory; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{category.icon}</span>
          <span className="text-xs font-medium text-foreground">{category.name}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${getScoreColor(category.score)}`}>
          {category.score}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${category.score}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: delay + 0.1 }}
          className={`h-full rounded-full ${getBarColor(category.score)}`}
        />
      </div>
    </motion.div>
  );
}

export function VoiceResultsPanel({
  voiceMetrics,
  baseScore,
  voiceScoreAdjustment,
}: {
  voiceMetrics: VoiceMetrics;
  baseScore: number;
  voiceScoreAdjustment?: number;
}) {
  const categories = deriveVoiceScores(voiceMetrics, baseScore);
  const voiceScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
  const strongest = categories.reduce((a, b) => (a.score >= b.score ? a : b));
  const weakest = categories.reduce((a, b) => (a.score <= b.score ? a : b));
  const coachingTip = VOICE_COACHING_TIPS[weakest.name] || "Focus on deliberate vocal practice.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Mic className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">Voice Performance Review</h4>
          <p className="text-[10px] text-muted-foreground">Sales call delivery assessment</p>
        </div>
      </div>

      {/* Final Voice Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        className="rounded-xl border border-border bg-muted/20 p-5 text-center"
      >
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
          Voice Score
        </p>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-4xl font-bold font-heading ${getScoreColor(voiceScore)}`}
        >
          {voiceScore}
        </motion.span>
        <span className="text-lg text-muted-foreground font-light">/100</span>
        {voiceScoreAdjustment !== undefined && voiceScoreAdjustment !== 0 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Score adjustment: <span className={`font-bold ${voiceScoreAdjustment > 0 ? "text-primary" : "text-destructive"}`}>
              {voiceScoreAdjustment > 0 ? "+" : ""}{voiceScoreAdjustment}
            </span>
          </p>
        )}
      </motion.div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
        {categories.map((cat, i) => (
          <VoiceCategoryBar key={cat.name} category={cat} delay={0.4 + i * 0.08} />
        ))}
      </div>

      {/* Strongest & Weakest */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-xl p-4 border bg-primary/5 border-primary/20"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Strongest
            </span>
          </div>
          <p className="text-sm font-bold text-foreground">{strongest.name}</p>
          <p className="text-lg font-heading font-bold text-primary tabular-nums">{strongest.score}/100</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="rounded-xl p-4 border bg-destructive/5 border-destructive/20"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Snowflake className="h-3.5 w-3.5 text-destructive" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
              Focus Area
            </span>
          </div>
          <p className="text-sm font-bold text-foreground">{weakest.name}</p>
          <p className="text-lg font-heading font-bold text-destructive tabular-nums">{weakest.score}/100</p>
        </motion.div>
      </div>

      {/* Coaching Tip */}
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

      {/* Raw Metrics Summary (compact) */}
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
    </motion.div>
  );
}
