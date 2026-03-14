import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, Copy, Check, Linkedin, ExternalLink, Trophy, Swords, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareResultCardProps {
  scenarioTitle: string;
  score: number;
  rank: string;
  percentile?: number | null;
  eloDelta?: number | null;
  elo?: number | null;
  isBattle?: boolean;
  opponentScore?: number | null;
  won?: boolean;
  /** Optional URL that links to a public scorecard */
  scorecardUrl?: string | null;
}

function getRankAccent(rank: string): string {
  switch (rank) {
    case "Sales Architect": return "#a855f7";
    case "Rainmaker": return "#facc15";
    case "Operator": return "#3b82f6";
    case "Closer": return "#22c55e";
    case "Prospector": return "#f97316";
    default: return "#6b7280";
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const test = currentLine + (currentLine ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 2);
}

function generateShareCanvas(props: ShareResultCardProps): HTMLCanvasElement {
  const { scenarioTitle, score, rank, percentile, eloDelta, elo, isBattle, opponentScore, won } = props;
  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 480;
  const height = isBattle ? 340 : 300;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  const accent = getRankAccent(rank);
  const topPercent = percentile != null ? Math.max(1, 100 - percentile) : null;

  // Background
  ctx.fillStyle = "#0d1117";
  ctx.roundRect(0, 0, width, height, 16);
  ctx.fill();

  // Top accent bar
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, `${accent}88`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 4);

  // Brand
  ctx.fillStyle = "#22c55e";
  ctx.font = "700 13px 'Inter', system-ui, sans-serif";
  ctx.fillText("SalesCalls.io", 28, 34);

  // Battle badge
  if (isBattle) {
    ctx.fillStyle = "#1e293b";
    ctx.roundRect(width - 120, 18, 92, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#f97316";
    ctx.font = "700 10px 'Inter', system-ui, sans-serif";
    ctx.fillText("⚔ 1v1 BATTLE", width - 110, 34);
  }

  // Scenario title
  ctx.fillStyle = "#f9fafb";
  ctx.font = "600 18px 'Inter', system-ui, sans-serif";
  const titleLines = wrapText(ctx, scenarioTitle, width - 56);
  let y = 64;
  titleLines.forEach(line => {
    ctx.fillText(line, 28, y);
    y += 22;
  });

  y += 8;

  // Score
  ctx.fillStyle = "#f9fafb";
  ctx.font = "700 56px 'Inter', system-ui, sans-serif";
  ctx.fillText(`${score}`, 28, y + 48);
  const sw = ctx.measureText(`${score}`).width;
  ctx.fillStyle = "#6b7280";
  ctx.font = "400 20px 'Inter', system-ui, sans-serif";
  ctx.fillText("/ 100", 28 + sw + 6, y + 48);

  // Percentile (right-aligned next to score)
  if (topPercent != null) {
    ctx.fillStyle = accent;
    ctx.font = "700 16px 'Inter', system-ui, sans-serif";
    const percText = `Top ${topPercent}%`;
    const percW = ctx.measureText(percText).width;
    ctx.fillText(percText, width - 28 - percW, y + 48);
  }

  // Rank badge
  const rankY = y + 64;
  ctx.fillStyle = `${accent}22`;
  const rankText = rank;
  ctx.font = "700 12px 'Inter', system-ui, sans-serif";
  const rankW = ctx.measureText(rankText).width + 20;
  ctx.roundRect(28, rankY, rankW, 24, 6);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillText(rankText, 38, rankY + 16);

  // ELO delta
  if (eloDelta != null) {
    const eloText = `${eloDelta >= 0 ? "+" : ""}${eloDelta} ELO`;
    ctx.fillStyle = eloDelta >= 0 ? "#22c55e" : "#ef4444";
    ctx.font = "700 14px 'Inter', system-ui, sans-serif";
    ctx.fillText(eloText, 28 + rankW + 12, rankY + 16);

    if (elo != null) {
      const eloW = ctx.measureText(eloText).width;
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 12px 'Inter', system-ui, sans-serif";
      ctx.fillText(`(${elo} ELO)`, 28 + rankW + 12 + eloW + 8, rankY + 16);
    }
  }

  // Battle opponent score
  if (isBattle && opponentScore != null) {
    const battleY = rankY + 36;
    ctx.fillStyle = "#1f2937";
    ctx.roundRect(28, battleY, width - 56, 36, 8);
    ctx.fill();

    ctx.fillStyle = won ? "#22c55e" : "#ef4444";
    ctx.font = "700 13px 'Inter', system-ui, sans-serif";
    ctx.fillText(won ? "🏆 VICTORY" : "DEFEATED", 40, battleY + 23);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "400 12px 'Inter', system-ui, sans-serif";
    ctx.fillText(`You: ${score}  vs  Opponent: ${opponentScore}`, 160, battleY + 23);
  }

  // Footer
  ctx.fillStyle = "#4b5563";
  ctx.font = "400 10px 'Inter', system-ui, sans-serif";
  ctx.fillText("salescalls.io — Practice real sales scenarios", 28, height - 16);

  return canvas;
}

export function ShareResultCard(props: ShareResultCardProps) {
  const { scenarioTitle, score, rank, percentile, eloDelta, elo, isBattle, opponentScore, won, scorecardUrl } = props;
  const [showCard, setShowCard] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = scorecardUrl || "https://sales-dialogue-lab.lovable.app/scenarios";
  const topPercent = percentile != null ? Math.max(1, 100 - percentile) : null;

  const shareText = [
    isBattle
      ? `⚔ ${won ? "Won" : "Lost"} a 1v1 Sales Battle!`
      : `🎯 Scored ${score}/100 on "${scenarioTitle}"`,
    `📊 Rank: ${rank}`,
    topPercent != null ? `🏆 Top ${topPercent}%` : null,
    eloDelta != null ? `⚡ ${eloDelta >= 0 ? "+" : ""}${eloDelta} ELO` : null,
    isBattle && opponentScore != null ? `vs opponent's ${opponentScore}` : null,
    ``,
    `Practice sales scenarios at ${shareUrl}`,
  ].filter(Boolean).join("\n");

  const handleDownload = useCallback(() => {
    try {
      const canvas = generateShareCanvas(props);
      const link = document.createElement("a");
      link.download = `salescalls-${isBattle ? "battle" : "score"}-${score}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("Result card downloaded!", { duration: 2000 });
    } catch {
      toast.error("Failed to generate image.");
    }
  }, [props, score, isBattle]);

  const handleCopyImage = useCallback(async () => {
    try {
      const canvas = generateShareCanvas(props);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(), "image/png");
      });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setImageCopied(true);
      toast("Image copied to clipboard!", { duration: 2000 });
      setTimeout(() => setImageCopied(false), 2000);
    } catch {
      toast.error("Failed to copy image. Try downloading instead.");
    }
  }, [props]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      toast("Public link copied!", { duration: 2000 });
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [shareUrl]);

  const handleShareLinkedIn = useCallback(() => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank", "noopener,noreferrer,width=600,height=600"
    );
  }, [shareUrl]);

  const handleShareX = useCallback(() => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank", "noopener,noreferrer,width=600,height=600"
    );
  }, [shareText]);

  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(shareText).then(() => {
      toast("Share text copied!", { duration: 2000 });
    });
  }, [shareText]);

  return (
    <div className="space-y-2">
      {!showCard ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs gap-1.5"
          onClick={() => setShowCard(true)}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share Result
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Preview card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
              <div className="p-4 space-y-3">
                {/* Brand */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">SalesCalls.io</span>
                  {isBattle && (
                    <span className="text-[10px] font-bold text-accent-foreground bg-accent/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Swords className="h-2.5 w-2.5" /> 1v1 Battle
                    </span>
                  )}
                </div>

                {/* Scenario */}
                <p className="text-sm font-bold text-foreground">{scenarioTitle}</p>

                {/* Score + Percentile */}
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-heading text-foreground">{score}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  {topPercent != null && (
                    <span className="text-sm font-bold text-primary">
                      Top {topPercent}%
                    </span>
                  )}
                </div>

                {/* Rank + ELO */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {rank}
                  </span>
                  {eloDelta != null && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      eloDelta >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    }`}>
                      {eloDelta >= 0 ? "+" : ""}{eloDelta} ELO
                    </span>
                  )}
                  {elo != null && (
                    <span className="text-[10px] text-muted-foreground">{elo} ELO</span>
                  )}
                </div>

                {/* Battle result */}
                {isBattle && opponentScore != null && (
                  <div className={`rounded-lg p-2.5 border text-center ${
                    won ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
                  }`}>
                    <div className="flex items-center justify-center gap-1.5">
                      {won && <Trophy className="h-3.5 w-3.5 text-primary" />}
                      <span className={`text-xs font-bold ${won ? "text-primary" : "text-destructive"}`}>
                        {won ? "VICTORY" : "DEFEATED"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      You: {score} vs Opponent: {opponentScore}
                    </p>
                  </div>
                )}

                <p className="text-[9px] text-muted-foreground/50">salescalls.io</p>
              </div>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={handleShareLinkedIn}>
                <Linkedin className="h-3 w-3" /> LinkedIn
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={handleShareX}>
                <ExternalLink className="h-3 w-3" /> X / Twitter
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={handleDownload}>
                <Download className="h-3 w-3" /> Download
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={handleCopyImage}>
                {imageCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {imageCopied ? "Copied!" : "Copy Image"}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full h-8 text-[11px] gap-1.5" onClick={handleCopyLink}>
              {linkCopied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              {linkCopied ? "Link Copied!" : "Copy Public Result Link"}
            </Button>
            <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] text-muted-foreground" onClick={handleCopyText}>
              <Copy className="h-2.5 w-2.5 mr-1" /> Copy share text for Discord
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
