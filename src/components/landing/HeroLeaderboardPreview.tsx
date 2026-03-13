import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowRight, Crown, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getEloRank } from "@/lib/elo";
import { UserAvatar } from "@/components/UserAvatar";

interface TopPlayer {
  id: string;
  display_name: string;
  avatar_url: string | null;
  elo: number;
  total_sessions: number;
}

function getRankColor(rank: string) {
  switch (rank) {
    case "Sales Architect": return "text-purple-400";
    case "Rainmaker": return "text-yellow-400";
    case "Operator": return "text-blue-400";
    case "Closer": return "text-primary";
    case "Prospector": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

export default function HeroLeaderboardPreview() {
  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, elo, total_sessions")
        .gte("total_sessions", 1)
        .order("elo", { ascending: false })
        .limit(5);

      if (data) setPlayers(data);
      setLoaded(true);
    })();
  }, []);

  if (!loaded) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (players.length === 0) return null;

  const medals = [
    <Crown key="1" className="h-3.5 w-3.5 text-yellow-500" />,
    <Medal key="2" className="h-3.5 w-3.5 text-muted-foreground" />,
    <Medal key="3" className="h-3.5 w-3.5 text-amber-600" />,
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Top Players</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary gap-1 px-2" asChild>
          <Link to="/leaderboard">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-border/30">
        {players.map((player, i) => {
          const rank = getEloRank(player.elo);
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20 transition-colors"
            >
              <span className="w-5 shrink-0 flex justify-center">
                {i < 3 ? medals[i] : (
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                )}
              </span>
              <UserAvatar
                avatarUrl={player.avatar_url}
                displayName={player.display_name}
                elo={player.elo}
                size="xs"
                showRankBadge={false}
                showName={false}
              />
              <span className="text-[11px] font-semibold text-foreground truncate flex-1">
                {player.display_name}
              </span>
              <span className={`text-[9px] font-bold shrink-0 ${getRankColor(rank)}`}>
                {rank}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline">
                {player.total_sessions} sess
              </span>
              <span className="text-xs font-bold font-heading text-foreground tabular-nums shrink-0">
                {player.elo}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
