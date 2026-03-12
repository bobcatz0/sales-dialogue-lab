import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, LogIn, User } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEloRank, ELO_RANKS } from "@/lib/elo";
import { EloHistoryChart } from "@/components/practice/EloHistoryChart";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  elo: number;
  total_sessions: number;
}

function getMedalIcon(index: number) {
  if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
  if (index === 2) return <Medal className="h-4 w-4 text-amber-600" />;
  return null;
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

const LeaderboardPage = () => {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, elo, total_sessions")
        .order("elo", { ascending: false })
        .limit(50);

      if (data) {
        setEntries(data);
        if (user) {
          const idx = data.findIndex((e) => e.id === user.id);
          setUserRank(idx >= 0 ? idx + 1 : null);
        }
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Compete against other sellers. Climb the ranks.
            </p>
          </div>

          {/* User card or sign-in prompt */}
          {user && profile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="card-elevated p-5 flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-heading font-bold text-foreground truncate">
                  {profile.display_name}
                </p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-2xl font-bold font-heading text-foreground">{profile.elo}</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold border-primary/40 ${getRankColor(getEloRank(profile.elo))}`}>
                    {getEloRank(profile.elo)}
                  </Badge>
                  {userRank && (
                    <span className="text-xs text-muted-foreground">
                      #{userRank} overall
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="card-elevated p-6 text-center space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Sign in to track your ELO rating and appear on the leaderboard.
              </p>
              <Button variant="default" size="sm" asChild>
                <Link to="/login" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            </motion.div>
          )}

          {/* ELO History Chart */}
          <EloHistoryChart />

          {/* Rank tiers legend */}
          <div className="flex flex-wrap justify-center gap-2">
            {ELO_RANKS.map((r) => (
              <span key={r.name} className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-muted ${getRankColor(r.name)}`}>
                {r.name} ({r.min}+)
              </span>
            ))}
          </div>

          {/* Leaderboard table */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading leaderboard…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No players yet. Be the first to{" "}
                <Link to="/scenarios" className="text-primary hover:underline">practice</Link>!
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elevated overflow-hidden"
            >
              {/* Table header */}
              <div className="grid grid-cols-[3rem_1fr_5rem_7rem] md:grid-cols-[3rem_1fr_5rem_7rem_5rem] items-center px-5 py-3 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Rank</span>
                <span>Player</span>
                <span className="text-right">ELO</span>
                <span className="text-right">Tier</span>
                <span className="hidden md:block text-right">Sessions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
                {entries.map((entry, i) => {
                  const rank = getEloRank(entry.elo);
                  const isCurrentUser = user?.id === entry.id;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.03 }}
                      className={`grid grid-cols-[3rem_1fr_5rem_7rem] md:grid-cols-[3rem_1fr_5rem_7rem_5rem] items-center px-5 py-3 transition-colors ${
                        isCurrentUser ? "bg-primary/5" : "hover:bg-muted/30"
                      } ${i === 0 ? "bg-primary/5" : ""}`}
                    >
                      {/* Rank number */}
                      <div className="flex items-center justify-center">
                        {getMedalIcon(i) || (
                          <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>
                        )}
                      </div>

                      {/* Player */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`text-sm font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                          {entry.display_name}
                          {isCurrentUser && <span className="text-[10px] text-muted-foreground ml-1">(you)</span>}
                        </span>
                      </div>

                      {/* ELO */}
                      <div className="text-right">
                        <span className={`text-sm font-bold font-heading ${i === 0 ? "text-primary" : "text-foreground"}`}>
                          {entry.elo}
                        </span>
                      </div>

                      {/* Rank tier */}
                      <div className="text-right">
                        <span className={`text-[11px] font-semibold ${getRankColor(rank)}`}>
                          {rank}
                        </span>
                      </div>

                      {/* Sessions */}
                      <div className="hidden md:block text-right">
                        <span className="text-xs text-muted-foreground">{entry.total_sessions}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
