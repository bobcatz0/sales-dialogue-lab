import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock, ChevronRight, Trophy, XCircle, Swords, CheckCircle2, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type SeriesEligibility,
  type PromotionSeries,
  SERIES_PASS_SCORE,
  SERIES_TOTAL_GAMES,
  SERIES_WINS_NEEDED,
  SERIES_COOLDOWN_ELO,
  getSeriesSlots,
} from "./promotionSeries";

// ── Series Progress Display ──

function SeriesProgressDots({ series }: { series: PromotionSeries }) {
  const slots = getSeriesSlots(series);

  return (
    <div className="flex items-center gap-1.5">
      {slots.map((slot, i) => (
        <motion.div
          key={i}
          initial={i === series.games.length - 1 ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all ${
            slot === "win"
              ? "border-green-500 bg-green-500/15"
              : slot === "loss"
              ? "border-destructive bg-destructive/10"
              : "border-border bg-muted/30"
          }`}
        >
          {slot === "win" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          ) : slot === "loss" ? (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <Circle className="h-3 w-3 text-muted-foreground/30" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Promotion Series Banner ──

interface PromotionSeriesBannerProps {
  eligibility: SeriesEligibility;
  onStartSeries: () => void;
  onContinueSeries: () => void;
}

export function PromotionSeriesBanner({ eligibility, onStartSeries, onContinueSeries }: PromotionSeriesBannerProps) {
  if (!eligibility.nextRank) return null;

  // Active series in progress
  if (eligibility.activeSeries) {
    const series = eligibility.activeSeries;
    const gamesLeft = SERIES_TOTAL_GAMES - series.games.length;
    const winsNeeded = SERIES_WINS_NEEDED - series.wins;

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card-elevated border-primary/30 p-4 mb-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 pointer-events-none" />

        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <Swords className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-xs font-bold text-primary">Promotion Series Active</span>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 h-[18px] border-primary/40 text-primary">
              {series.currentRank} → {series.targetRank}
            </Badge>
          </div>

          {/* Series dots */}
          <div className="flex items-center justify-between">
            <SeriesProgressDots series={series} />
            <div className="text-right">
              <p className="text-sm font-bold font-heading text-foreground">
                {series.wins}W - {series.losses}L
              </p>
              <p className="text-[10px] text-muted-foreground">
                {winsNeeded > 0 ? `${winsNeeded} more win${winsNeeded > 1 ? "s" : ""} needed` : "Promotion earned!"}
              </p>
            </div>
          </div>

          {/* Game scores */}
          {series.games.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {series.games.map((game, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    game.result === "win"
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  G{i + 1}: {game.score}
                </span>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={onContinueSeries}
            className="w-full h-8 text-xs font-bold gap-1.5"
          >
            <Swords className="h-3 w-3" />
            Play Game {series.games.length + 1} of {SERIES_TOTAL_GAMES}
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Cooldown state
  if (eligibility.inCooldown) {
    return (
      <div className="card-elevated border-border/50 p-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">Promotion Series Locked</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Earn <span className="font-bold text-foreground">{eligibility.cooldownEloRemaining} more ELO</span> before
          attempting another promotion series to <span className="font-semibold">{eligibility.nextRank}</span>.
        </p>
      </div>
    );
  }

  // Eligible to start
  if (eligibility.eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card-elevated border-primary/30 p-3 mb-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Zap className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-xs font-bold text-primary">Promotion Series Available</span>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 h-[18px] border-primary/40 text-primary">
              {eligibility.currentRank} → {eligibility.nextRank}
            </Badge>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed mb-2.5">
            Win <span className="font-bold text-foreground">{SERIES_WINS_NEEDED} out of {SERIES_TOTAL_GAMES}</span> scenarios 
            (score {SERIES_PASS_SCORE}+ each) to promote to{" "}
            <span className="font-semibold text-primary">{eligibility.nextRank}</span>.
          </p>

          {/* Preview dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({ length: SERIES_TOTAL_GAMES }).map((_, i) => (
              <div key={i} className="h-6 w-6 rounded-full border-2 border-border bg-muted/30 flex items-center justify-center">
                <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
              </div>
            ))}
          </div>

          <Button
            size="sm"
            onClick={onStartSeries}
            className="w-full h-8 text-xs font-bold gap-1.5"
          >
            <Swords className="h-3 w-3" />
            Start Promotion Series
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Not in zone — show progress
  if (eligibility.eloNeeded > 0 && eligibility.eloNeeded <= 100) {
    return (
      <div className="card-elevated border-border/30 p-2.5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Next promotion: <span className="font-semibold text-foreground">{eligibility.nextRank}</span>
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {eligibility.eloNeeded} ELO away
          </span>
        </div>
      </div>
    );
  }

  return null;
}

// ── Series Result Modal ──

interface SeriesResultModalProps {
  open: boolean;
  series: PromotionSeries | null;
  onClose: () => void;
}

export function SeriesResultModal({ open, series, onClose }: SeriesResultModalProps) {
  if (!series || series.status === "active") return null;

  const promoted = series.status === "promoted";
  const avgScore = series.games.length > 0
    ? Math.round(series.games.reduce((s, g) => s + g.score, 0) / series.games.length)
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="card-elevated p-6 max-w-sm w-full mx-4 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`h-14 w-14 rounded-full flex items-center justify-center mx-auto ${
                promoted ? "bg-primary/15" : "bg-destructive/10"
              }`}
            >
              {promoted ? (
                <Trophy className="h-7 w-7 text-primary" />
              ) : (
                <XCircle className="h-7 w-7 text-destructive" />
              )}
            </motion.div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                {promoted ? "Series Won!" : "Series Lost"}
              </p>
              <h3 className="font-heading text-xl font-bold text-foreground">
                {promoted ? `Promoted to ${series.targetRank}` : "Promotion Failed"}
              </h3>
            </div>

            {/* Series result dots */}
            <div className="flex items-center justify-center gap-1.5">
              <SeriesProgressDots series={series} />
            </div>

            <p className="text-lg font-bold font-heading text-foreground">
              {series.wins}W - {series.losses}L
            </p>

            {/* Individual game scores */}
            <div className="flex gap-1.5 justify-center flex-wrap">
              {series.games.map((game, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    game.result === "win"
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  G{i + 1}: {game.score}
                </span>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Average score: <span className="font-bold text-foreground">{avgScore}</span>
              {!promoted && (
                <>
                  {" · "}Earn <span className="font-bold text-foreground">{SERIES_COOLDOWN_ELO} ELO</span> to retry
                </>
              )}
            </p>

            <Button size="sm" onClick={onClose} className="mt-1">
              {promoted ? "Continue" : "Keep Training"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
