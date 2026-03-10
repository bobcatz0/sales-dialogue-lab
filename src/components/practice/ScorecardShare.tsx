import { useState, useCallback } from "react";
import { Share2, Download, Check, Copy, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Feedback, RubricScore, FrameworkId } from "./types";
import { loadHistory } from "./sessionStorage";

const FRAMEWORK_LABELS: Record<string, string> = {
  star: "STAR Method",
  bant: "BANT Framework",
  meddic: "MEDDIC Framework",
  spin: "SPIN Selling",
};

function computePercentile(score: number): number {
  const sessions = loadHistory();
  if (sessions.length < 2) return 99;
  const below = sessions.filter((s) => s.score < score).length;
  return Math.max(1, Math.min(99, Math.round((below / sessions.length) * 100)));
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface ScorecardShareProps {
  feedback: Feedback;
  scenarioTitle: string;
  alias: string | null;
  isValidSession: boolean;
}

export function ScorecardShare({ feedback, scenarioTitle, alias, isValidSession }: ScorecardShareProps) {
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const frameworkLabel = feedback.frameworkId && feedback.frameworkId !== "none"
    ? FRAMEWORK_LABELS[feedback.frameworkId] || feedback.frameworkId.toUpperCase()
    : null;
  const percentile = computePercentile(feedback.score);
  const rubric = feedback.rubricScores || [];

  const handleCopyText = useCallback(() => {
    const lines = [
      `SalesCalls.io Scorecard`,
      `${scenarioTitle}`,
      frameworkLabel ? `Framework: ${frameworkLabel}` : null,
      ``,
      `Score: ${feedback.score} / 100`,
      `Top ${100 - percentile}%`,
      ``,
      ...rubric.map((r) => `${r.criterion}: ${r.score} / 100`),
      ``,
      alias ? `— ${alias}` : null,
      `Practice real sales scenarios at salescalls.io`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      toast("Scorecard copied to clipboard.", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Failed to copy."));
  }, [feedback, scenarioTitle, frameworkLabel, percentile, rubric, alias]);

  const handleDownloadImage = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      const width = 600;
      const height = 520 + rubric.length * 40;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = "#0f1117";
      ctx.roundRect(0, 0, width, height, 16);
      ctx.fill();

      // Accent bar
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#6366f1");
      gradient.addColorStop(1, "#8b5cf6");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 4);

      // Brand
      ctx.fillStyle = "#6366f1";
      ctx.font = "700 14px 'Inter', system-ui, sans-serif";
      ctx.fillText("SalesCalls.io Scorecard", 32, 40);

      // Date
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 11px 'Inter', system-ui, sans-serif";
      ctx.fillText(formatDate(), 32, 58);

      // Scenario title
      ctx.fillStyle = "#f9fafb";
      ctx.font = "600 20px 'Inter', system-ui, sans-serif";
      ctx.fillText(scenarioTitle, 32, 96);

      // Framework badge
      if (frameworkLabel) {
        ctx.fillStyle = "#1e1b4b";
        ctx.roundRect(32, 108, ctx.measureText(frameworkLabel).width + 20, 24, 6);
        ctx.fill();
        ctx.fillStyle = "#a5b4fc";
        ctx.font = "600 11px 'Inter', system-ui, sans-serif";
        ctx.fillText(frameworkLabel, 42, 124);
      }

      // Score
      let y = frameworkLabel ? 170 : 140;
      ctx.fillStyle = "#f9fafb";
      ctx.font = "700 64px 'Inter', system-ui, sans-serif";
      ctx.fillText(`${feedback.score}`, 32, y);
      const scoreWidth = ctx.measureText(`${feedback.score}`).width;
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 24px 'Inter', system-ui, sans-serif";
      ctx.fillText("/ 100", 32 + scoreWidth + 8, y);

      // Percentile
      y += 30;
      ctx.fillStyle = "#10b981";
      ctx.font = "600 16px 'Inter', system-ui, sans-serif";
      ctx.fillText(`Top ${100 - percentile}%`, 32, y);

      // Divider
      y += 20;
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(32, y, width - 64, 1);
      y += 24;

      // Subscores
      if (rubric.length > 0) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "600 11px 'Inter', system-ui, sans-serif";
        ctx.fillText("BREAKDOWN", 32, y);
        y += 20;

        rubric.forEach((r) => {
          // Bar background
          ctx.fillStyle = "#1f2937";
          ctx.roundRect(32, y, width - 64, 8, 4);
          ctx.fill();
          // Bar fill
          const barWidth = ((width - 64) * r.score) / 100;
          const barGrad = ctx.createLinearGradient(32, 0, 32 + barWidth, 0);
          barGrad.addColorStop(0, "#6366f1");
          barGrad.addColorStop(1, "#8b5cf6");
          ctx.fillStyle = barGrad;
          ctx.roundRect(32, y, barWidth, 8, 4);
          ctx.fill();
          y += 16;

          // Label + score
          ctx.fillStyle = "#d1d5db";
          ctx.font = "400 12px 'Inter', system-ui, sans-serif";
          ctx.fillText(r.criterion, 32, y);
          ctx.fillStyle = "#f9fafb";
          ctx.font = "600 12px 'Inter', system-ui, sans-serif";
          const scoreText = `${r.score}`;
          ctx.fillText(scoreText, width - 32 - ctx.measureText(scoreText).width, y);
          y += 24;
        });
      }

      // Alias
      if (alias) {
        y += 8;
        ctx.fillStyle = "#6b7280";
        ctx.font = "500 12px 'Inter', system-ui, sans-serif";
        ctx.fillText(`— ${alias}`, 32, y);
      }

      // Footer
      ctx.fillStyle = "#4b5563";
      ctx.font = "400 10px 'Inter', system-ui, sans-serif";
      ctx.fillText("salescalls.io — Practice real sales scenarios", 32, height - 20);

      const link = document.createElement("a");
      link.download = `scorecard-${feedback.score}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("Scorecard image downloaded.", { duration: 2000 });
    } catch {
      toast.error("Failed to generate image.");
    }
  }, [feedback, scenarioTitle, frameworkLabel, percentile, rubric, alias]);

  if (!isValidSession) return null;

  return (
    <div className="space-y-3">
      {!showCard ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs text-muted-foreground gap-1.5"
          onClick={() => setShowCard(true)}
        >
          <Trophy className="h-3.5 w-3.5" />
          View Scorecard
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Preview Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
            <div className="p-5 space-y-4">
              {/* Header */}
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  SalesCalls.io Scorecard
                </p>
                <p className="text-[10px] text-muted-foreground">{formatDate()}</p>
              </div>

              {/* Scenario + Framework */}
              <div>
                <p className="text-sm font-bold text-foreground">{scenarioTitle}</p>
                {frameworkLabel && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5">
                    {frameworkLabel}
                  </span>
                )}
              </div>

              {/* Score + Percentile */}
              <div className="flex items-baseline gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-heading text-foreground">{feedback.score}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <span className="text-sm font-semibold text-green-500">
                  Top {100 - percentile}%
                </span>
              </div>

              {/* Subscores */}
              {rubric.length > 0 && (
                <div className="border-t border-border pt-3 space-y-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Breakdown
                  </p>
                  {rubric.map((r, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{r.criterion}</span>
                        <span className="text-[11px] font-medium text-foreground tabular-nums">{r.score}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${r.score}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alias + branding */}
              {alias && (
                <p className="text-[11px] text-muted-foreground">— {alias}</p>
              )}
              <p className="text-[9px] text-muted-foreground/50">
                salescalls.io — Practice real sales scenarios
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={handleCopyText}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Share Result"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={handleDownloadImage}
            >
              <Download className="h-3 w-3" />
              Download Image
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
