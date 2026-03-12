import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  target,
  duration = 1.2,
  delay = 0,
  className = "",
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isInView || hasStarted.current) return;
    hasStarted.current = true;

    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = (now - start) / (duration * 1000);
        const progress = Math.min(elapsed, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [isInView, target, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

interface RankBadgeProps {
  rank: string;
  delay?: number;
}

const rankStyles: Record<string, { bg: string; text: string; glow: string }> = {
  "Sales Architect": { bg: "bg-purple-500/15", text: "text-purple-400", glow: "shadow-[0_0_12px_hsl(270_60%_60%/0.3)]" },
  "Rainmaker": { bg: "bg-yellow-500/15", text: "text-yellow-400", glow: "shadow-[0_0_12px_hsl(45_90%_55%/0.3)]" },
  "Operator": { bg: "bg-blue-500/15", text: "text-blue-400", glow: "shadow-[0_0_12px_hsl(210_80%_55%/0.3)]" },
  "Closer": { bg: "bg-primary/15", text: "text-primary", glow: "shadow-[0_0_12px_hsl(145_72%_50%/0.3)]" },
  "Prospector": { bg: "bg-orange-500/15", text: "text-orange-400", glow: "shadow-[0_0_12px_hsl(30_90%_55%/0.3)]" },
  "Rookie": { bg: "bg-muted", text: "text-muted-foreground", glow: "" },
};

export function RankBadge({ rank, delay = 0 }: RankBadgeProps) {
  const style = rankStyles[rank] ?? rankStyles["Rookie"];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        type: "spring",
        stiffness: 400,
        damping: 15,
      }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.text} ${style.glow} border border-current/10`}
    >
      {rank}
    </motion.span>
  );
}

interface EloDeltaProps {
  delta: number;
  delay?: number;
}

export function EloDelta({ delta, delay = 0 }: EloDeltaProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className="inline-flex items-center text-xs font-bold text-primary"
    >
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ delay: delay + 0.4, duration: 0.6, repeat: 2 }}
      >
        +{delta}
      </motion.span>
    </motion.span>
  );
}
