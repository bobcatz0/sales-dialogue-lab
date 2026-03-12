import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getEloRank } from "@/lib/elo";
import { formatDistanceToNow } from "date-fns";

interface ActivityEntry {
  id: string;
  user_id: string;
  display_name: string;
  delta: number;
  elo: number;
  session_score: number;
  created_at: string;
}

interface ClanActivityFeedProps {
  memberUserIds: string[];
}

export function ClanActivityFeed({ memberUserIds }: ClanActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberUserIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);

      const { data: history } = await supabase
        .from("elo_history")
        .select("id, user_id, delta, elo, session_score, created_at")
        .in("user_id", memberUserIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!history || history.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const uniqueIds = [...new Set(history.map((h) => h.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", uniqueIds);

      const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

      setActivities(
        history.map((h) => ({
          ...h,
          display_name: nameMap.get(h.user_id) ?? "Unknown",
        }))
      );
      setLoading(false);
    };

    fetch();
  }, [memberUserIds.join(",")]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs text-muted-foreground">Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <Activity className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No recent activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {activities.map((a, idx) => {
          const isPositive = a.delta >= 0;
          const rank = getEloRank(a.elo);

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="card-elevated px-4 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-md ${isPositive ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    <span className="font-semibold">{a.display_name}</span>
                    <span className="text-muted-foreground"> scored </span>
                    <span className="font-bold text-primary">{a.session_score}</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-sm font-bold tabular-nums ${isPositive ? "text-primary" : "text-destructive"}`}>
                  {isPositive ? "+" : ""}{a.delta}
                </span>
                <p className="text-[10px] text-muted-foreground">{a.elo} ELO</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
