import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedScoreProps {
  target: number;
  delay?: number;
  className?: string;
}

export function AnimatedScore({ target, delay = 0, className = "" }: AnimatedScoreProps) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "calculating" | "counting" | "done">("waiting");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Phase 1: "Calculating..."
    const t1 = setTimeout(() => setPhase("calculating"), delay * 1000);

    // Phase 2: Count up
    const t2 = setTimeout(() => {
      setPhase("counting");
      const duration = 1200;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = (now - start) / duration;
        const progress = Math.min(elapsed, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setPhase("done");
        }
      };
      requestAnimationFrame(step);
    }, (delay + 1.2) * 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [target, delay]);

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {phase === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-16 flex items-center"
          >
            <span className="text-sm text-muted-foreground">Preparing results…</span>
          </motion.div>
        )}
        {phase === "calculating" && (
          <motion.div
            key="calculating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="h-16 flex items-center gap-1.5"
          >
            <span className="text-sm text-muted-foreground">Calculating performance</span>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block h-1 w-1 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
        {(phase === "counting" || phase === "done") && (
          <motion.span
            key="score"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={className}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
