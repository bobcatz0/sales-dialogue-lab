import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setRankThresholds, type RankThreshold } from "@/lib/elo";

/**
 * Fetches percentile-based rank thresholds from the DB function
 * and pushes them into the ELO module cache.
 * Mount once near the app root.
 */
export function useRankThresholds() {
  const { data } = useQuery({
    queryKey: ["rank-thresholds"],
    queryFn: async (): Promise<RankThreshold[]> => {
      const { data, error } = await supabase.rpc("get_percentile_rank_thresholds");
      if (error || !data) return [];
      return (data as { rank_name: string; min_elo: number }[]).map((r) => ({
        name: r.rank_name,
        min: r.min_elo,
      }));
    },
    staleTime: 5 * 60 * 1000, // refresh every 5 min
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      setRankThresholds(data);
    }
  }, [data]);
}
