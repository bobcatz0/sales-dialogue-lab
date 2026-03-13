import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GhostOpponent {
  id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  rank: string;
  elo: number | null;
  scenario_title: string;
}

/**
 * Fetches a "ghost" opponent from scorecards matching the scenario.
 * Picks a random scorecard near the user's ELO for a fair matchup.
 * Skips if the session is a pro challenge (already has a competitor).
 */
export function useGhostBattle({
  scenarioEnv,
  scenarioRole,
  userElo,
  isProChallenge,
  sessionActive,
}: {
  scenarioEnv: string | null;
  scenarioRole: string | null;
  userElo: number;
  isProChallenge: boolean;
  sessionActive: boolean;
}) {
  const [ghost, setGhost] = useState<GhostOpponent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionActive || !scenarioEnv || !scenarioRole || isProChallenge) {
      setGhost(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchGhost = async () => {
      // Find scorecards within ±200 ELO for a fair matchup, same environment
      const lowerElo = Math.max(800, userElo - 200);
      const upperElo = userElo + 200;

      const { data } = await supabase
        .from("scorecards")
        .select("id, display_name, avatar_url, score, rank, elo, scenario_title")
        .gte("elo", lowerElo)
        .lte("elo", upperElo)
        .gte("score", 40) // minimum quality
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;

      if (data && data.length > 0) {
        // Pick a random ghost from the pool
        const pick = data[Math.floor(Math.random() * data.length)];
        setGhost(pick as GhostOpponent);
      } else {
        // Fallback: get any recent scorecard
        const { data: fallback } = await supabase
          .from("scorecards")
          .select("id, display_name, avatar_url, score, rank, elo, scenario_title")
          .gte("score", 50)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!cancelled && fallback && fallback.length > 0) {
          const pick = fallback[Math.floor(Math.random() * fallback.length)];
          setGhost(pick as GhostOpponent);
        }
      }
      setLoading(false);
    };

    fetchGhost();
    return () => { cancelled = true; };
  }, [sessionActive, scenarioEnv, scenarioRole, userElo, isProChallenge]);

  const clearGhost = () => setGhost(null);

  return { ghost, loading, clearGhost };
}

/**
 * Calculate ghost battle ELO adjustment.
 * Win = +8, Loss = -5, Tie (within 3 pts) = +2
 */
export function calculateGhostElo(userScore: number, ghostScore: number): {
  beatGhost: boolean;
  tied: boolean;
  eloDelta: number;
} {
  const diff = userScore - ghostScore;
  if (Math.abs(diff) <= 3) {
    return { beatGhost: false, tied: true, eloDelta: 2 };
  }
  if (diff > 0) {
    return { beatGhost: true, tied: false, eloDelta: 8 };
  }
  return { beatGhost: false, tied: false, eloDelta: -5 };
}
