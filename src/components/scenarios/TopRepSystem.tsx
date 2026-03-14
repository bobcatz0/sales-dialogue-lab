import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Swords, Target, TrendingUp, Trophy, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getEloRank } from "@/lib/elo";

export interface TopRep {
  scenarioKey: string; // "env:role" composite key
  displayName: string;
  avatarUrl: string | null;
  score: number;
  rank: string;
  elo: number;
  scorecardId: string;
}

// ── Hook: fetch top reps for all scenarios ──

export function useTopReps() {
  const [topReps, setTopReps] = useState<Map<string, TopRep>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get top scorecards grouped by scenario — we fetch top scores overall
      const { data } = await supabase
        .from("scorecards")
        .select("id, display_name, avatar_url, score, scenario_title, rank, elo")
        .order("score", { ascending: false })
        .limit(200);

      if (data) {
        const map = new Map<string, TopRep>();
        for (const s of data) {
          // Derive env:role key from scenario title
          const key = scenarioTitleToKey(s.scenario_title);
          if (key && !map.has(key)) {
            map.set(key, {
              scenarioKey: key,
              displayName: s.display_name,
              avatarUrl: s.avatar_url,
              score: s.score,
              rank: s.rank,
              elo: s.elo ?? 1000,
              scorecardId: s.id,
            });
          }
        }
        setTopReps(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { topReps, loading };
}

function scenarioTitleToKey(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("gatekeeper")) return "cold-call:gatekeeper";
  if (t.includes("budget") || t.includes("pricing")) return "enterprise:skeptical-buyer";
  if (t.includes("vendor") || t.includes("displacement")) return "cold-call:b2b-prospect";
  if (t.includes("discovery")) return "cold-call:b2b-prospect";
  if (t.includes("procurement") || t.includes("enterprise")) return "enterprise:decision-maker";
  if (t.includes("interview") || t.includes("pressure")) return "interview:hiring-manager";
  if (t.includes("technical")) return "enterprise:technical-evaluator";
  if (t.includes("champion")) return "enterprise:champion";
  if (t.includes("cold call")) return "cold-call:b2b-prospect";
  return null;
}

// ── TopRepBadge: inline display for scenario cards ──

export function TopRepBadge({ topRep }: { topRep: TopRep }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
      <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 overflow-hidden">
        {topRep.avatarUrl ? (
          <img src={topRep.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <Crown className="h-3.5 w-3.5 text-amber-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">Top Rep</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground truncate">{topRep.displayName}</span>
          <span className="text-[10px] text-muted-foreground">· {topRep.rank}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold font-heading text-foreground">{topRep.score}</p>
      </div>
    </div>
  );
}

// ── BeatTopRepResult: post-session comparison ──

export function BeatTopRepResult({ userScore, topRep, totalAttempts }: {
  userScore: number;
  topRep: TopRep | null;
  totalAttempts: number;
}) {
  if (!topRep) return null;

  const beat = userScore > topRep.score;
  const tied = userScore === topRep.score;
  const diff = userScore - topRep.score;

  // Simulated percentile based on score
  const percentile = Math.min(99, Math.max(1, Math.round(
    userScore >= 95 ? 99 :
    userScore >= 90 ? 95 + (userScore - 90) * 0.8 :
    userScore >= 80 ? 80 + (userScore - 80) * 1.5 :
    userScore >= 70 ? 55 + (userScore - 70) * 2.5 :
    userScore >= 60 ? 30 + (userScore - 60) * 2.5 :
    userScore >= 50 ? 10 + (userScore - 50) * 2 :
    userScore * 0.2
  )));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="h-0.5 bg-gradient-to-r from-amber-500/60 via-primary to-amber-500/60" />

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Beat the Top Rep</h3>
          {beat && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              🏆 NEW TOP REP!
            </span>
          )}
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* User score */}
          <div className={`rounded-lg p-3 text-center border ${beat ? "border-green-500/20 bg-green-500/5" : "border-border bg-muted/20"}`}>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Your Score</p>
            <p className={`text-2xl font-bold font-heading ${beat ? "text-green-400" : "text-foreground"}`}>
              {userScore}
            </p>
          </div>

          {/* Top rep score */}
          <div className="rounded-lg p-3 text-center border border-amber-500/15 bg-amber-500/5">
            <p className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold mb-1">Top Rep</p>
            <p className="text-2xl font-bold font-heading text-foreground">{topRep.score}</p>
            <p className="text-[10px] text-muted-foreground">{topRep.displayName}</p>
          </div>
        </div>

        {/* Difference */}
        <div className="flex items-center justify-center gap-2">
          {beat ? (
            <span className="text-xs font-bold text-green-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              +{diff} above top rep
            </span>
          ) : tied ? (
            <span className="text-xs font-bold text-amber-400">Tied with the top rep!</span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {Math.abs(diff)} points away from top rep
            </span>
          )}
        </div>

        {/* Percentile */}
        <div className="rounded-lg bg-muted/30 border border-border/50 p-3 text-center">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Your Percentile</p>
          <div className="flex items-center justify-center gap-1.5">
            <Trophy className={`h-4 w-4 ${percentile >= 90 ? "text-yellow-400" : percentile >= 70 ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-xl font-bold font-heading text-foreground">Top {100 - percentile}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Better than {percentile}% of all players
          </p>
        </div>

        {/* Percentile bar */}
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentile}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className={`h-full rounded-full ${
                percentile >= 90 ? "bg-gradient-to-r from-yellow-500 to-amber-400" :
                percentile >= 70 ? "bg-gradient-to-r from-primary to-primary/80" :
                "bg-gradient-to-r from-muted-foreground to-muted-foreground/80"
              }`}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
