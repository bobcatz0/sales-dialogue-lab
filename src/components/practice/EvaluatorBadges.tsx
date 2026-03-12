import { motion } from "framer-motion";
import { ShieldCheck, Star, UserCheck } from "lucide-react";

/** Verified Evaluator badge for profiles */
export function EvaluatorBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const isMd = size === "md";
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-400 font-bold ${
        isMd ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      <ShieldCheck className={isMd ? "h-3.5 w-3.5" : "h-3 w-3"} />
      Verified Evaluator
    </motion.span>
  );
}

/** Human Reviewed badge for sessions */
export function HumanReviewedBadge({
  evaluatorScore,
  onClick,
}: {
  evaluatorScore?: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 font-bold text-[10px] px-2.5 py-0.5 hover:bg-yellow-400/15 transition-colors cursor-pointer"
    >
      <UserCheck className="h-3 w-3" />
      Human Reviewed
      {evaluatorScore != null && (
        <span className="ml-0.5 text-yellow-300/80">· {evaluatorScore}/100</span>
      )}
    </motion.button>
  );
}

/** Evaluator reputation display */
export function EvaluatorReputation({
  reputation,
  reviewsGiven,
}: {
  reputation: number;
  reviewsGiven: number;
}) {
  const tier =
    reputation >= 100
      ? "Expert"
      : reputation >= 50
      ? "Senior"
      : reputation >= 20
      ? "Active"
      : "New";

  const tierColor =
    tier === "Expert"
      ? "text-yellow-400"
      : tier === "Senior"
      ? "text-blue-400"
      : tier === "Active"
      ? "text-primary"
      : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 text-yellow-400" />
        <span className="text-xs font-bold text-foreground">{reputation}</span>
        <span className="text-[10px] text-muted-foreground">rep</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{reviewsGiven} reviews</span>
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-wider ${tierColor}`}>
        {tier}
      </span>
    </div>
  );
}
