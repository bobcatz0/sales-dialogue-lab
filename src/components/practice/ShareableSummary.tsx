import { useState, useRef, useCallback } from "react";
import { Copy, Download, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Feedback } from "./types";

interface ShareableSummaryProps {
  feedback: Feedback;
  alias: string | null;
  isValidSession: boolean;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildLinkedInText(feedback: Feedback, alias: string | null): string {
  const name = alias || "Anonymous";
  const lines = [
    `Completed a mock SDR interview simulation today.`,
    ``,
    `Interview Readiness Score: ${feedback.score}/100`,
    `Peak Pressure Level: ${feedback.peakDifficulty ?? 1}`,
    feedback.strengths[0] ? `Strength: ${feedback.strengths[0]}` : null,
    feedback.improvements[0] ? `Focus Area: ${feedback.improvements[0]}` : null,
    ``,
    `Practicing structured communication under pressure.`,
    ``,
    `— ${name}`,
    `Generated via SalesCalls Practice Simulator`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function ShareableSummary({ feedback, alias, isValidSession }: ShareableSummaryProps) {
  const [copied, setCopied] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopyText = useCallback(() => {
    const text = buildLinkedInText(feedback, alias);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast("Summary copied to clipboard.", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy. Please try again.");
    });
  }, [feedback, alias]);

  const handleDownloadImage = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      const width = 600;
      const height = 420;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.roundRect(0, 0, width, height, 12);
      ctx.fill();

      // Border
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.roundRect(0, 0, width, height, 12);
      ctx.stroke();

      // Title
      ctx.fillStyle = "#111827";
      ctx.font = "600 18px 'Inter', system-ui, sans-serif";
      ctx.fillText("Interview Readiness Summary", 32, 44);

      // Date
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 12px 'Inter', system-ui, sans-serif";
      ctx.fillText(formatDate(), 32, 64);

      // Divider
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(32, 78, width - 64, 1);

      // Score
      ctx.fillStyle = "#111827";
      ctx.font = "700 48px 'Inter', system-ui, sans-serif";
      ctx.fillText(`${feedback.score}`, 32, 138);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "400 18px 'Inter', system-ui, sans-serif";
      ctx.fillText("/100", 32 + ctx.measureText(`${feedback.score}`).width + 4, 138);

      // Rank + Difficulty
      ctx.fillStyle = "#374151";
      ctx.font = "500 14px 'Inter', system-ui, sans-serif";
      ctx.fillText(`${feedback.rank}  ·  Pressure Level ${feedback.peakDifficulty ?? 1}`, 32, 162);

      // Divider
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(32, 178, width - 64, 1);

      // Strengths
      ctx.fillStyle = "#111827";
      ctx.font = "600 13px 'Inter', system-ui, sans-serif";
      ctx.fillText("Strengths", 32, 204);

      ctx.fillStyle = "#4b5563";
      ctx.font = "400 12px 'Inter', system-ui, sans-serif";
      let y = 222;
      feedback.strengths.forEach((s) => {
        const text = `✓  ${s}`;
        // Word wrap
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > width - 64) {
            ctx.fillText(line.trim(), 32, y);
            y += 17;
            line = word + " ";
          } else {
            line = test;
          }
        }
        if (line.trim()) {
          ctx.fillText(line.trim(), 32, y);
          y += 22;
        }
      });

      // Improvement
      y += 4;
      ctx.fillStyle = "#111827";
      ctx.font = "600 13px 'Inter', system-ui, sans-serif";
      ctx.fillText("Development Area", 32, y);
      y += 18;

      ctx.fillStyle = "#4b5563";
      ctx.font = "400 12px 'Inter', system-ui, sans-serif";
      if (feedback.improvements[0]) {
        const text = `→  ${feedback.improvements[0]}`;
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > width - 64) {
            ctx.fillText(line.trim(), 32, y);
            y += 17;
            line = word + " ";
          } else {
            line = test;
          }
        }
        if (line.trim()) {
          ctx.fillText(line.trim(), 32, y);
        }
      }

      // Alias
      if (alias) {
        ctx.fillStyle = "#374151";
        ctx.font = "500 12px 'Inter', system-ui, sans-serif";
        ctx.fillText(`— ${alias}`, 32, height - 44);
      }

      // Footer
      ctx.fillStyle = "#9ca3af";
      ctx.font = "400 10px 'Inter', system-ui, sans-serif";
      ctx.fillText("Generated via SalesCalls Practice Simulator", 32, height - 20);

      // Download
      const link = document.createElement("a");
      link.download = `interview-readiness-${feedback.score}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast("Image downloaded.", { duration: 2000 });
    } catch {
      toast.error("Failed to generate image.");
    }
  }, [feedback, alias]);

  if (!isValidSession) return null;

  return (
    <div className="space-y-3">
      {!showCard ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs text-muted-foreground"
          onClick={() => setShowCard(true)}
        >
          <Share2 className="h-3 w-3 mr-1.5" />
          Generate Interview Readiness Summary
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Preview card */}
          <div
            ref={cardRef}
            className="rounded-lg border border-border bg-card p-5 space-y-3"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Interview Readiness Summary</p>
              <p className="text-[10px] text-muted-foreground">{formatDate()}</p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-heading text-foreground">{feedback.score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {feedback.rank} · Pressure Level {feedback.peakDifficulty ?? 1}
            </p>

            <div className="border-t border-border pt-3 space-y-2">
              <div>
                <p className="text-[10px] font-semibold text-foreground mb-1">Strengths</p>
                {feedback.strengths.map((s, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground leading-snug">✓ {s}</p>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-foreground mb-1">Development Area</p>
                {feedback.improvements.slice(0, 1).map((s, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground leading-snug">→ {s}</p>
                ))}
              </div>
            </div>

            {alias && (
              <p className="text-[11px] text-muted-foreground pt-1">— {alias}</p>
            )}
            <p className="text-[9px] text-muted-foreground/60 pt-1">
              Generated via SalesCalls Practice Simulator
            </p>
          </div>

          {/* Share actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleCopyText}
            >
              {copied ? <Check className="h-3 w-3 mr-1.5" /> : <Copy className="h-3 w-3 mr-1.5" />}
              {copied ? "Copied" : "Copy for LinkedIn"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleDownloadImage}
            >
              <Download className="h-3 w-3 mr-1.5" />
              Download Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
