import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, XCircle, ArrowUp, Zap } from "lucide-react";
import type { PromotionResult as PromotionResultType } from "./promotionMatch";
import { PROMO_PASS_SCORE, PROMO_COOLDOWN_ELO } from "./promotionMatch";

interface PromotionResultModalProps {
  open: boolean;
  result: PromotionResultType | null;
  onClose: () => void;
}

export function PromotionResultModal({ open, result, onClose }: PromotionResultModalProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs text-center">
        <DialogHeader className="items-center">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`h-14 w-14 rounded-full flex items-center justify-center mb-2 ${
                  result.passed
                    ? "bg-primary/15"
                    : "bg-destructive/10"
                }`}
              >
                {result.passed ? (
                  <Trophy className="h-7 w-7 text-primary" />
                ) : (
                  <XCircle className="h-7 w-7 text-destructive" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <DialogTitle className="text-base font-heading">
            {result.passed ? "Promotion Earned!" : "Promotion Failed"}
          </DialogTitle>

          <DialogDescription asChild>
            <div className="space-y-2 mt-1">
              {result.passed ? (
                <>
                  <div className="flex items-center justify-center gap-1.5">
                    <ArrowUp className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-bold text-primary">{result.targetRank}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You scored <span className="font-bold text-foreground">{result.sessionScore}</span> and earned your
                    promotion. Welcome to <span className="font-semibold text-primary">{result.targetRank}</span>.
                  </p>
                  {result.newElo && (
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      <Zap className="h-2.5 w-2.5 mr-1" />
                      ELO: {result.newElo}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    You scored <span className="font-bold text-foreground">{result.sessionScore}</span>. 
                    Needed <span className="font-bold">{PROMO_PASS_SCORE}+</span> to promote to{" "}
                    <span className="font-semibold">{result.targetRank}</span>.
                  </p>
                  <p className="text-[10px] text-muted-foreground/80">
                    Earn <span className="font-bold text-foreground">{PROMO_COOLDOWN_ELO}</span> more ELO to unlock another attempt.
                  </p>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Button size="sm" onClick={onClose} className="mt-1 mx-auto">
          {result.passed ? "Continue" : "Keep Training"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
