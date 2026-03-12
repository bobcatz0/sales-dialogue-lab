import { motion } from "framer-motion";
import { Zap, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PromotionEligibility } from "./promotionMatch";
import { PROMO_PASS_SCORE } from "./promotionMatch";

interface PromotionBannerProps {
  eligibility: PromotionEligibility;
  onStartPromotion: () => void;
}

export function PromotionBanner({ eligibility, onStartPromotion }: PromotionBannerProps) {
  if (!eligibility.nextRank) return null;

  // Cooldown state
  if (eligibility.inCooldown) {
    return (
      <div className="card-elevated border-border/50 p-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">Promotion Locked</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Earn <span className="font-bold text-foreground">{eligibility.cooldownEloRemaining} more ELO</span> before
          attempting another promotion to <span className="font-semibold">{eligibility.nextRank}</span>.
        </p>
      </div>
    );
  }

  // Eligible state
  if (eligibility.eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card-elevated border-primary/30 p-3 mb-4"
      >
        {/* Subtle glow */}
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
              <span className="text-xs font-bold text-primary">Promotion Match Available</span>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 h-[18px] border-primary/40 text-primary">
              {eligibility.currentRank} → {eligibility.nextRank}
            </Badge>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed mb-2.5">
            You're <span className="font-bold text-foreground">{eligibility.eloNeeded} ELO</span> away from{" "}
            <span className="font-semibold text-primary">{eligibility.nextRank}</span>. 
            Score <span className="font-bold text-foreground">{PROMO_PASS_SCORE}+</span> in a high-stakes interview to promote instantly.
          </p>

          <Button
            size="sm"
            onClick={onStartPromotion}
            className="w-full h-8 text-xs font-bold gap-1.5"
          >
            <Zap className="h-3 w-3" />
            Start Promotion Match
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Not in zone — show progress toward zone
  if (eligibility.eloNeeded > 0 && eligibility.eloNeeded <= 100) {
    return (
      <div className="card-elevated border-border/30 p-2.5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Next promotion zone: <span className="font-semibold text-foreground">{eligibility.nextRank}</span>
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
