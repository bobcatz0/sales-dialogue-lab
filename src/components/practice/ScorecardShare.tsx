import { useState, useCallback, useEffect } from "react";
import { Share2, Download, Check, Copy, Trophy, Linkedin, ExternalLink, Settings2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Feedback, FrameworkId } from "./types";
import { loadHistory } from "./sessionStorage";
import { getEloRank } from "@/lib/elo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, profile } = useAuth();
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState(() => loadDiscordWebhook());
  const [showDiscordSetup, setShowDiscordSetup] = useState(false);
  const [discordInput, setDiscordInput] = useState(() => loadDiscordWebhook());
  const [discordSending, setDiscordSending] = useState(false);
  const [scorecardId, setScorecardId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const frameworkLabel = feedback.frameworkId && feedback.frameworkId !== "none"
    ? FRAMEWORK_LABELS[feedback.frameworkId] || feedback.frameworkId.toUpperCase()
    : null;
  const percentile = computePercentile(feedback.score);
  const rubric = feedback.rubricScores || [];
  const weakestSkill = rubric.length > 0
    ? rubric.reduce((min, r) => r.score < min.score ? r : min, rubric[0])
    : null;
  const rankTier = elo != null ? getEloRank(elo) : null;
  const topPercent = 100 - percentile;

  const scorecardUrl = scorecardId
    ? `${window.location.origin}/scorecard/${scorecardId}`
    : null;
  const shareUrl = scorecardUrl || "https://sales-dialogue-lab.lovable.app/scenarios";

  // Save scorecard to DB when card is first shown
  const saveScorecard = useCallback(async () => {
    if (scorecardId || saving || !user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("scorecards")
        .insert({
          user_id: user.id,
          score: feedback.score,
          rank: feedback.rank,
          percentile,
          scenario_title: scenarioTitle,
          framework_id: feedback.frameworkId || null,
          rubric_scores: rubric as any,
          strengths: feedback.strengths as any,
          improvements: feedback.improvements as any,
          best_moment: feedback.bestMoment || null,
          elo: elo ?? null,
          elo_delta: eloDelta ?? null,
          alias: alias || null,
          display_name: profile?.display_name || "Anonymous",
          avatar_url: profile?.avatar_url || null,
        })
        .select("id")
        .single();

      if (data) setScorecardId(data.id);
    } catch {
      // Non-critical — sharing still works without saved scorecard
    } finally {
      setSaving(false);
    }
  }, [scorecardId, saving, user, feedback, scenarioTitle, percentile, rubric, elo, eloDelta, alias, profile]);

  const shareText = [
    `🎯 Just scored ${feedback.score}/100 on "${scenarioTitle}"`,
    frameworkLabel ? `📋 ${frameworkLabel}` : null,
    `📊 Top ${topPercent}%`,
    elo != null ? `⚡ ELO: ${elo}${eloDelta != null ? ` (${eloDelta >= 0 ? "+" : ""}${eloDelta})` : ""} — ${rankTier}` : null,
    weakestSkill ? `⚠️ Focus area: ${weakestSkill.criterion} (${weakestSkill.score}/100)` : null,
    ``,
    `Practice sales scenarios at ${shareUrl}`,
  ].filter(Boolean).join("\n");

  const handleCopyLink = useCallback(() => {
    if (!scorecardUrl) return;
    navigator.clipboard.writeText(scorecardUrl).then(() => {
      setLinkCopied(true);
      toast("Scorecard link copied!", { duration: 2000 });
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => toast.error("Failed to copy link."));
  }, [scorecardUrl]);

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

  const handleCopyImage = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      const width = 600;
      const hasElo = elo != null;
      const height = 460 + rubric.length * 40 + (hasElo ? 50 : 0) + (weakestSkill ? 60 : 0);
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);
      ctx.fillStyle = "#0d1117";
      ctx.roundRect(0, 0, width, height, 16);
      ctx.fill();

      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "#22c55e");
      grad.addColorStop(1, "#16a34a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 4);

      ctx.fillStyle = "#22c55e";
      ctx.font = "700 14px 'Inter', system-ui, sans-serif";
      ctx.fillText("SalesCalls.io Scorecard", 32, 40);

      ctx.fillStyle = "#f9fafb";
      ctx.font = "600 20px 'Inter', system-ui, sans-serif";
      ctx.fillText(scenarioTitle, 32, 76);

      let y = 76;
      if (frameworkLabel) {
        y += 24;
        ctx.fillStyle = "#14532d";
        const tw = ctx.measureText(frameworkLabel).width + 20;
        ctx.roundRect(32, y - 12, tw, 22, 6);
        ctx.fill();
        ctx.fillStyle = "#86efac";
        ctx.font = "600 11px 'Inter', system-ui, sans-serif";
        ctx.fillText(frameworkLabel, 42, y + 2);
        y += 24;
      } else {
        y += 20;
      }

      y += 16;
      ctx.fillStyle = "#f9fafb";
      ctx.font = "700 56px 'Inter', system-ui, sans-serif";
      ctx.fillText(`${feedback.score}`, 32, y);
      const sw = ctx.measureText(`${feedback.score}`).width;
      ctx.fillStyle = "#6b7280";
      ctx.font = "400 22px 'Inter', system-ui, sans-serif";
      ctx.fillText("/ 100", 32 + sw + 8, y);

      y += 24;
      ctx.fillStyle = "#22c55e";
      ctx.font = "600 14px 'Inter', system-ui, sans-serif";
      ctx.fillText(`${feedback.rank}  ·  Top ${topPercent}%`, 32, y);

      if (hasElo) {
        y += 24;
        ctx.fillStyle = "#f9fafb";
        ctx.font = "700 16px 'Inter', system-ui, sans-serif";
        ctx.fillText(`⚡ ${elo} ELO`, 32, y);
      }

      if (weakestSkill) {
        y += 28;
        ctx.fillStyle = "#7f1d1d";
        ctx.roundRect(32, y - 14, width - 64, 44, 8);
        ctx.fill();
        ctx.fillStyle = "#fca5a5";
        ctx.font = "600 10px 'Inter', system-ui, sans-serif";
        ctx.fillText("⚠ WEAKEST SKILL", 44, y);
        ctx.fillStyle = "#fef2f2";
        ctx.font = "600 13px 'Inter', system-ui, sans-serif";
        ctx.fillText(`${weakestSkill.criterion}: ${weakestSkill.score}/100`, 44, y + 18);
      }

      ctx.fillStyle = "#4b5563";
      ctx.font = "400 10px 'Inter', system-ui, sans-serif";
      ctx.fillText("salescalls.io — Practice real sales scenarios", 32, height - 20);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setImageCopied(true);
          toast.success("Scorecard image copied to clipboard!", { duration: 2500 });
          setTimeout(() => setImageCopied(false), 2500);
        } catch {
          // Fallback to download
          const link = document.createElement("a");
          link.download = `scorecard-${feedback.score}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          toast("Clipboard not supported — image downloaded instead.", { duration: 2500 });
        }
      }, "image/png");
    } catch {
      toast.error("Failed to generate image.");
    }
  }, [feedback, scenarioTitle, frameworkLabel, rubric, alias, elo, eloDelta, rankTier, topPercent, weakestSkill]);

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
            saveScorecard();
            if (feedback.score >= 85) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 2000);
            }
          }}
        >
          <Trophy className="h-3.5 w-3.5" />
          View Scorecard
        </Button>
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

          {/* Primary Share Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              className="h-9 text-xs gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white"
              onClick={handleShareLinkedIn}
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs gap-1.5 bg-foreground hover:bg-foreground/90 text-background"
              onClick={handleShareX}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter / X
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1.5"
              onClick={handleCopyImage}
            >
              {imageCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {imageCopied ? "Copied!" : "Copy Image"}
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={handleDownloadImage}
            >
              <Download className="h-3 w-3" />
              Download
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

          {/* More Sharing */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] gap-1"
              onClick={handleShareReddit}
            >
              <ExternalLink className="h-3 w-3" />
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
                <ExternalLink className="h-3 w-3" />
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
