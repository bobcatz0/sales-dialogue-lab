/**
 * VoiceFeedbackPanel — standalone post-session feedback UI for voice mode.
 *
 * Completely distinct from the text-mode FeedbackPanel. Emerald palette,
 * voice-specific scoring, transcript review, and replay-optimised CTAs.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, RotateCcw, Play, ChevronDown, ChevronUp,
  Compass, TrendingUp, TrendingDown, Minus,
  FileText, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceFeedbackResult } from "./voiceInterviewDesign";
import type { ChatMessage } from "./types";

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-emerald-500/60";
  if (score >= 40) return "bg-amber-500/70";
  return "bg-destructive/60";
}

function rankColor(rank: string): string {
  switch (rank) {
    case "Elite":       return "text-emerald-400";
    case "Pro":         return "text-emerald-500";
    case "Developing":  return "text-amber-500";
    case "Inconsistent":return "text-orange-500";
    default:            return "text-destructive";
  }
}

function rankBg(rank: string): string {
  switch (rank) {
    case "Elite":       return "bg-emerald-500/15 border-emerald-500/30";
    case "Pro":         return "bg-emerald-500/10 border-emerald-500/20";
    case "Developing":  return "bg-amber-500/10 border-amber-500/25";
    case "Inconsistent":return "bg-orange-500/10 border-orange-500/25";
    default:            return "bg-destructive/10 border-destructive/25";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VoiceFeedbackPanelProps {
  result: VoiceFeedbackResult;
  roleTitle: string;
  onRetry: () => void;
  onNewScenario: () => void;
  voiceScoreAdjustment?: number;
  voiceMessages?: ChatMessage[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBar({ score, delay = 0, color }: { score: number; delay?: number; color: string }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.55, ease: "easeOut", delay }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

function DeltaBadge({ delta, previousBest }: { delta: number; previousBest: number | null }) {
  if (delta > 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          New personal best! +{delta} above your previous
          {previousBest !== null ? ` (${previousBest})` : ""}.
        </p>
      </div>
    );
  }
  if (delta < 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <TrendingDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          {Math.abs(delta)} below your best of {previousBest}. Keep pushing.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <p className="text-[11px] text-muted-foreground">Matched your personal best of {previousBest}.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VoiceFeedbackPanel({
  result,
  roleTitle,
  onRetry,
  onNewScenario,
  voiceScoreAdjustment,
  voiceMessages,
}: VoiceFeedbackPanelProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Scroll transcript to top when opened
  useEffect(() => {
    if (transcriptOpen && transcriptRef.current) {
      transcriptRef.current.scrollTop = 0;
    }
  }, [transcriptOpen]);

  const isFirstSession = result.previousBest === null;
  const showDelta = !isFirstSession && result.improvementDelta !== null;
  const userTurns = voiceMessages?.filter((m) => m.role === "user").length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="card-elevated overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-border bg-emerald-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Mic className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              Voice Call Review
            </h3>
          </div>
          {voiceScoreAdjustment !== undefined && voiceScoreAdjustment !== 0 && (
            <span className={`text-[10px] font-semibold ${voiceScoreAdjustment > 0 ? "text-emerald-500" : "text-destructive"}`}>
              {voiceScoreAdjustment > 0 ? "+" : ""}{voiceScoreAdjustment} pts overall
            </span>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5 ml-8">
          Scored on delivery, pacing, and verbal clarity — not just content.
        </p>
      </div>

      {/* ── Section 1: Summary block ───────────────────────────── */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-start gap-5">
          {/* Large score */}
          <div className="shrink-0 text-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.05 }}
              className="block text-5xl font-bold font-heading text-foreground leading-none tabular-nums"
            >
              {result.finalScore}
            </motion.span>
            <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Voice Score</p>
          </div>

          {/* Score bar + rank + percentile */}
          <div className="flex-1 space-y-2 pt-1.5">
            <ScoreBar score={result.finalScore} delay={0.1} color={barColor(result.finalScore)} />
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${rankColor(result.rank)} ${rankBg(result.rank)}`}>
                {result.rank === "Elite" && <Award className="h-2.5 w-2.5" />}
                {result.rank}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Top {100 - result.percentile}%
              </span>
              {isFirstSession && (
                <span className="text-[9px] text-muted-foreground/60 italic">First session</span>
              )}
            </div>
          </div>
        </div>

        {/* Summary line */}
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-3 border-l-2 border-emerald-500/30 pl-2.5">
          {result.summaryLine}
        </p>
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* ── Section 7: Personal best comparison ───────────────── */}
        {showDelta && (
          <DeltaBadge delta={result.improvementDelta!} previousBest={result.previousBest} />
        )}

        {/* ── Section 2: Category breakdown ─────────────────────── */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Category Breakdown
          </p>
          {result.categoryBreakdown.map((cat, i) => {
            const isWeakest   = cat.name === result.weakestCategory;
            const isStrongest = cat.name === result.strongestCategory;
            return (
              <div key={cat.name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-medium ${isWeakest ? "text-amber-500/90" : "text-foreground"}`}>
                      {cat.name}
                    </span>
                    {isStrongest && !isWeakest && (
                      <span className="text-[8px] font-semibold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-1 py-0.5 rounded leading-none">
                        Best
                      </span>
                    )}
                    {isWeakest && (
                      <span className="text-[8px] font-semibold text-amber-500/80 uppercase tracking-wider bg-amber-500/10 px-1 py-0.5 rounded leading-none">
                        Focus
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold tabular-nums ${isWeakest ? "text-amber-500/90" : "text-foreground"}`}>
                    {cat.score}
                  </span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.score}%` }}
                    transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 + i * 0.07 }}
                    className={`h-full rounded-full ${isWeakest ? "bg-amber-500/70" : barColor(cat.score)}`}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground/70 leading-snug">{cat.explanation}</p>
              </div>
            );
          })}
        </div>

        {/* ── Section 3: Strongest / Weakest ────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5 bg-emerald-500/6 border border-emerald-500/15">
            <p className="text-[9px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
              Strongest
            </p>
            <p className="text-[11px] font-semibold text-foreground leading-tight">
              {result.strongestCategory}
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-1">
              {result.strongestExplanation}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-amber-500/6 border border-amber-500/20">
            <p className="text-[9px] font-semibold text-amber-500/80 uppercase tracking-wider mb-1">
              Weakest
            </p>
            <p className="text-[11px] font-semibold text-foreground leading-tight">
              {result.weakestCategory}
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-1">
              {result.weakestExplanation}
            </p>
          </div>
        </div>

        {/* ── Section 4: Coaching tip ────────────────────────────── */}
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
          <Compass className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
              Coaching Focus
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">{result.coachingTip}</p>
          </div>
        </div>

        {/* ── Section 5: Transcript review ──────────────────────── */}
        {voiceMessages && voiceMessages.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setTranscriptOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-foreground">Transcript Review</span>
                <span className="text-[9px] text-muted-foreground/60">
                  {userTurns} {userTurns === 1 ? "turn" : "turns"}
                </span>
              </div>
              {transcriptOpen
                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>

            <AnimatePresence initial={false}>
              {transcriptOpen && (
                <motion.div
                  key="transcript"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div
                    ref={transcriptRef}
                    className="px-3 py-3 space-y-3 max-h-72 overflow-y-auto"
                  >
                    {voiceMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`pl-3 ${
                          msg.role === "user"
                            ? "border-l-2 border-emerald-500/40"
                            : "border-l-2 border-border"
                        }`}
                      >
                        <p className={`text-[9px] font-semibold uppercase tracking-wider mb-0.5 ${
                          msg.role === "user"
                            ? "text-emerald-500/70"
                            : "text-muted-foreground/50"
                        }`}>
                          {msg.role === "user" ? "You" : roleTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Section 6: Retry CTA ───────────────────────────────── */}
        <div className="space-y-2 pt-1">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-9"
            size="sm"
            onClick={onRetry}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={onNewScenario}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            New Scenario
          </Button>
        </div>

      </div>
    </motion.div>
  );
}
