import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, LogIn, User, Flame, ShieldCheck, Shield } from "lucide-react";
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
  weekly_elo_gain?: number;
  is_evaluator?: boolean;
  clan_name?: string;
}

interface ClanMemberInfo {
  user_id: string;
  clans: { name: string } | { name: string }[] | null;
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

type Tab = "all-time" | "weekly";

const LeaderboardPage = () => {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("all-time");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      const orderCol = tab === "weekly" ? "weekly_elo_gain" : "elo";
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, elo, total_sessions, weekly_elo_gain, is_evaluator")
        .order(orderCol, { ascending: false })
        .limit(50);

      if (data) {
        const filtered = tab === "weekly"
          ? data.filter((e) => (e.weekly_elo_gain ?? 0) > 0)
          : data;

        // Fetch clan affiliations for all users
        const userIds = filtered.map((e) => e.id);
        const { data: clanData } = await supabase
          .from("clan_members")
          .select("user_id, clans:clan_id(name)")
          .in("user_id", userIds);

        const clanMap = new Map<string, string>();
        if (clanData) {
          for (const cm of clanData as unknown as ClanMemberInfo[]) {
            const clan = Array.isArray(cm.clans) ? cm.clans[0] : cm.clans;
            if (clan?.name) clanMap.set(cm.user_id, clan.name);
          }
        }

        const enriched: LeaderboardEntry[] = filtered.map((e) => ({
          ...e,
          clan_name: clanMap.get(e.id),
        }));

        setEntries(enriched);
        if (user) {
          const idx = enriched.findIndex((e) => e.id === user.id);
          setUserRank(idx >= 0 ? idx + 1 : null);
        }
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [user, tab]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Trophy className="h-7 w-7 text-primary" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Compete against other players. Climb the ranks.
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
                  {profile.display_name} <span className={`text-sm ${getRankColor(getEloRank(profile.elo))}`}>[{getEloRank(profile.elo)}]</span>
                </p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-2xl font-bold font-heading text-foreground">{profile.elo}</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold border-primary/40 ${getRankColor(getEloRank(profile.elo))}`}>
                    {getEloRank(profile.elo)}
                  </Badge>
                  {userRank && (
                    <span className="text-xs text-muted-foreground">
                      #{userRank} {tab === "weekly" ? "this week" : "overall"}
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

          {/* Tab switcher */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setTab("all-time")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "all-time"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="h-3.5 w-3.5 inline mr-1.5" />
              All Time
            </button>
            <button
              onClick={() => setTab("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "weekly"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="h-3.5 w-3.5 inline mr-1.5" />
              This Week
            </button>
          </div>

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
                {tab === "weekly"
                  ? "No activity this week yet. Be the first to "
                  : "No players yet. Be the first to "}
                <Link to="/practice" className="text-primary hover:underline">practice</Link>!
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-elevated overflow-hidden"
            >
              {/* Table header */}
              <div className={`grid ${tab === "weekly" ? "grid-cols-[3rem_1fr_5rem_5rem]" : "grid-cols-[3rem_1fr_5rem_7rem] md:grid-cols-[3rem_1fr_5rem_7rem_5rem]"} items-center px-5 py-3 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider`}>
                <span>Rank</span>
                <span>Player</span>
                {tab === "weekly" ? (
                  <>
                    <span className="text-right">Gained</span>
                    <span className="text-right">ELO</span>
                  </>
                ) : (
                  <>
                    <span className="text-right">ELO</span>
                    <span className="text-right">Tier</span>
                    <span className="hidden md:block text-right">Sessions</span>
                  </>
                )}
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
                      transition={{ delay: 0.15 + i * 0.03 }}
                      className={`grid ${tab === "weekly" ? "grid-cols-[3rem_1fr_5rem_5rem]" : "grid-cols-[3rem_1fr_5rem_7rem] md:grid-cols-[3rem_1fr_5rem_7rem_5rem]"} items-center px-5 py-3 transition-colors ${
                        isCurrentUser ? "bg-primary/5" : "hover:bg-muted/30"
                      } ${i === 0 ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center justify-center">
                        {getMedalIcon(i) || (
                          <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>
                        )}
                      </div>

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
                        </span>
                        <span className={`text-[10px] font-bold ${getRankColor(rank)}`}>[{rank}]</span>
                        {isCurrentUser && <span className="text-[10px] text-muted-foreground">(you)</span>}
                        {entry.is_evaluator && (
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        )}
                        {entry.clan_name && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-primary/30 text-primary shrink-0">
                            <Shield className="h-2.5 w-2.5" />
                            {entry.clan_name}
                          </Badge>
                        )}
                      </div>

                      {tab === "weekly" ? (
                        <>
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary">
                              +{entry.weekly_elo_gain ?? 0}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">{entry.elo}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-right">
                            <span className={`text-sm font-bold font-heading ${i === 0 ? "text-primary" : "text-foreground"}`}>
                              {entry.elo}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[11px] font-semibold ${getRankColor(rank)}`}>
                              {rank}
                            </span>
                          </div>
                          <div className="hidden md:block text-right">
                            <span className="text-xs text-muted-foreground">{entry.total_sessions}</span>
                          </div>
                        </>
                      )}
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
