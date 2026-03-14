import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, ChevronUp, AlertTriangle, TrendingUp, Flame } from "lucide-react";
import { awardSkillXp, getSkillLevelInfo } from "@/lib/skillXp";
import { toast } from "sonner";
import { SkillLevelUpToast } from "./SkillLevelsDisplay";
import { getStreakXpMultiplier } from "./StreakReward";

interface SkillXpSummaryProps {
  userId: string;
  skillBreakdown: { name: string; score: number }[];
  onXpAwarded?: () => void;
  currentStreak?: number;
}

export function SkillXpSummary({ userId, skillBreakdown, onXpAwarded, currentStreak = 0 }: SkillXpSummaryProps) {
  const [xpResults, setXpResults] = useState<{ name: string; score: number; xpGained: number }[]>([]);
  const [weakestSkill, setWeakestSkill] = useState<{ name: string; score: number } | null>(null);
  const [awarded, setAwarded] = useState(false);

  const multiplier = getStreakXpMultiplier(currentStreak);
  const hasBonus = multiplier > 1;

  useEffect(() => {
    if (awarded || !userId || skillBreakdown.length === 0) return;
    setAwarded(true);

    // Calculate XP awards with streak multiplier
    const results = skillBreakdown.map((s) => {
      const base = s.score >= 90 ? 30 : s.score >= 80 ? 25 : s.score >= 70 ? 20 : s.score >= 60 ? 15 : s.score >= 50 ? 10 : 5;
      return {
        name: s.name,
        score: s.score,
        xpGained: Math.round(base * multiplier),
      };
    });
    setXpResults(results);

    // Find weakest
    const weakest = skillBreakdown.reduce((a, b) => (a.score <= b.score ? a : b));
    setWeakestSkill(weakest);

    // Award XP with streak multiplier
    awardSkillXp(userId, skillBreakdown, multiplier).then(({ levelUps }) => {
      for (const lu of levelUps) {
        toast(<SkillLevelUpToast skillName={lu.skillName} newLevel={lu.newLevel} title={lu.title} />);
      }
      onXpAwarded?.();
    });
  }, [userId, skillBreakdown, awarded, onXpAwarded, multiplier]);

  if (xpResults.length === 0) return null;

  const totalXp = xpResults.reduce((sum, r) => sum + r.xpGained, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">Skill XP Earned</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {hasBonus && (
            <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Flame className="h-2.5 w-2.5" />
              {Math.round((multiplier - 1) * 100)}% bonus
            </span>
          )}
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            +{totalXp} XP
          </span>
        </div>
      </div>

      {/* Per-skill XP gains */}
      <div className="space-y-2">
        {xpResults.map((result, i) => (
          <motion.div
            key={result.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TrendingUp className={`h-3 w-3 shrink-0 ${
                result.score >= 70 ? "text-primary" : result.score >= 50 ? "text-muted-foreground" : "text-destructive"
              }`} />
              <span className="text-xs text-foreground truncate">{result.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-muted-foreground tabular-nums">{result.score}/100</span>
              <span className="text-[11px] font-bold text-primary tabular-nums">+{result.xpGained}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weakest skill callout */}
      {weakestSkill && weakestSkill.score < 70 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="rounded-lg p-3 bg-destructive/5 border border-destructive/15"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
              Weakest Skill Detected
            </span>
          </div>
          <p className="text-xs text-foreground font-semibold">{weakestSkill.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Score: {weakestSkill.score}/100 — Focus on this skill in your next session to level up faster.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
