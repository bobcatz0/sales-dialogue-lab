import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Check, ArrowRight, Clock, Trophy, Crown, TrendingUp, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTodayChallenge } from "./dailyChallenge";
import { ENVIRONMENTS } from "./environments";
import { roles } from "./roleData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStreakXpMultiplier } from "./StreakReward";
import type { EnvironmentId } from "./environments";

interface DailyChallengeCardProps {
  onStart?: (envId: EnvironmentId, personaId: string) => void;
}

function useCountdown() {
  const [text, setText] = useState("");
  useEffect(() => {
    function calc() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    setText(calc());
    const i = setInterval(() => setText(calc()), 1000);
    return () => clearInterval(i);
  }, []);
  return text;
}

interface LeaderEntry { name: string; score: number }

export function DailyChallengeCard({ onStart }: DailyChallengeCardProps) {
  const { challenge, completed } = getTodayChallenge();
  const { profile } = useAuth();
  const currentStreak = (profile as any)?.current_streak ?? 0;
  const longestStreak = (profile as any)?.longest_streak ?? 0;
  const xpMultiplier = getStreakXpMultiplier(currentStreak);
  const isOnFire = currentStreak >= 3;
  const env = ENVIRONMENTS.find((e) => e.id === challenge.environmentId);
  const persona = roles.find((r) => r.id === challenge.personaId);
  const countdown = useCountdown();
  const [topScores, setTopScores] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("scorecards")
      .select("display_name, score")
      .gte("created_at", `${today}T00:00:00`)
      .order("score", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTopScores(data.map((d) => ({ name: d.display_name, score: d.score })));
        }
      });
  }, []);

  if (!env || !persona) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated overflow-hidden"
    >
      {/* Accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Daily Challenge</span>
          </div>
          <div className="flex items-center gap-1.5">
            {completed ? (
              <Badge variant="default" className="text-[10px] gap-1 bg-primary/15 text-primary border-0">
                <Check className="h-3 w-3" />
                Done
              </Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono tabular-nums">
                <Clock className="h-3 w-3" />
                {countdown}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">
            {env.title} → <span className="text-foreground font-medium">{persona.title}</span>
          </p>
          <p className="text-xs text-foreground font-medium">
            Focus: {challenge.skillFocus}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {challenge.successLabel}
          </p>
        </div>

        {/* ELO bonus hint */}
        <div className="flex items-center gap-1.5 text-[10px] text-primary/80">
          <TrendingUp className="h-3 w-3" />
          <span>Top 3 earn bonus ELO: 🥇+30 🥈+20 🥉+10</span>
        </div>

        {/* Streak display */}
        {currentStreak > 0 && (
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
            isOnFire ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30"
          }`}>
            <div className="flex items-center gap-2">
              <Flame className={`h-3.5 w-3.5 ${isOnFire ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-bold tabular-nums ${isOnFire ? "text-primary" : "text-foreground"}`}>
                {currentStreak} day streak
              </span>
              {currentStreak >= longestStreak && currentStreak > 1 && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">BEST</span>
              )}
            </div>
            {xpMultiplier > 1 && (
              <span className="text-[10px] font-semibold text-primary">
                {Math.round((xpMultiplier - 1) * 100)}% XP bonus
              </span>
            )}
          </div>
        )}

        {topScores.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/40">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
              <Trophy className="h-3 w-3 text-amber-400" />
              Today's Top
            </div>
            {topScores.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate flex items-center gap-1.5">
                  {i === 0 ? <Crown className="h-3 w-3 text-amber-400" /> : <span className="w-3 text-center text-[10px]">#{i + 1}</span>}
                  {entry.name}
                </span>
                <span className={`font-bold tabular-nums font-heading ${i === 0 ? "text-primary" : "text-foreground"}`}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}

        {completed ? (
          <p className="text-[10px] text-muted-foreground/70 text-center pt-1">
            Next challenge resets at midnight
          </p>
        ) : (
          <button
            onClick={() => onStart?.(challenge.environmentId, challenge.personaId)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1"
          >
            Begin Session
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
