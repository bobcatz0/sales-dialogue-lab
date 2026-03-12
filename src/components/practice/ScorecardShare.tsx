import { useState, useCallback } from "react";
import { Share2, Download, Check, Copy, Trophy, Linkedin, ExternalLink, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Feedback, FrameworkId } from "./types";
import { loadHistory } from "./sessionStorage";
import { getEloRank } from "@/lib/elo";

const DISCORD_WEBHOOK_KEY = "salescalls_discord_webhook";
const DISCORD_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-webhook`;

function loadDiscordWebhook(): string {
  try { return localStorage.getItem(DISCORD_WEBHOOK_KEY) || ""; } catch { return ""; }
}
function saveDiscordWebhook(url: string) {
  try { localStorage.setItem(DISCORD_WEBHOOK_KEY, url); } catch { /* ignore */ }
}

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
  elo?: number | null;
  eloDelta?: number | null;
}

function ConfettiBurst() {
  const particles = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 80 + Math.random() * 160;
    const colors = ["hsl(var(--primary))", "#facc15", "#f97316", "#ec4899", "#8b5cf6", "#22d3ee"];
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 40,
      rotation: Math.random() * 720 - 360,
      color: colors[i % colors.length],
      size: 4 + Math.random() * 5,
      delay: Math.random() * 0.15,
      shape: i % 3, // 0=square, 1=circle, 2=rect
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: "50%", y: "30%", scale: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: `calc(50% + ${p.x}px)`,
            y: `calc(30% + ${p.y}px)`,
            scale: [0, 1.2, 0.8],
            opacity: [1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: 1 + Math.random() * 0.4,
            delay: p.delay,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="absolute"
          style={{
            width: p.shape === 2 ? p.size * 1.8 : p.size,
            height: p.shape === 2 ? p.size * 0.6 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 1 ? "50%" : "1px",
          }}
        />
      ))}
    </div>
  );
}

export function ScorecardShare({ feedback, scenarioTitle, alias, isValidSession, elo, eloDelta }: ScorecardShareProps) {
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState(() => loadDiscordWebhook());
  const [showDiscordSetup, setShowDiscordSetup] = useState(false);
  const [discordInput, setDiscordInput] = useState(() => loadDiscordWebhook());
  const [discordSending, setDiscordSending] = useState(false);

  const frameworkLabel = feedback.frameworkId && feedback.frameworkId !== "none"
    ? FRAMEWORK_LABELS[feedback.frameworkId] || feedback.frameworkId.toUpperCase()
    : null;
  const percentile = computePercentile(feedback.score);
  const rubric = feedback.rubricScores || [];
  const rankTier = elo != null ? getEloRank(elo) : null;
  const topPercent = 100 - percentile;

  const shareUrl = "https://sales-dialogue-lab.lovable.app/scenarios";

  const shareText = [
    `🎯 Just scored ${feedback.score}/100 on "${scenarioTitle}"`,
    frameworkLabel ? `📋 ${frameworkLabel}` : null,
    `📊 Top ${topPercent}%`,
    elo != null ? `⚡ ELO: ${elo}${eloDelta != null ? ` (${eloDelta >= 0 ? "+" : ""}${eloDelta})` : ""} — ${rankTier}` : null,
    ``,
    `Practice sales scenarios at ${shareUrl}`,
  ].filter(Boolean).join("\n");

  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      toast("Scorecard copied — paste it anywhere!", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Failed to copy."));
  }, [shareText]);

  const handleShareLinkedIn = useCallback(() => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  }, []);

  const handleShareX = useCallback(() => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  }, [shareText]);

  const handleShareReddit = useCallback(() => {
    const url = `https://www.reddit.com/submit?title=${encodeURIComponent(`Scored ${feedback.score}/100 on "${scenarioTitle}" — SalesCalls.io`)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  }, [feedback.score, scenarioTitle]);

  const handleShareDiscord = useCallback(async () => {
    if (!discordWebhook) {
      setShowDiscordSetup(true);
      return;
    }
    setDiscordSending(true);
    try {
      const embed = {
        title: `🎯 ${scenarioTitle}`,
        description: [
          `**Score:** ${feedback.score}/100`,
          `**Percentile:** Top ${topPercent}%`,
          frameworkLabel ? `**Framework:** ${frameworkLabel}` : null,
          elo != null ? `**ELO:** ${elo}${eloDelta != null ? ` (${eloDelta >= 0 ? "+" : ""}${eloDelta})` : ""} — ${rankTier}` : null,
          alias ? `\n— ${alias}` : null,
        ].filter(Boolean).join("\n"),
        color: 0x22c55e,
        footer: { text: "SalesCalls.io — Practice real sales scenarios" },
        timestamp: new Date().toISOString(),
      };

      const resp = await fetch(DISCORD_FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ webhookUrl: discordWebhook, embeds: [embed] }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Discord share failed");
      }
      toast.success("Scorecard shared to Discord!", { duration: 2500 });
    } catch (e: any) {
      toast.error(e.message || "Failed to share to Discord.");
    } finally {
      setDiscordSending(false);
    }
  }, [discordWebhook, feedback, scenarioTitle, topPercent, frameworkLabel, elo, eloDelta, rankTier, alias]);

  const handleSaveDiscordWebhook = () => {
    const url = discordInput.trim();
    if (!url) {
      saveDiscordWebhook("");
      setDiscordWebhook("");
      setShowDiscordSetup(false);
      toast("Discord webhook removed.", { duration: 2000 });
      return;
    }
    const pattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!pattern.test(url)) {
      toast.error("Invalid Discord webhook URL. It should look like: https://discord.com/api/webhooks/123/abc-xyz");
      return;
    }
    saveDiscordWebhook(url);
    setDiscordWebhook(url);
    setShowDiscordSetup(false);
    toast.success("Discord webhook saved!", { duration: 2000 });
  };

  const handleDownloadImage = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      const width = 600;
      const hasElo = elo != null;
      const height = 460 + rubric.length * 40 + (hasElo ? 50 : 0);
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = "#0d1117";
      ctx.roundRect(0, 0, width, height, 16);
      ctx.fill();

      // Accent gradient bar
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "#22c55e");
      grad.addColorStop(1, "#16a34a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 4);

      // Brand
      ctx.fillStyle = "#22c55e";
      ctx.font = "700 14px 'Inter', system-ui, sans-serif";
      ctx.fillText("SalesCalls.io", 32, 40);

      // Date
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 11px 'Inter', system-ui, sans-serif";
      ctx.fillText(formatDate(), 32, 58);

      // Scenario title
      ctx.fillStyle = "#f9fafb";
      ctx.font = "600 20px 'Inter', system-ui, sans-serif";
      ctx.fillText(scenarioTitle, 32, 96);

      // Framework badge
      let y = 96;
      if (frameworkLabel) {
        y += 12;
        ctx.fillStyle = "#14532d";
        const tw = ctx.measureText(frameworkLabel).width + 20;
        ctx.roundRect(32, y, tw, 24, 6);
        ctx.fill();
        ctx.fillStyle = "#86efac";
        ctx.font = "600 11px 'Inter', system-ui, sans-serif";
        ctx.fillText(frameworkLabel, 42, y + 16);
        y += 36;
      } else {
        y += 20;
      }

      // Score
      y += 16;
      ctx.fillStyle = "#f9fafb";
      ctx.font = "700 64px 'Inter', system-ui, sans-serif";
      ctx.fillText(`${feedback.score}`, 32, y);
      const sw = ctx.measureText(`${feedback.score}`).width;
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 24px 'Inter', system-ui, sans-serif";
      ctx.fillText("/ 100", 32 + sw + 8, y);

      // Rank + Percentile row
      y += 28;
      ctx.fillStyle = "#22c55e";
      ctx.font = "600 14px 'Inter', system-ui, sans-serif";
      ctx.fillText(`${feedback.rank}`, 32, y);
      const rankW = ctx.measureText(feedback.rank).width;
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 14px 'Inter', system-ui, sans-serif";
      ctx.fillText("  ·  ", 32 + rankW, y);
      ctx.fillStyle = "#22c55e";
      ctx.fillText(`Top ${topPercent}%`, 32 + rankW + 30, y);

      // ELO row
      if (hasElo) {
        y += 28;
        ctx.fillStyle = "#f9fafb";
        ctx.font = "700 18px 'Inter', system-ui, sans-serif";
        ctx.fillText(`⚡ ${elo} ELO`, 32, y);
        if (eloDelta != null) {
          const eloText = `⚡ ${elo} ELO`;
          const ew = ctx.measureText(eloText).width;
          ctx.fillStyle = eloDelta >= 0 ? "#22c55e" : "#ef4444";
          ctx.font = "600 14px 'Inter', system-ui, sans-serif";
          ctx.fillText(`${eloDelta >= 0 ? "+" : ""}${eloDelta}`, 32 + ew + 8, y);
        }
        if (rankTier) {
          const fullText = `⚡ ${elo} ELO${eloDelta != null ? ` ${eloDelta >= 0 ? "+" : ""}${eloDelta}` : ""}`;
          const fullW = ctx.measureText(fullText).width + 16;
          ctx.fillStyle = "#9ca3af";
          ctx.font = "500 14px 'Inter', system-ui, sans-serif";
          ctx.fillText(`— ${rankTier}`, 32 + fullW + 12, y);
        }
      }

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
          ctx.fillStyle = "#1f2937";
          ctx.roundRect(32, y, width - 64, 8, 4);
          ctx.fill();
          const barW = ((width - 64) * r.score) / 100;
          const barGrad = ctx.createLinearGradient(32, 0, 32 + barW, 0);
          barGrad.addColorStop(0, "#22c55e");
          barGrad.addColorStop(1, "#16a34a");
          ctx.fillStyle = barGrad;
          ctx.roundRect(32, y, barW, 8, 4);
          ctx.fill();
          y += 16;

          ctx.fillStyle = "#d1d5db";
          ctx.font = "400 12px 'Inter', system-ui, sans-serif";
          ctx.fillText(r.criterion, 32, y);
          ctx.fillStyle = "#f9fafb";
          ctx.font = "600 12px 'Inter', system-ui, sans-serif";
          const st = `${r.score}`;
          ctx.fillText(st, width - 32 - ctx.measureText(st).width, y);
          y += 24;
        });
      }

      // Alias
      if (alias) {
        y += 4;
        ctx.fillStyle = "#6b7280";
        ctx.font = "500 12px 'Inter', system-ui, sans-serif";
        ctx.fillText(`— ${alias}`, 32, y);
      }

      // Footer
      ctx.fillStyle = "#4b5563";
      ctx.font = "400 10px 'Inter', system-ui, sans-serif";
      ctx.fillText("salescalls.io — Practice real sales scenarios", 32, height - 20);

      const link = document.createElement("a");
      link.download = `scorecard-${feedback.score}-elo${elo ?? ""}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("Scorecard image downloaded.", { duration: 2000 });
    } catch {
      toast.error("Failed to generate image.");
    }
  }, [feedback, scenarioTitle, frameworkLabel, percentile, rubric, alias, elo, eloDelta, rankTier, topPercent]);

  if (!isValidSession) return null;

  return (
    <div className="space-y-3">
      {!showCard ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs text-muted-foreground gap-1.5"
          onClick={() => {
            setShowCard(true);
            if (feedback.score >= 85) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 2000);
            }
          }}
        >
          <Trophy className="h-3.5 w-3.5" />
          View Scorecard
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 relative"
        >
          {showConfetti && <ConfettiBurst />}
          {/* Preview Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  SalesCalls.io Scorecard
                </p>
                <p className="text-[10px] text-muted-foreground">{formatDate()}</p>
              </div>

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
                <span className="text-sm font-semibold text-primary">
                  Top {topPercent}%
                </span>
              </div>

              {/* ELO + Rank Tier */}
              {elo != null && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold font-heading text-foreground">{elo}</span>
                    <span className="text-xs text-muted-foreground">ELO</span>
                    {eloDelta != null && (
                      <span className={`text-xs font-bold ${eloDelta >= 0 ? "text-primary" : "text-destructive"}`}>
                        {eloDelta >= 0 ? "+" : ""}{eloDelta}
                      </span>
                    )}
                  </div>
                  {rankTier && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {rankTier}
                    </span>
                  )}
                </div>
              )}

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
                          className={`h-full rounded-full ${
                            weakestSkill && r.criterion === weakestSkill.criterion
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Weakest Skill Callout */}
              {weakestSkill && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-1">
                    ⚠ Weakest Skill
                  </p>
                  <p className="text-xs font-semibold text-foreground">{weakestSkill.criterion}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Score: {weakestSkill.score}/100{weakestSkill.note ? ` — ${weakestSkill.note}` : ""}
                  </p>
                </div>
              )}

              {alias && (
                <p className="text-[11px] text-muted-foreground">— {alias}</p>
              )}
              <p className="text-[9px] text-muted-foreground/50">
                salescalls.io — Practice real sales scenarios
              </p>
            </div>
          </div>

          {/* Actions — Download + Copy */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={handleDownloadImage}
            >
              <Download className="h-3 w-3" />
              Download Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={handleCopyText}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy Text"}
            </Button>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] gap-1"
              onClick={handleShareLinkedIn}
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] gap-1"
              onClick={handleShareX}
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] gap-1"
              onClick={handleShareReddit}
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 0-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
              Reddit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 text-[10px] gap-1 ${discordWebhook ? "" : "border-dashed"}`}
              onClick={handleShareDiscord}
              disabled={discordSending}
            >
              {discordSending ? (
                <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
                </svg>
              )}
              Discord
            </Button>
          </div>

          {/* Discord Webhook Setup */}
          <AnimatePresence>
            {showDiscordSetup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card-elevated p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-foreground">Discord Webhook</p>
                    <button
                      onClick={() => setShowDiscordSetup(false)}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Paste your Discord channel webhook URL. Get it from Server Settings → Integrations → Webhooks.
                  </p>
                  <Input
                    value={discordInput}
                    onChange={(e) => setDiscordInput(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={handleSaveDiscordWebhook}>
                      Save & Share
                    </Button>
                    {discordWebhook && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] text-destructive"
                        onClick={() => {
                          setDiscordInput("");
                          saveDiscordWebhook("");
                          setDiscordWebhook("");
                          setShowDiscordSetup(false);
                          toast("Discord webhook removed.", { duration: 2000 });
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Discord webhook gear icon */}
          {discordWebhook && !showDiscordSetup && (
            <button
              onClick={() => setShowDiscordSetup(true)}
              className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1 transition-colors mx-auto"
            >
              <Settings2 className="h-2.5 w-2.5" />
              Configure Discord webhook
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
