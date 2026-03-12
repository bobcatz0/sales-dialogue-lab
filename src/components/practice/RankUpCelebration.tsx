import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, ChevronUp, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RankTier } from "@/lib/elo";

const RANK_CONFIG: Record<RankTier, { color: string; glow: string; icon: string }> = {
  Rookie: { color: "text-muted-foreground", glow: "shadow-none", icon: "🔰" },
  Prospector: { color: "text-orange-400", glow: "shadow-[0_0_40px_hsl(30,80%,50%,0.2)]", icon: "⛏️" },
  Closer: { color: "text-primary", glow: "shadow-[0_0_40px_hsl(145,72%,50%,0.25)]", icon: "🤝" },
  Operator: { color: "text-blue-400", glow: "shadow-[0_0_40px_hsl(210,80%,55%,0.25)]", icon: "⚡" },
  Rainmaker: { color: "text-yellow-400", glow: "shadow-[0_0_60px_hsl(45,90%,55%,0.3)]", icon: "🌧️" },
  "Sales Architect": { color: "text-purple-400", glow: "shadow-[0_0_60px_hsl(270,70%,55%,0.3)]", icon: "👑" },
};

interface RankUpCelebrationProps {
  newRank: RankTier;
  oldRank: RankTier;
  newElo: number;
  onClose: () => void;
}

export function RankUpCelebration({ newRank, oldRank, newElo, onClose }: RankUpCelebrationProps) {
  const [show, setShow] = useState(true);
  const config = RANK_CONFIG[newRank];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 400);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
          onClick={() => { setShow(false); setTimeout(onClose, 400); }}
        >
          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: "50vw",
                  y: "50vh",
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: `${15 + Math.random() * 70}vw`,
                  y: `${10 + Math.random() * 80}vh`,
                  scale: [0, 1.2, 0.8, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 1.5,
                  delay: Math.random() * 0.6,
                  ease: "easeOut",
                }}
                className={`absolute w-2 h-2 rounded-full ${
                  i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-yellow-400" : "bg-purple-400"
                }`}
              />
            ))}
          </div>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className={`relative card-elevated p-8 max-w-sm w-full mx-4 text-center space-y-5 ${config.glow}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => { setShow(false); setTimeout(onClose, 400); }}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Sparkle icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="relative">
                <Sparkles className={`h-10 w-10 ${config.color}`} />
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className={`absolute inset-0 rounded-full blur-xl opacity-30 ${config.color}`}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-1"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Rank Up!
              </p>
              <h2 className="font-heading text-3xl font-bold text-foreground">
                {RANK_CONFIG[newRank].icon} {newRank}
              </h2>
            </motion.div>

            {/* Rank transition */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center justify-center gap-3"
            >
              <span className={`text-sm font-medium ${RANK_CONFIG[oldRank].color}`}>
                {oldRank}
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <ChevronUp className="h-5 w-5 text-primary rotate-90" />
              </motion.div>
              <span className={`text-sm font-bold ${config.color}`}>
                {newRank}
              </span>
            </motion.div>

            {/* ELO display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65, type: "spring", stiffness: 300 }}
              className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 mx-auto"
            >
              <Crown className={`h-4 w-4 ${config.color}`} />
              <span className="text-xl font-bold font-heading text-foreground">{newElo}</span>
              <span className="text-xs text-muted-foreground">ELO</span>
            </motion.div>

            {/* Dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                variant="default"
                size="sm"
                onClick={() => { setShow(false); setTimeout(onClose, 400); }}
                className="mt-2"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
